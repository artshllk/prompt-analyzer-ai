import { streamLLM } from './openai-client'
import { MODELS } from './models'
import type { Tone } from '@/types/database'

/**
 * Fast-path sharpen: the extension's default inline action.
 *
 * One streaming call, no reasoning effort, no rubric audit, no
 * interpretation forks - just a tight rewrite streamed token-by-token so
 * the first word lands in under a second. This is the "one keystroke,
 * result streams in" path. The heavy diagnostic pipeline
 * (analyzePrompt()) stays for the "see why" panel and the website.
 *
 * Pure and portable, same rule as analyzePrompt() - no Next/Supabase/HTTP
 * imports, so the extension route and any future client can call it.
 */

const TONE_HINT: Record<Tone, string> = {
  friendly: 'Warm, plain, second-person.',
  professional: 'Exact and neutral.',
  persuasive: 'Lead with the outcome.',
  concise: 'As short as the task allows.',
  creative: 'Vivid and specific.',
}

function systemPrompt(tone: Tone): string {
  return `You rewrite a user's rough prompt into a sharper one they can paste straight into ChatGPT, Claude, or Gemini. You are fast and surgical.

Rules:
- Return ONLY the rewritten prompt. No preamble, no quotes, no explanation, no markdown fences.
- Keep the user's intent and any voice in the original. Fix what's genuinely missing: unclear goal, missing format, missing constraints, vague scope.
- If a detail is truly unknown, make ONE reasonable assumption and fold it in naturally - do not add "Assume:" scaffolding or bracketed placeholders.
- Never invent facts, numbers, or product details the user didn't give.
- Add no persona or pleasantries unless the task needs them. No bloat. Match length to the task; a simple prompt stays short.
- ${TONE_HINT[tone] ?? TONE_HINT.professional}

Output the rewritten prompt and nothing else.`
}

/**
 * Streams the sharpened prompt as text deltas. Caller concatenates.
 * Throws on hard failure (route decides fallback).
 *
 * `choice` is the interpretation the user picked from the inline fork
 * chips (see quick-fork.ts). When present it is ground truth: the rewrite
 * must commit to that reading rather than hedging across all of them.
 */
export async function* streamSharpen(params: {
  prompt: string
  tone: Tone
  choice?: string
}): AsyncGenerator<string, void, unknown> {
  const user = params.choice
    ? `<prompt>\n${params.prompt.trim()}\n</prompt>\n\n` +
      `The user clarified what they want: ${params.choice.trim()}\n` +
      `Treat that as ground truth. Commit to it fully - do not hedge or cover the other readings.`
    : params.prompt.trim()

  yield* streamLLM({
    model: MODELS.sharpen,
    systemPrompt: systemPrompt(params.tone),
    userMessage: user,
    maxOutputTokens: 700,
  })
}
