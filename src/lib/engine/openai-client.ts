// OpenAI provider for the prompt engine. Same `callLLM<T>()` contract as
// the Gemini client so stages can swap providers freely.
//
// Every pipeline stage passes its model explicitly (see models.ts); the
// default below is only a safety net for callers that don't.
//
// We use Structured Outputs (response_format json_schema) with
// strict:false. Strict mode requires every property to be `required` and
// additionalProperties:false, but our schemas intentionally have optional
// branches (e.g. `question` vs `already_good_notes`). strict:false keeps
// strong schema adherence without that constraint. A defensive JSON parse
// remains as a backstop.

import { MODELS } from './models'

const MODEL = MODELS.diagnose
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

// One request; the timeout guards against a hung connection.
//
// The old 20s was set when this ran on nano. diagnose now runs on gpt-5.4-mini,
// a reasoning model with a 3400-token budget, and measured live it lands at
// 2-6s typical with a tail that touched 20.0s - i.e. the cap was clipping calls
// that were about to succeed, and each clip cost the user the whole request.
// 25s keeps a real ceiling while leaving the tail room to land.
const TIMEOUT_MS = 25000

interface LLMRequest {
  systemPrompt: string
  userMessage: string
  temperature?: number
  maxOutputTokens?: number
  /**
   * JSON Schema the response must conform to. Passed to OpenAI Structured
   * Outputs (strict:false). Optional - falls back to plain json_object.
   */
  responseSchema?: Record<string, unknown>
  /** Override the default model (Pro rewrites use a stronger one). */
  model?: string
  /** Override the default request timeout. See TIMEOUT_MS. */
  timeoutMs?: number
}

/**
 * Why a call failed, so callers can retry the failures worth retrying.
 *
 * The distinction earns its keep on `timeout`: retrying a call that already
 * burned the full budget doubles the user's wait for another coin flip. A
 * `parse` or `empty` failure comes back fast and is worth a second try.
 */
export type LLMFailure = 'no_key' | 'http' | 'empty' | 'parse' | 'timeout' | 'network'

export interface LLMOutcome<T> {
  data: T | null
  failure?: LLMFailure
  ms: number
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>
}

/**
 * strict:false lets the model answer in the shape of the SCHEMA instead of in
 * the shape the schema describes:
 *
 *   { "type": "object", "properties": { "intent": "general", "score": {...} } }
 *
 * The answer is all there, wrapped one level too deep, so every caller that
 * reads `result.score` sees undefined and reports a failure. Measured on the
 * live model this happens on thin prompts ("shorter" reproduced it), which is
 * exactly the input the extension sees most.
 *
 * Unwrapping is safe because a real response never carries BOTH a literal
 * "type":"object" and a "properties" object - those are schema keywords, and
 * none of our schemas define a field called `properties`.
 */
export function unwrapSchemaEcho<T>(value: unknown): T {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).type === 'object' &&
    (value as Record<string, unknown>).properties &&
    typeof (value as Record<string, unknown>).properties === 'object'
  ) {
    return (value as Record<string, unknown>).properties as T
  }
  return value as T
}

/**
 * The same echo can appear on a single FIELD rather than the whole object
 * (observed on already_good_notes), leaving a schema fragment where a string
 * or an array should be. Anything still carrying schema keywords is not data.
 */
export function isSchemaFragment(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const v = value as Record<string, unknown>
  return typeof v.type === 'string' && ('properties' in v || 'items' in v || 'description' in v)
}

function parseJSON<T>(raw: string): T | null {
  if (!raw) return null
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  try {
    return unwrapSchemaEcho<T>(JSON.parse(cleaned))
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try { return unwrapSchemaEcho<T>(JSON.parse(match[0])) } catch { /* fall through */ }
    }
    return null
  }
}

/**
 * Streaming plain-text completion. Unlike callLLM (which returns parsed
 * JSON), this yields raw text chunks as they arrive - for the fast-path
 * sharpen flow where perceived latency is everything and the output is a
 * bare prompt, not structured data.
 *
 * Yields incremental content deltas. The caller concatenates them. Throws
 * on a hard failure so the route can fall back or surface an error.
 */
export async function* streamLLM(req: {
  systemPrompt: string
  userMessage: string
  model?: string
  maxOutputTokens?: number
}): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const model = req.model ?? MODEL
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: true,
        ...(model.startsWith('gpt-5')
          ? { max_completion_tokens: (req.maxOutputTokens ?? 700) * 2 + 400 }
          : { temperature: 0.4, max_tokens: req.maxOutputTokens ?? 700 }),
        messages: [
          { role: 'system', content: req.systemPrompt },
          { role: 'user', content: req.userMessage },
        ],
      }),
    })

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '')
      console.error(`[openai] ${model} stream error ${res.status}: ${detail.slice(0, 200)}`)
      throw new Error(`OpenAI stream ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE frames are separated by double newlines; each data: line is JSON.
      const frames = buffer.split('\n\n')
      buffer = frames.pop() ?? ''
      for (const frame of frames) {
        const line = frame.trim()
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') return
        try {
          const json = JSON.parse(payload)
          const delta = json.choices?.[0]?.delta?.content
          if (delta) yield delta as string
        } catch {
          // partial/keepalive frame - ignore
        }
      }
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Back-compat wrapper: most stages only care whether they got data. */
export async function callLLM<T>(req: LLMRequest): Promise<T | null> {
  return (await callLLMDetailed<T>(req)).data
}

export async function callLLMDetailed<T>(req: LLMRequest): Promise<LLMOutcome<T>> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('[openai] OPENAI_API_KEY is not set')
    return { data: null, failure: 'no_key', ms: 0 }
  }

  const model = req.model ?? MODEL

  const controller = new AbortController()
  const started = Date.now()
  const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? TIMEOUT_MS)

  const response_format = req.responseSchema
    ? {
        type: 'json_schema' as const,
        json_schema: {
          name: 'prompt_analysis',
          strict: false,
          schema: req.responseSchema,
        },
      }
    : { type: 'json_object' as const }

  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      // gpt-5.x models take max_completion_tokens (max_tokens is a 400)
      // and only run at default temperature. Their budget also covers
      // hidden reasoning tokens, so we give 2x headroom on top of the
      // requested output size and pin reasoning effort low - otherwise
      // reasoning can consume the whole budget and return empty content.
      body: JSON.stringify({
        model,
        ...(model.startsWith('gpt-5')
          ? {
              max_completion_tokens: (req.maxOutputTokens ?? 1024) * 2 + 1000,
              reasoning_effort: 'low',
            }
          : {
              temperature: req.temperature ?? 0.3,
              max_tokens: req.maxOutputTokens ?? 1024,
            }),
        response_format,
        messages: [
          { role: 'system', content: req.systemPrompt },
          { role: 'user', content: req.userMessage },
        ],
      }),
    })

    const ms = Date.now() - started

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[openai] ${model} error ${res.status} in ${ms}ms: ${detail.slice(0, 300)}`)
      const { captureError } = await import('../observability')
      captureError(new Error(`OpenAI ${model} ${res.status}`), { detail: detail.slice(0, 500) })
      return { data: null, failure: 'http', ms }
    }

    const data: OpenAIResponse = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    if (!text) {
      console.error(`[openai] ${model} empty content in ${ms}ms: ${JSON.stringify(data).slice(0, 400)}`)
      return { data: null, failure: 'empty', ms }
    }

    const parsed = parseJSON<T>(text)
    if (parsed === null) {
      console.error(`[openai] ${model} unparseable JSON in ${ms}ms: ${text.slice(0, 300)}`)
      return { data: null, failure: 'parse', ms }
    }
    return { data: parsed, ms }
  } catch (err) {
    const ms = Date.now() - started
    const isAbort = (err as Error).name === 'AbortError'
    console.error(
      `[openai] ${model} ${isAbort ? `timeout_after_${ms}ms` : `fetch_error:${(err as Error).message}`}`,
    )
    return { data: null, failure: isAbort ? 'timeout' : 'network', ms }
  } finally {
    clearTimeout(timer)
  }
}
