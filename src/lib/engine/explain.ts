import { diagnose, toRubricAudit } from './diagnose'
import { callLLM } from './openai-client'
import { MODELS } from './models'
import type { RubricAudit } from '@/types'

/**
 * Explain a sharpen that already happened.
 *
 * This is the "why?" panel's ONLY job: teach the user what was weak in
 * their original prompt and what the rewrite actually did about it. It
 * produces NO rewrite and asks NO question - the question was already
 * asked inline, before the rewrite, and a second one here is incoherent.
 *
 * Honest by construction: it reports the real score, the real gaps, what
 * the rewrite fixed, and - crucially - what it could NOT fix, because a
 * rewrite cannot invent facts the user never gave. Holding that back
 * would be the dishonest part.
 *
 * Pure and portable - no Next/Supabase/HTTP imports.
 */

export interface Explanation {
  /** Clarity of the ORIGINAL prompt, 0-100. */
  score: number
  audit: RubricAudit
  /** What the rewrite actually changed, in plain language. */
  changes: string[]
  /** What the rewrite could not fix - facts only the user knows. */
  stillMissing: string[]
  /** One line: the single most useful lesson for next time. */
  lesson: string
}

const CHANGES_SCHEMA = {
  type: 'object',
  properties: {
    changes: {
      type: 'array',
      description: '2-4 concrete things the rewrite did, each one short and plain',
      items: { type: 'string' },
    },
    still_missing: {
      type: 'array',
      description:
        'Facts the rewrite had to guess or leave open because only the user knows them. Empty if none. Be honest - do not pretend the rewrite solved everything.',
      items: { type: 'string' },
    },
    lesson: {
      type: 'string',
      description: 'One short sentence: the habit that would make their next prompt better.',
    },
  },
  required: ['changes', 'still_missing', 'lesson'],
} as const

export async function explainSharpen(params: {
  original: string
  sharpened: string
}): Promise<Explanation | null> {
  // Diagnose the ORIGINAL - that is what we are explaining. This stage
  // never rewrites and never forks.
  const diag = await diagnose({
    prompt: params.original,
    tone: 'professional',
    priorAnswers: [],
  })
  if (!diag) return null

  const compare = await callLLM<{
    changes: string[]
    still_missing: string[]
    lesson: string
  }>({
    model: MODELS.diagnose,
    systemPrompt: `Compare a user's original prompt with the improved version and explain, plainly and honestly, what changed.

Write for a smart person who is not a prompt engineer. Short words, short sentences, no jargon.

- changes: 2-4 specific things the rewrite did. Name the actual change ("set a length of 300 words", "said who the reader is"), never vague praise ("made it clearer").
- still_missing: be honest. A rewrite cannot invent facts the user never gave - it can only guess. List anything the rewrite had to assume or leave open that only the user can settle. If it genuinely fixed everything, return an empty list. Do NOT pad this.
- lesson: one sentence naming the habit that would make their next prompt better.

Return JSON matching the schema.`,
    userMessage: [
      '<original>',
      params.original.trim(),
      '</original>',
      '',
      '<improved>',
      params.sharpened.trim(),
      '</improved>',
    ].join('\n'),
    maxOutputTokens: 600,
    responseSchema: CHANGES_SCHEMA as unknown as Record<string, unknown>,
  })

  return {
    score: diag.score.total,
    audit: toRubricAudit(diag),
    changes: compare?.changes ?? [],
    stillMissing: compare?.still_missing ?? [],
    lesson: compare?.lesson ?? '',
  }
}
