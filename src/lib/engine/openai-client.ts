// OpenAI provider for the prompt engine. Drop-in replacement for the old
// Gemini client: same request shape, same `callLLM<T>()` contract, so
// engine/index.ts only swaps the import.
//
// Model: gpt-4.1-nano - cheap ($0.10/$0.40 per 1M), fast, no reasoning
// overhead, and reliable at instruction-following + JSON. Right-sized for
// scoring and rewriting a prompt.
//
// We use Structured Outputs (response_format json_schema) with
// strict:false. Strict mode requires every property to be `required` and
// additionalProperties:false, but our schema intentionally leaves
// `question` and `improvement` optional (the model returns one OR the
// other). strict:false keeps strong schema adherence without that
// constraint. A defensive JSON parse remains as a backstop.

const MODEL = 'gpt-4.1-nano'
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

// One request; the timeout guards against a hung connection. gpt-4.1-nano
// is fast, so 20s is comfortable headroom without stacking latency.
const TIMEOUT_MS = 20000

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
  /** Override the default model (Pro Deep Rewrite uses a stronger one). */
  model?: string
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>
}

function parseJSON<T>(raw: string): T | null {
  if (!raw) return null
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) as T } catch { /* fall through */ }
    }
    return null
  }
}

export async function callLLM<T>(req: LLMRequest): Promise<T | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('[openai] OPENAI_API_KEY is not set')
    return null
  }

  const model = req.model ?? MODEL

  const controller = new AbortController()
  const started = Date.now()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

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
      body: JSON.stringify({
        model,
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxOutputTokens ?? 1024,
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
      return null
    }

    const data: OpenAIResponse = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    if (!text) {
      console.error(`[openai] ${model} empty content in ${ms}ms: ${JSON.stringify(data).slice(0, 400)}`)
      return null
    }

    const parsed = parseJSON<T>(text)
    if (parsed === null) {
      console.error(`[openai] ${model} unparseable JSON in ${ms}ms: ${text.slice(0, 300)}`)
      return null
    }
    return parsed
  } catch (err) {
    const ms = Date.now() - started
    const isAbort = (err as Error).name === 'AbortError'
    console.error(
      `[openai] ${model} ${isAbort ? `timeout_after_${ms}ms` : `fetch_error:${(err as Error).message}`}`,
    )
    return null
  } finally {
    clearTimeout(timer)
  }
}
