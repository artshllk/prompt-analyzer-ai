const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'] as const
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const TIMEOUT_MS = 12000
const MAX_RETRIES = 2

interface GeminiRequest {
  systemPrompt: string
  userMessage: string
  temperature?: number
  maxOutputTokens?: number
  /**
   * JSON Schema (Gemini OpenAPI subset) the response must conform to.
   * When set, Gemini guarantees parseable JSON matching the schema —
   * eliminates the "invalid JSON, retrying" loop entirely.
   */
  responseSchema?: Record<string, unknown>
}

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> }
  }>
}

async function callModel(
  model: string,
  req: GeminiRequest
): Promise<{ text: string; transient: boolean } | null> {
  const controller = new AbortController()
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
            maxOutputTokens: req.maxOutputTokens ?? 1024,
            responseMimeType: 'application/json',
            ...(req.responseSchema ? { responseSchema: req.responseSchema } : {}),
          },
        }),
      }
    )

    if (res.status === 429 || res.status >= 500) {
      return { text: '', transient: true }
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`Gemini ${model} error ${res.status}: ${detail.slice(0, 200)}`)
      return null
    }

    const data: GeminiResponse = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return { text, transient: false }
  } catch (err) {
    const isAbort = (err as Error).name === 'AbortError'
    return { text: '', transient: isAbort }
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
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const result = await callModel(model, req)

      if (result && result.text) {
        const parsed = parseJSON<T>(result.text)
        if (parsed !== null) return parsed
        // Parse failed despite responseSchema — log once and try next model.
        // No point retrying same model with same prompt; output is deterministic-ish.
        console.warn(`Gemini ${model} returned unparseable JSON; falling back`)
        break
      }

      // No result, or transient error → retry same model
      if (result?.transient && attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 400 * attempt))
        continue
      }
      break
    }
  }

  return null
}
