import { callLLM } from './openai-client'
import { MODELS } from './models'
import { asString, asText, asStringArray, asObjectArray, isText } from './coerce'

/**
 * "Finish your prompt" - what the why? panel actually does.
 *
 * The old version was a REPORT: what was weak, what would have happened,
 * what the rewrite did, plus a lesson. Twenty bullet points of prose about
 * a prompt the user had already fixed. Nobody reads a post-mortem, and
 * nobody gets attached to one.
 *
 * The only part with real pull was "what we could not fix" - because it is
 * the only forward-looking thing. It names a gap the user can actually
 * close. So that becomes the whole product: the gaps come back as short,
 * answerable questions, the user fills them in, and the prompt visibly
 * gets better. A tool, not a lecture.
 *
 * Pure and portable - no Next/Supabase/HTTP imports.
 */

export interface Gap {
  /** Short label for the missing thing: "Your goal", "Length", "Who reads it". */
  label: string
  /** The question, asked plainly. One short line. */
  question: string
  /** 2-4 tappable example answers. The user can also type their own. */
  examples: string[]
  /** Why it matters, in <=12 words. Shown small, under the question. */
  why: string
}

export interface Explanation {
  /** One short line: the single most important thing still missing. */
  headline: string
  /** The fillable gaps, most important first. Max 3 - more is a wall. */
  gaps: Gap[]
}

const SCHEMA = {
  type: 'object',
  properties: {
    headline: {
      type: 'string',
      description:
        'One short line naming the single biggest thing still missing. Under 12 words. If nothing is missing, say what makes it strong instead.',
    },
    gaps: {
      type: 'array',
      description:
        'The 1-3 most valuable things only the user can supply. Ordered by how much they would improve the result. Empty if the prompt is genuinely complete.',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: '1-3 words, e.g. "Your goal", "Length", "Who reads it"' },
          question: { type: 'string', description: 'One short plain question. Under 10 words.' },
          examples: {
            type: 'array',
            description: '2-4 realistic example answers, each 1-5 words, tappable as-is',
            items: { type: 'string' },
          },
          why: { type: 'string', description: 'Why it matters. Under 12 words.' },
        },
        required: ['label', 'question', 'examples', 'why'],
      },
    },
  },
  required: ['headline', 'gaps'],
} as const

const SYSTEM_PROMPT = `A user's prompt has been improved by an AI. Your job: find what is STILL missing that only the user can answer, and turn each one into a question they can answer in seconds.

This is not a report. Do not explain what was wrong before, do not praise the rewrite, do not teach a lesson. Only look forward: what would make this prompt genuinely better, that we cannot guess for them?

Rules:
- Max 3 gaps. Pick the ones that would change the OUTPUT the most. Three good ones beat six weak ones.
- EVERY gap must have all four fields filled: label, question, examples (2-4 of them), why. Never omit examples.
- Only ask for things a person can answer instantly from their own head. Never ask them to do research.
- Never ask for something the prompt already says.
- examples: give 2-4 realistic answers they could tap without typing. Short - 1 to 5 words. Make them genuinely different from each other.
- question: under 10 words, plain English, no jargon.
- why: under 12 words. Concrete ("Changes which exercises fit you"), never vague ("improves quality").
- If the prompt is genuinely complete, return gaps: [] and a headline saying what makes it strong.

Language: plain, everyday English. Short words. A non-native speaker must get it on first read.

Return JSON matching the schema.`

export async function explainSharpen(params: {
  original: string
  sharpened: string
  /**
   * What this user has told us before, strongest habits first. When a gap
   * comes up that they have answered before, their usual answer is offered
   * first - so the engine stops asking the same question cold, forever.
   */
  memory?: Array<{ label: string; answer: string }>
}): Promise<Explanation | null> {
  const memory = params.memory ?? []

  const memoryBlock = memory.length
    ? [
        '',
        '<what_this_user_usually_says>',
        ...memory.map(m => `${m.label}: ${m.answer}`),
        '</what_this_user_usually_says>',
        '',
        'If you raise a gap this user has answered before, put their usual answer FIRST in examples, worded exactly as they said it. Do not skip the gap just because you know their habit - a habit is not a rule, and this prompt may be the exception. Offer it, do not assume it.',
      ].join('\n')
    : ''

  const res = await callLLM<Explanation>({
    model: MODELS.diagnose,
    systemPrompt: SYSTEM_PROMPT,
    userMessage: [
      "<what_the_user_originally_asked_for>",
      params.original.trim(),
      '</what_the_user_originally_asked_for>',
      '',
      '<the_improved_prompt_they_now_have>',
      params.sharpened.trim(),
      '</the_improved_prompt_they_now_have>',
      memoryBlock,
    ].join('\n'),
    maxOutputTokens: 700,
    responseSchema: SCHEMA as unknown as Record<string, unknown>,
  })

  if (!res || !isText(res.headline)) return null

  // Defensive: a gap missing its examples would break the tap-to-answer UI,
  // so normalise every field rather than trusting the model.
  // String() was doing the coercing here, which turns an object into the
  // literal text "[object Object]" and puts it in a tappable chip. Dropped
  // rather than coerced now: a gap the model malformed is a gap we do not ask.
  const gaps: Gap[] = asObjectArray(res.gaps, 3)
    .map(g => ({
      label: asText(g.label),
      question: asText(g.question),
      why: asString(g.why),
      examples: asStringArray(g.examples, 4),
    }))
    .filter(g => g.label && g.question)

  return {
    headline: asText(res.headline),
    gaps,
  }
}

/**
 * The user answered one or more gaps. Fold their answers into the prompt.
 * Returns the improved prompt only - the panel swaps it into their box.
 */
export async function applyAnswers(params: {
  prompt: string
  answers: Array<{ label: string; answer: string }>
}): Promise<string | null> {
  const res = await callLLM<{ prompt: string }>({
    model: MODELS.diagnose,
    systemPrompt: `Fold the user's answers into their prompt.

Rules:
- Return ONLY the updated prompt. No preamble, no explanation, no fences.
- Work each answer in naturally, where it belongs. Do not bolt them on as a list at the end.
- Change nothing else. Keep the rest of the prompt exactly as it is.
- Never invent detail beyond what they told you.
- No em dashes. Use a comma, a full stop, or a colon.

Return JSON: {"prompt": "..."}`,
    userMessage: [
      '<prompt>',
      params.prompt.trim(),
      '</prompt>',
      '',
      '<answers>',
      ...params.answers.map(a => `${a.label}: ${a.answer}`),
      '</answers>',
    ].join('\n'),
    maxOutputTokens: 900,
    responseSchema: {
      type: 'object',
      properties: { prompt: { type: 'string' } },
      required: ['prompt'],
    } as unknown as Record<string, unknown>,
  })

  return res?.prompt?.trim() || null
}
