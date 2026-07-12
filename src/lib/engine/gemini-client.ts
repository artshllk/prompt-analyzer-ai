import { GEMINI_CASCADE } from './models'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
// Worst case is exactly MODELS.length attempts (no same-model retries).
// A same-model retry of an identical prompt rarely turns a timeout into
// a success and doubles the wall-time budget - that stacking is what
// produced the 17s+ failures. Resilience comes from the fallback MODEL.
// 20s per call: the rewrite/critic stages generate 1.4-1.8k tokens of
// structured JSON, which the old 12s ceiling false-failed. Absolute
// worst case stays bounded at ~cascade-length * 20s (rare).
const TIMEOUT_MS = 20000

interface GeminiRequest {
  systemPrompt: string
  userMessage: string
  temperature?: number
  maxOutputTokens?: number
  /**
   * JSON Schema (Gemini OpenAPI subset) the response must conform to.
   * When set, Gemini guarantees parseable JSON matching the schema -
   * eliminates the "invalid JSON, retrying" loop entirely.
   */
  responseSchema?: Record<string, unknown>
  /** Override the fallback cascade (strongest first). Defaults to GEMINI_CASCADE. */
  models?: readonly string[]
}

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> }
  }>
}

/**
 * Result of one model attempt. `reason` is never empty - every path
 * names why it ended, so a 503 is never silent in the logs.
 */
interface ModelResult {
  text: string
  transient: boolean
  reason: string
}

async function callModel(model: string, req: GeminiRequest): Promise<ModelResult> {
  const controller = new AbortController()
  const started = Date.now()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(
      `${GEMINI_BASE}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: req.systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: req.userMessage }] }],
          generationConfig: {
            temperature: req.temperature ?? 0.3,
            // Gemini 2.5+ models think by default and thought tokens count
            // against maxOutputTokens - without headroom, large structured
            // responses get truncated mid-JSON and fail to parse.
            maxOutputTokens: (req.maxOutputTokens ?? 1024) * 2 + 1000,
            responseMimeType: 'application/json',
            ...(req.responseSchema ? { responseSchema: req.responseSchema } : {}),
          },
        }),
      }
    )

    const ms = Date.now() - started

    if (res.status === 429 || res.status >= 500) {
      return { text: '', transient: true, reason: `http_${res.status}_in_${ms}ms` }
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[gemini] ${model} error ${res.status} in ${ms}ms: ${detail.slice(0, 300)}`)
      const { captureError } = await import('../observability')
      captureError(new Error(`Gemini ${model} ${res.status}`), { detail: detail.slice(0, 500) })
      return { text: '', transient: false, reason: `http_${res.status}` }
    }

    const data: GeminiResponse = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!text) {
      // 200 OK but empty - almost always a safety block or finishReason
      // other than STOP. Log the raw shape so we can see it.
      console.error(`[gemini] ${model} empty text in ${ms}ms: ${JSON.stringify(data).slice(0, 400)}`)
      return { text: '', transient: false, reason: `empty_response_in_${ms}ms` }
    }
    return { text, transient: false, reason: `ok_in_${ms}ms` }
  } catch (err) {
    const ms = Date.now() - started
    const isAbort = (err as Error).name === 'AbortError'
    return {
      text: '',
      transient: isAbort,
      reason: isAbort ? `timeout_after_${ms}ms` : `fetch_error:${(err as Error).message}`,
    }
  } finally {
    clearTimeout(timer)
  }
}

function parseJSON<T>(raw: string): T | null {
  if (!raw) return null
  // responseMimeType: 'application/json' should give us pure JSON,
  // but strip code fences defensively in case the model ignores it.
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Try to extract the first {...} block (rare model misbehavior)
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) as T } catch { /* fall through */ }
    }
    return null
  }
}

export async function callGemini<T>(req: GeminiRequest): Promise<T | null> {
  const trail: string[] = []

  // One attempt per model, in order. No same-model retry - that
  // stacking is what created the 17s+ failures. Resilience comes from
  // falling through to the next model. Worst case = cascade-length calls.
  for (const model of req.models ?? GEMINI_CASCADE) {
    const result = await callModel(model, req)
    trail.push(`${model}:${result.reason}`)

    if (result.text) {
      const parsed = parseJSON<T>(result.text)
      if (parsed !== null) return parsed
      // Parse failed despite responseSchema. Rare. Fall to next model.
      trail.push(`${model}:parse_failed`)
      continue
    }
    // Empty / timeout / http error → try the fallback model.
    continue
  }

  // Every analyze failure is now explained in one line.
  console.error(`[gemini] all attempts failed -> ${trail.join(' | ')}`)
  return null
}
