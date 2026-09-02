import { callLLMDetailed } from '@/lib/engine/openai-client'
import { MODELS } from '@/lib/engine/models'
import { dedupeClaims } from './dedupe'
import { asText, asEnum, asObjectArray } from '@/lib/engine/coerce'
import { normalizeDocument, locateAll } from './locate'
import { visibleLength, countLinks } from './paste'
import { citationDensity } from './spans'
import {
  type Claim,
  type ClaimSubject,
  type CitationDensity,
  type SourceForm,
  CLAIM_KINDS,
  CLAIM_SUBJECTS,
  SOURCE_FORMS,
  initialJudgement,
  initialCitation,
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
            enum: [...CLAIM_KINDS],
          },
          subject: {
            type: 'string',
            enum: [...CLAIM_SUBJECTS],
            description:
              'first_party if this is the document author\'s own number or their own client\'s. population if it is about a general group the author has no special access to (marketers, US adults, small businesses). entity if it is about one named organisation or product that is not the author.',
          },
          source_form: {
            type: 'string',
            enum: [...SOURCE_FORMS],
            description:
              'linked if the claim carries or sits directly beside a hyperlink to its source. named if a publisher is named in the prose with no link. none if there is no source of any kind.',
          },
          source_url: {
            type: 'string',
            description:
              'The URL, copied exactly, when source_form is linked. Empty string otherwise. Never invent or complete a URL.',
          },
          source_name: {
            type: 'string',
            description:
              'The publisher as the author named them, when source_form is named. "Ahrefs", "Gartner", "the Pew Research Center". Empty string otherwise.',
          },
          figure: {
            type: 'string',
            description:
              'The number exactly as written in the document, including its symbol: "89%", "$4.2 billion", "4th". Empty string when the claim has no number.',
          },
          looks_published: {
            type: 'boolean',
            description:
              'True if this claim is shaped like something a survey, study or report would have published, so a source SHOULD exist if it is real. False for anything private, internal, or specific to one company\'s own operations.',
          },
        },
        required: [
          'quote',
          'claim_text',
          'kind',
          'subject',
          'source_form',
          'source_url',
          'source_name',
          'figure',
          'looks_published',
        ],
      },
    },
  },
  required: ['claims'],
} as const

const SYSTEM_PROMPT = `You find the factual claims in a document that a careful reader could challenge, so the writer can check them before they send it.

# WHAT COUNTS AS A CHECKABLE CLAIM

Something that is either true or false about the world, and that someone could look up.

- statistic: any number, percentage, quantity, money amount, date range or growth figure
- ranking: an ordinal or a ranked position. "the fourth largest", "the second most common", "our top five". Extract these even though they look soft: a ranked list with one entry quietly dropped moves everything below it up a place, and that is a real and common defect that is invisible unless the rank itself is a claim.
- citation: a named study, paper, report, book or dataset
- url: a link, which either resolves or does not
- quote: words put in someone's mouth
- attribution: "according to X", "researchers at Y found"
- assertion: a plain factual statement about the world with no number in it, and ONLY when it is about something the author does not control. See the section on assertions below, because this one is where noise comes from.

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

# ASSERTIONS ARE THE NARROW ONE

An assertion survives only if it is about something OUTSIDE the author's control, and only if a reader could look it up somewhere the author does not own.

DEFAULT TO LEAVING IT OUT. If you are unsure whether an assertion is checkable, it is not. Three real claims are worth more than twenty statements nobody can check, and every uncheckable line you return is a mark on the document that wastes the reader's attention.

Never extract:
- A company describing its own product, service, pricing or features. "Cypress is a quality platform for teams shipping modern web applications" is not a checkable claim, it is a vendor describing itself.
- What a product does, offers, includes, supports or provides.
- Descriptions of the author's own methods, process or approach.
- Anything you would only be able to confirm by asking the author.

# WHO THE CLAIM IS ABOUT

Set subject from whose numbers these are, RELATIVE TO THE AUTHOR OF THIS DOCUMENT.

- first_party: the author's own figures. "We surveyed 200 customers", "our pilot cut resolution time to 9 hours", "our client saw a 30% lift". Nobody outside the author's own records can check these, so they are handled separately and never marked as doubtful.
- population: a general group the author has no special access to. "89% of small business owners", "two thirds of US adults", "the average B2B buyer".
- entity: one named organisation, product or person that is not the author. "Shopify processed $X", "Gartner employs Y analysts".

The relative part matters. In an article on YOUR blog, "Asana reported that its own users saved four hours a week" is entity, not first_party. It is Asana's own number, but it is not yours, and someone outside can go and read what Asana published.

FIRST PARTY IS NOT ONLY "WE" AND "OUR". A company writing about itself in the third person is still writing about itself. If the document keeps making claims about one named organisation or product, and cites nobody for them, that organisation is almost certainly the author and every one of those claims is first_party.

On a page published by Cypress, "Cypress is a quality platform" and "Cypress App is free and open source" are first_party, exactly as much as "our platform is free" would be. Look at whose page this is, not at which pronoun they chose.

# WHAT THE AUTHOR CITED

Set source_form from what is actually there, not from what should be there.

- linked: the claim carries a hyperlink, or one sits immediately beside it. Copy the URL into source_url exactly as written. Never repair, complete or guess a URL.
- named: a publisher is named in the prose and there is no link. "According to Ahrefs", "a 2025 Gartner study". Put the publisher in source_name.
- none: no source of any kind. This is extremely common and it is not an error. Report it plainly.

# LOOKS PUBLISHED

Set looks_published true when the claim is shaped like a finding somebody would have PUBLISHED, so a source should exist if the claim is real. A percentage of a named population is the clearest case.

Set it false for anything private or internal, and for anything about one company's own operations, even when it carries a number.

This never becomes an accusation. It exists so that finding nothing can mean something: finding no source for "our client saw a 30% lift" means nothing at all, and finding no source for "89% of small business owners use AI" is worth the writer's attention.

# HOW TO CHOOSE WHEN THERE ARE MANY

Choose by one question: WOULD A READER BE MISLED IF THIS WERE WRONG?

A fabricated statistic in the opening paragraph matters more than a correct-looking date in a footnote. A named study that may not exist matters more than a round number used as an illustration. When you have to leave something out, leave out the one whose wrongness would cost the reader least.

RETURN THEM IN DOCUMENT ORDER, first to last, always. Do not sort by importance. Importance is decided downstream, and the order you return is used to find each quote in the text, so re-ordering breaks the anchoring.

STOP AFTER 25. Return the FIRST 25 claims you meet reading the document from the top, then stop. Not the best 25, not a selection: the first 25 in order. If the document holds more, that is fine and expected, and they are not your problem.

# COPYING THE QUOTE

The quote field is searched for in the original document. If you change even one character it will not be found and the claim cannot be shown in place.

Copy it exactly. Keep the original punctuation, the original quote marks, the original dashes, the original capitalisation. Do not add or remove a full stop. Quote one sentence where you can; two only when the claim genuinely spans both.

# OUTPUT

Return JSON matching the schema. If the document contains no checkable claims at all, return an empty array. That is a real and useful answer, not a failure.`

export interface ExtractResult {
  /** The normalized document. Everything downstream indexes into THIS. */
  text: string
  claims: Claim[]
  /** How well the document cites itself. Computed here, free, no network. */
  density: CitationDensity
  /** True when more claims were found than we were willing to carry forward. */
  truncated: boolean
  /**
   * How many the model returned, before dedupe and before the code cap.
   *
   * NOT A PROPERTY OF THE DOCUMENT ANY MORE, and never printed. The prompt
   * stops the model at 25, so this saturates there on anything dense and says
   * "at least 25" rather than "89". It stayed useful for one thing only:
   * `truncated` still means honestly that there were more than we kept.
   */
  foundCount: number
  /**
   * Links in the document, counted by us and not by the model.
   *
   * The only count we are willing to print. See countLinks().
   */
  linkCount: number
  /**
   * Repeats of a claim already counted, folded away before the cap.
   *
   * Reported rather than swallowed: `foundCount` minus this is the number of
   * DISTINCT claims in the document, and the two are worth telling apart
   * because only the second one means anything about the writing.
   */
  duplicates: number
  /** Claims whose quote could not be found in the document. */
  unanchoredCount: number
}

export type ExtractError = 'too_short' | 'too_long' | 'too_dense' | 'unavailable'

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
  /**
   * Measured the same way the box measures it: markdown link syntax is our
   * formatting, not the writer's prose. Counting raw characters here would let
   * a document pass the counter under the box and then be refused by the
   * server, which is the worst possible place to disagree with yourself.
   */
  if (visibleLength(text) > MAX_DOC_CHARS) return 'too_long'

  const res = await callLLMDetailed<{ claims: unknown }>({
    model: MODELS.diagnose,
    systemPrompt: SYSTEM_PROMPT,
    userMessage: `<document>\n${text}\n</document>`,
    temperature: 0.1,
    /**
     * Sized for 25 claims and the reasoning that goes with them.
     *
     * It was 10,000, sized for a WHOLE dense document, because the prompt used
     * to ask for every claim in it. One article returned 89 claims and 8,646
     * output tokens, of which 69 claims were thrown away by the cap below.
     * That waste was 87% of the wait: 48 of the 55 seconds a reader spent
     * looking at an unmarked page.
     *
     * The prompt now stops at 25. This still has to hold that comfortably,
     * because an overflow costs the whole document, so it is roughly double
     * what 25 claims measure at.
     */
    maxOutputTokens: 4_000,
    /**
     * The 25s default in the client was tuned for the improver's diagnose
     * call, which lands in 2-6s. This is a different job: the same listicle
     * measures 20-35s, so the default was clipping calls that were seconds
     * from finishing. Every failure here costs the whole document, so the
     * ceiling sits well clear of the work rather than close to it.
     */
    timeoutMs: 90_000,
    responseSchema: SCHEMA as unknown as Record<string, unknown>,
  })

  /**
   * Overflow is not "something went wrong". The document had more claims in
   * it than one reply can hold, and the reader can act on that by sending a
   * shorter section. Every other failure is ours and says so.
   */
  const answer = res.data
  if (!answer) return res.failure === 'overflow' ? 'too_dense' : 'unavailable'

  // Every field goes through the coercers. Structured Outputs run with
  // strict:false, so a field typed string can arrive as an array and
  // TypeScript will say nothing about it.
  const raw_claims = asObjectArray(answer.claims)
  const foundCount = raw_claims.length

  const cleaned = raw_claims
    .map(c => {
      const subject = asEnum(c.subject, CLAIM_SUBJECTS, 'entity') as ClaimSubject
      const sourceUrl = asText(c.source_url)
      const sourceName = asText(c.source_name)
      // The model's own source_form is a suggestion, not the answer. A `linked`
      // with no usable URL is worthless downstream and would route a claim to
      // an endpoint with nothing to send it, so the form is re-derived from
      // what actually arrived. Same discipline as the claim cap: the thing
      // that costs money is decided in code.
      const declared = asEnum(c.source_form, SOURCE_FORMS, 'none') as SourceForm
      const form: SourceForm =
        declared === 'linked' && isFetchableUrl(sourceUrl) ? 'linked'
          : declared !== 'none' && sourceName ? 'named'
          : 'none'
      return {
        quote: asText(c.quote),
        claimText: asText(c.claim_text),
        kind: asEnum(c.kind, CLAIM_KINDS, 'assertion'),
        subject,
        sourceForm: form,
        sourceUrl: form === 'linked' ? sourceUrl : undefined,
        sourceName: form === 'named' ? sourceName : undefined,
        figure: asText(c.figure) || undefined,
        // A first-party claim is never "publishable elsewhere" by definition,
        // whatever the model says, so the flag is forced off rather than
        // trusted. It is the input to a sentence shown to a writer, and the
        // sentence is only safe when the flag cannot be wrong in that
        // direction.
        looksPublished: subject !== 'first_party' && c.looks_published === true,
      }
    })
    // A claim with no quote cannot be located and a claim with no claimText
    // cannot be searched for. Either way it is not usable, so it is dropped
    // rather than shown as an empty mark.
    .filter(c => c.quote && c.claimText)

  /**
   * Repeats collapse BEFORE the cap, and that order is the point.
   *
   * A document that says the same statistic twice would otherwise spend two
   * of its twenty slots saying it twice, and a real claim further down goes
   * unchecked to make room for a copy. Deduping first means the cap counts
   * twenty distinct claims.
   */
  const deduped = dedupeClaims(cleaned)

  // The cap is enforced HERE, in code, and not by asking the model to stop at
  // twenty. The claim count is model-controlled input to the bill.
  const kept = deduped.kept.slice(0, MAX_CLAIMS_PER_DOC)

  const located = locateAll(text, kept)

  const claims: Claim[] = located.map((l, i) => ({
    id: `c${i + 1}`,
    quote: l.claim.quote,
    claimText: l.claim.claimText,
    kind: l.claim.kind,
    subject: l.claim.subject,
    sourceForm: l.claim.sourceForm,
    sourceUrl: l.claim.sourceUrl,
    sourceName: l.claim.sourceName,
    figure: l.claim.figure,
    looksPublished: l.claim.looksPublished,
    span: l.span,
    // Nothing has checked anything yet on either axis, and the resting states
    // say so honestly rather than implying a clean bill of health.
    judgement: initialJudgement(l.claim.subject),
    citation: initialCitation(),
  }))

  return {
    text,
    claims,
    density: citationDensity(claims),
    truncated: deduped.kept.length > MAX_CLAIMS_PER_DOC,
    /** Repeats of a claim already counted. Reported, never silent. */
    duplicates: deduped.removed,
    linkCount: countLinks(text),
    foundCount,
    unanchoredCount: claims.filter(c => !c.span).length,
  }
}

/**
 * Is this string something the citation axis could actually fetch?
 *
 * Deliberately strict, and deliberately not a validation of whether the page
 * exists. It rejects the two things that cause real damage: a scheme we will
 * not follow, and a relative or malformed string the model produced by
 * summarising a link rather than copying it. Anything that fails here becomes
 * `named` or `none`, which is a weaker claim about the document and therefore
 * the safe direction to fall.
 */
function isFetchableUrl(u: string): boolean {
  if (!u) return false
  try {
    const parsed = new URL(u)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}
