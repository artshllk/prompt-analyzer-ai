import { callLLM } from '@/lib/engine/openai-client'
import { MODELS } from '@/lib/engine/models'
import { asText, asEnum, asObjectArray } from '@/lib/engine/coerce'
import { normalizeDocument, locateAll } from './locate'
import {
  type Claim,
  type ClaimKind,
  MAX_CLAIMS_PER_DOC,
  MAX_DOC_CHARS,
  MIN_DOC_CHARS,
} from './types'

/**
 * Finding the claims in a document that someone could challenge you on.
 *
 * Pure and portable: no Next, no Supabase, no HTTP beyond the model client.
 * The local script and the route both call this, and the eval will too.
 *
 * THE TENSION THIS STAGE LIVES IN
 *
 * Over-extract and the document comes back with forty marks on it, which is
 * noise, and noise is useless however accurate each mark is. Under-extract and
 * we miss the fabricated statistic, which is the entire reason anyone opened
 * the tool.
 *
 * The resolution is to extract generously and rank, rather than to be shy.
 * Better to find thirty and show twenty than to find twelve and miss the one.
 * What decides the ranking is a single question, and it is the question the
 * prompt is built around: WOULD A READER BE MISLED IF THIS WERE WRONG.
 *
 * THE FAILURE MODE, NAMED SO IT IS NOT FORGOTTEN
 *
 * The claim we most need is the fabricated statistic that reads as background
 * prose. "Roughly a third of small businesses fail in the first two years" is
 * exactly the shape of a hallucination and exactly the shape of a true
 * commonplace, and an extractor tuned for tidiness skips it because it looks
 * like scene setting. The prompt calls this out directly, because a general
 * instruction to "find claims" reliably does not catch it.
 */

const KINDS: readonly ClaimKind[] = [
  'statistic',
  'citation',
  'url',
  'quote',
  'attribution',
  'assertion',
] as const

const SCHEMA = {
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      description: 'Checkable claims, in the order they appear in the document.',
      items: {
        type: 'object',
        properties: {
          quote: {
            type: 'string',
            description:
              'The claim copied from the document CHARACTER FOR CHARACTER. Do not tidy it, do not fix its punctuation, do not straighten its quote marks, do not merge lines. This string is searched for in the original text, so any edit makes it unfindable.',
          },
          claim_text: {
            type: 'string',
            description:
              'The same claim rewritten to stand on its own, with pronouns and references resolved. "It rose 40%" becomes "UK smartphone adoption rose 40% between 2020 and 2023". This is what gets searched for, so it must make sense to someone who has not read the document.',
          },
          kind: {
            type: 'string',
            enum: [...KINDS],
          },
        },
        required: ['quote', 'claim_text', 'kind'],
      },
    },
  },
  required: ['claims'],
} as const

const SYSTEM_PROMPT = `You find the factual claims in a document that a careful reader could challenge, so the writer can check them before they send it.

# WHAT COUNTS AS A CHECKABLE CLAIM

Something that is either true or false about the world, and that someone could look up.

- statistic: any number, percentage, quantity, money amount, date range or growth figure
- citation: a named study, paper, report, book or dataset
- url: a link, which either resolves or does not
- quote: words put in someone's mouth
- attribution: "according to X", "researchers at Y found"
- assertion: a plain factual statement about the world with no number in it

# WHAT DOES NOT COUNT

Skip these. Every uncheckable thing you include is a mark on the document that wastes the reader's attention.

- Opinions and judgements. "This is the best approach."
- Predictions. "Adoption will keep growing."
- Recommendations and instructions. "You should test this first."
- Vague quantifiers with nobody attached. "Many experts say", "it is widely believed".
- The writer's own experience. "In our work with clients we have seen this."
- Definitions and common knowledge with no source to check. "Water boils at 100C."
- Anything hedged into non-commitment. "It may be the case that adoption is rising."

# THE ONE THAT MATTERS MOST

The single most dangerous claim in an AI-written document is a plausible, ordinary-sounding statistic that nobody thought to question. Something like "roughly a third of small businesses close within two years" or "the average reader spends 54 seconds on a page".

These read like background. They are stated flatly, they sound about right, and they carry no citation. They are also exactly what a language model invents when it needs a number.

DO NOT SKIP THEM BECAUSE THEY LOOK UNREMARKABLE. They are the reason this tool exists. If a sentence contains a specific number and no source, extract it, every time, however ordinary it sounds.

# HOW TO CHOOSE WHEN THERE ARE MANY

Rank by one question: WOULD A READER BE MISLED IF THIS WERE WRONG?

A fabricated statistic in the opening paragraph outranks a correct-looking date in a footnote. A named study that may not exist outranks a round number used as an illustration. Order the list so the most consequential claims come first.

# COPYING THE QUOTE

The quote field is searched for in the original document. If you change even one character it will not be found and the claim cannot be shown in place.

Copy it exactly. Keep the original punctuation, the original quote marks, the original dashes, the original capitalisation. Do not add or remove a full stop. Quote one sentence where you can; two only when the claim genuinely spans both.

# OUTPUT

Return JSON matching the schema. If the document contains no checkable claims at all, return an empty array. That is a real and useful answer, not a failure.`

export interface ExtractResult {
  /** The normalized document. Everything downstream indexes into THIS. */
  text: string
  claims: Claim[]
  /** True when more claims were found than we were willing to carry forward. */
  truncated: boolean
  /** How many the model returned before the cap. */
  foundCount: number
  /** Claims whose quote could not be found in the document. */
  unanchoredCount: number
}

export type ExtractError = 'too_short' | 'too_long' | 'unavailable'

/**
 * Extract claims from a document.
 *
 * Returns a string error rather than throwing, so the caller decides the
 * status code and the script can print something useful. The route wraps this
 * in the outer guard on top of that.
 */
export async function extractClaims(
  raw: string
): Promise<ExtractResult | ExtractError> {
  const text = normalizeDocument(raw)
  if (text.trim().length < MIN_DOC_CHARS) return 'too_short'
  if (text.length > MAX_DOC_CHARS) return 'too_long'

  const res = await callLLM<{ claims: unknown }>({
    model: MODELS.diagnose,
    systemPrompt: SYSTEM_PROMPT,
    userMessage: `<document>\n${text}\n</document>`,
    temperature: 0.1,
    maxOutputTokens: 2000,
    responseSchema: SCHEMA as unknown as Record<string, unknown>,
  })

  if (!res) return 'unavailable'

  // Every field goes through the coercers. Structured Outputs run with
  // strict:false, so a field typed string can arrive as an array and
  // TypeScript will say nothing about it.
  const raw_claims = asObjectArray(res.claims)
  const foundCount = raw_claims.length

  const cleaned = raw_claims
    .map(c => ({
      quote: asText(c.quote),
      claimText: asText(c.claim_text),
      kind: asEnum(c.kind, KINDS, 'assertion'),
    }))
    // A claim with no quote cannot be located and a claim with no claimText
    // cannot be searched for. Either way it is not usable, so it is dropped
    // rather than shown as an empty mark.
    .filter(c => c.quote && c.claimText)

  // The cap is enforced HERE, in code, and not by asking the model to stop at
  // twenty. The claim count is model-controlled input to the bill.
  const kept = cleaned.slice(0, MAX_CLAIMS_PER_DOC)

  const located = locateAll(text, kept)

  const claims: Claim[] = located.map((l, i) => ({
    id: `c${i + 1}`,
    quote: l.claim.quote,
    claimText: l.claim.claimText,
    kind: l.claim.kind,
    span: l.span,
    // Nothing has checked anything yet, and the resting state says so
    // honestly rather than implying a clean bill of health.
    verdict: { state: 'unverifiable', reason: 'not_checked', evidence: [] },
  }))

  return {
    text,
    claims,
    truncated: cleaned.length > MAX_CLAIMS_PER_DOC,
    foundCount,
    unanchoredCount: claims.filter(c => !c.span).length,
  }
}
