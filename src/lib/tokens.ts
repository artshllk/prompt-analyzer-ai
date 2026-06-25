/**
 * Token counting for the playground + live demo.
 *
 * Uses `gpt-tokenizer` with the GPT-4o encoding (`o200k_base` cl100k
 * variant). This is a good cross-model estimate — close to Claude and
 * Gemini for typical English prose, and exact for ChatGPT (GPT-4o /
 * GPT-4-turbo).
 *
 * The encoder is loaded lazily so the marketing bundle doesn't ship
 * it unless a user actually types into the demo. Until the encoder
 * lands, `approxTokens` gives a fast synchronous estimate (~5% off
 * for English text) so the UI never has to wait.
 */

type Encoder = (text: string) => number[]

let cached: Encoder | null = null
let loading: Promise<Encoder> | null = null

async function getEncoder(): Promise<Encoder> {
  if (cached) return cached
  if (loading) return loading
  loading = import('gpt-tokenizer/model/gpt-4o').then(mod => {
    cached = mod.encode
    return cached
  })
  return loading
}

/** Exact token count using gpt-tokenizer. Loads the encoder on first call. */
export async function countTokens(text: string): Promise<number> {
  const trimmed = text.trim()
  if (!trimmed) return 0
  const encode = await getEncoder()
  return encode(trimmed).length
}

/** Synchronous estimate. Average 3.5 characters per GPT-4 token in English. */
export function approxTokens(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return Math.max(1, Math.round(trimmed.length / 3.5))
}
