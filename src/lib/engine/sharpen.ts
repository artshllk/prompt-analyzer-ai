import { streamLLM } from './openai-client'
import { MODELS } from './models'
import { RUBRICS, type Rubric } from './rubrics'
import type { IntentClass } from '@/types'
import type { Tone } from '@/types/database'

/**
 * Fast-path sharpen: the extension's default inline action.
 *
 * One streaming call, streamed token-by-token so the first word lands in
 * under a second.
 *
 * It used to be deliberately dumb - fix what is broken, add nothing. That
 * produced rewrites that were tidier but not smarter, and every one came out
 * the same shape. It now carries the per-domain expertise from rubrics.ts
 * (nine fields of "what an expert would actually demand"), which was written
 * and then never used by this path. An expert does not just tidy your prompt;
 * they add what you did not know to ask for.
 *
 * Still ONE call. The model works out the domain itself - a separate
 * classification round-trip would cost the sub-second feel that makes the
 * whole product work.
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
  return `You are an expert at whatever the user is actually trying to do, and you rewrite their rough prompt into one they can paste straight into ChatGPT, Claude, or Gemini.

First, silently work out what kind of task this is. Then rewrite it the way an expert in THAT field would - not the way a generic prompt template would.

${EXPERTISE}

JUDGMENT ON PERSONAS ("act as a senior engineer...")
There is no blanket rule here. Use your head:
- When the user is writing a prompt for an AI to BE something - a system prompt, an agent, a chatbot, a tutor, an interviewer - the role IS the deliverable. Do not describe a "Role section" for them to fill in. WRITE IT: "You are a patient support agent for a Shopify store. You never invent a policy you have not been told." Then write the rules, the edge cases, and the refusals, in full, as the finished prompt they will paste in.
- ADD a role when the output genuinely depends on a point of view they have not given: a code review, a critique, a devil's advocate, a persona-driven piece of writing.
- DO NOT add one to ordinary work. "You are a world-class 10x developer" bolted onto "fix this bug" adds nothing, and an engineer reading it will assume the tool is unserious. Concrete constraints beat borrowed authority every single time.

DO NOT PRODUCE THE SAME SHAPE EVERY TIME
A code spec, a cold email brief, a research question and a system prompt should not look alike. Let the task decide the shape: a spec wants inputs/outputs/acceptance; a system prompt wants sections and edge cases; a short creative ask wants one sharp paragraph. Never impose a template.

Rules:
- Return ONLY the rewritten prompt. No preamble, no quotes, no explanation, no markdown fences.
- Keep the user's intent and any voice in the original.
- Add the things an expert would KNOW to include that the user did not think of. This is the part that makes the rewrite worth having.
- If a detail is truly unknown, make ONE reasonable assumption and fold it in naturally - no "Assume:" scaffolding, no [bracketed placeholders].
- Never invent facts, numbers, or product details the user did not give.
- If the prompt asks the AI to clarify or to push back, say so plainly: "Ask me anything you need before you start. Do not guess."
- No bloat. Match length to the task. A simple prompt stays short.
- ${TONE_HINT[tone] ?? TONE_HINT.professional}

Output the rewritten prompt and nothing else.`
}

/**
 * What an expert in each field actually demands - lifted from rubrics.ts,
 * which had nine domains of this knowledge written down and completely unused
 * by the fast path. That is the difference between a rewrite that is merely
 * tidier and one that is genuinely better than what the user would have
 * written: an expert knows what to ASK FOR that you did not think of.
 *
 * Injected as one static block rather than a separate classification call -
 * the model can work out the domain itself, and a second round-trip would
 * cost the sub-second feel that makes the whole product work.
 */
const EXPERTISE = `WHAT AN EXPERT IN EACH FIELD DEMANDS (apply only the one that fits)

${(Object.entries(RUBRICS) as Array<[IntentClass, Rubric]>)
  .filter(([intent]) => intent !== 'general')
  .map(([, r]) => `- ${r.label}: ${r.rewriteStrategy}`)
  .join('\n')}`

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
