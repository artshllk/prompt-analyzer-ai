import { callLLM } from './openai-client'
import { MODELS } from './models'
import { asText, asString, asObjectArray } from './coerce'

/**
 * Quick fork check: does this prompt mean two or three genuinely different
 * things? One small nano call, no rubric audit, no rewrite - just the
 * decision plus the readings.
 *
 * This is what lets the inline sharpen ASK when it matters instead of
 * silently guessing. The heavy analyzePrompt() pipeline still exists for
 * the full diagnosis, but the user never has to opt into a report to get
 * the one question that actually changes their result.
 *
 * Pure and portable - no Next/Supabase/HTTP imports.
 */

export interface QuickFork {
  /** Short, human question. Empty when the prompt is clear enough. */
  question: string
  /** 2-3 concrete readings, each a one-click answer. Empty when unambiguous. */
  options: Array<{ label: string; summary: string }>
}

const SCHEMA = {
  type: 'object',
  properties: {
    ambiguous: {
      type: 'boolean',
      description: 'true only if 2+ readings would produce a substantially different rewrite',
    },
    question: {
      type: 'string',
      description: 'Short, natural question answered by picking an option. Empty string when not ambiguous.',
    },
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: '2-5 plain words' },
          summary: { type: 'string', description: 'One short line: what you would get' },
        },
        required: ['label', 'summary'],
      },
    },
  },
  required: ['ambiguous', 'question', 'options'],
} as const

const SYSTEM_PROMPT = `Decide whether a user's prompt is genuinely ambiguous before an AI rewrites it.

Ambiguous means: two or three reasonable people would read this prompt and want SUBSTANTIALLY different results. Not merely "it could have more detail" - almost every prompt could. The test is whether the rewrite itself would differ meaningfully.

If ambiguous, produce:
- question: ONE short, natural question a helpful colleague would ask. Under 10 words if you can. Write it fresh for THIS prompt. Never use a stock opener like "I can read this a few ways". Do NOT list the options inside the question - they appear as buttons.
- options: 2-3 concrete readings. Each has a short plain label (2-5 words) and a one-line summary of what the user would get.
- LANGUAGE: write the question, every label, and every summary in the language the user wrote their prompt in. If they mixed languages, use the dominant one. A question in German above English buttons is a broken screen. Within that language, keep it plain and everyday, the kind a non-native speaker gets on first read. Ban business and technical jargon outright, in labels AND summaries: no "B2B", "SaaS", "self-serve", "funnel", "conversion", "positioning", "persona", "ICP", "developer experience". Say who reads it and what they do, in ordinary words ("for business teams who want to save time", not "B2B productivity").
- No em dashes anywhere.

If NOT ambiguous (the intent is clear enough to just rewrite it well), set ambiguous=false, question="", options=[].

Calibration - this is the part people get wrong:
- A short prompt that names only a TOPIC or an ARTIFACT, with no audience, purpose, or output shape ("help me write a javascript array", "write a blog post about X", "make a logo", "analyze my data"), IS ambiguous. The rewrite genuinely differs depending on the answer. Ask.
- A prompt that already states the goal, the constraints, and what a good result looks like is NOT ambiguous, even if more detail could exist. Do not ask.
- Never ask about something the prompt already settles.

Return JSON matching the schema.`

export async function quickFork(prompt: string): Promise<QuickFork | null> {
  const res = await callLLM<{
    ambiguous: boolean
    question: string
    options: Array<{ label: string; summary: string }>
  }>({
    // Deliberately the mini model, not nano. Nano systematically UNDER-asks:
    // it called "help me write a javascript array" unambiguous when it plainly
    // is not. Judging ambiguity needs real reasoning. This runs in parallel
    // with the sharpen stream, so its extra second costs the user nothing.
    model: MODELS.diagnose,
    systemPrompt: SYSTEM_PROMPT,
    userMessage: prompt.trim(),
    maxOutputTokens: 400,
    responseSchema: SCHEMA as unknown as Record<string, unknown>,
  })

  if (!res) return null

  // Every field here is rendered: the question and each label go straight
  // into the DOM, as React children on the web and as textContent in the
  // extension. A non-string label throws "Objects are not valid as a React
  // child" on one surface and prints "[object Object]" on the other, so
  // nothing reaches a caller without going through the coercers.
  const question = asText(res.question)
  const options = asObjectArray(res.options)
    .map(o => ({ label: asText(o.label), summary: asString(o.summary) }))
    .filter(o => o.label)
    .slice(0, 3)

  // An option the user cannot choose between is not a fork. Below two, there
  // is no question worth asking, whatever the model said about ambiguity.
  if (!res.ambiguous || !question || options.length < 2) {
    return { question: '', options: [] }
  }
  return { question, options }
}
