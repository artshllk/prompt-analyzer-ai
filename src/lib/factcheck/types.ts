/**
 * The shared vocabulary of the fact checker.
 *
 * Pure types and constants. No Next, no Supabase, no HTTP, no React. Same rule
 * as analyzePrompt(): the eval harness and any future client have to be able
 * to import this without dragging a framework behind it.
 */

/**
 * What we concluded about one claim.
 *
 * THE ORDER MATTERS AND IT IS NOT ALPHABETICAL. `unverifiable` is the resting
 * state, the value every claim starts at and the value every failure returns
 * to. Verification can only ever upgrade away from it.
 *
 * `contradicted` is the only state that accuses the writer of anything, and a
 * wrong one is the failure that kills this product. It is reachable from
 * exactly one code path, under conditions listed on ClaimVerdict below.
 * Absence of evidence is ALWAYS unverifiable. Never contradicted.
 */
export type ClaimState = 'verified' | 'unverifiable' | 'contradicted'

export const CLAIM_STATES: readonly ClaimState[] = [
  'verified',
  'unverifiable',
  'contradicted',
] as const

/** The safe answer. Used as the coercion fallback everywhere. */
export const DEFAULT_STATE: ClaimState = 'unverifiable'

/**
 * Why a claim ended up unverifiable.
 *
 * Kept machine-readable because the aggregate matters: "we found nothing" and
 * "our checker fell over" both render as amber, and conflating them is how
 * amber quietly stops meaning anything. If most claims are unverifiable for
 * infrastructure reasons, the report has to say so at the top.
 */
export type UnverifiableReason =
  | 'not_checked'      // nothing has tried yet. The initial value.
  | 'no_results'       // we looked and the web had nothing. An honest answer.
  | 'insufficient'     // we found sources that do not settle it either way.
  | 'search_failed'    // our problem
  | 'judge_failed'     // our problem
  | 'deadline'         // our problem: we ran out of time

/** What a claim is, in the writer's document. */
export type ClaimKind =
  | 'statistic'    // a number, a percentage, a quantity
  | 'citation'     // a named study, paper, report or DOI
  | 'url'          // a link that either resolves or does not
  | 'quote'        // words attributed to a person
  | 'attribution'  // "according to X"
  | 'assertion'    // a plain factual statement with no number in it

/** Where a claim sits in the original document. */
export interface ClaimSpan {
  /** Index into the NORMALIZED document, which is what the client renders. */
  start: number
  /** Exclusive. */
  end: number
  /**
   * How confident the anchor is. `fuzzy` still renders; anything we could not
   * place at all becomes an unanchored claim instead of a guessed span.
   */
  precision: 'exact' | 'folded' | 'fuzzy'
}

/** One piece of evidence behind a verdict. */
export interface Evidence {
  url: string
  /** Page or publication title, for the report. */
  title: string
  /**
   * The sentence from the source that settles it, quoted verbatim.
   *
   * Load-bearing: a `contradicted` verdict is not allowed to exist without
   * one of these, and the quote must be findable in the retrieved source. A
   * verdict the reader cannot check themselves is just our opinion.
   */
  quote: string
  /** When we retrieved it. The report is a claim about a moment in time. */
  retrievedAt: string
}

export interface ClaimVerdict {
  state: ClaimState
  /** Set whenever state is 'unverifiable'. */
  reason?: UnverifiableReason
  /**
   * Never empty when state is 'contradicted'. Enforced in code, not by
   * convention: see judge.ts, which is the only place that state is
   * reachable from.
   */
  evidence: Evidence[]
  /** One plain sentence for the reader. Never hedged into meaninglessness. */
  note?: string
}

export interface Claim {
  id: string
  /** The exact substring from the document, as the extractor returned it. */
  quote: string
  /**
   * The claim restated so it stands alone. "It rose 40%" cannot be checked
   * without its subject, and the search query is built from this, not from
   * the raw quote.
   */
  claimText: string
  kind: ClaimKind
  /** Absent when the quote could not be located. The claim still ships. */
  span?: ClaimSpan
  verdict: ClaimVerdict
}

export interface CheckResult {
  /** The normalized document. The client renders THIS, never its own copy. */
  text: string
  claims: Claim[]
  /** True when extraction found more claims than we were willing to check. */
  truncated: boolean
  /** How many were found before the cap. */
  foundCount: number
  checkedAt: string
}

/**
 * Hard ceiling on claims checked per document.
 *
 * Enforced in CODE, never by asking the model nicely. The claim count is
 * model-controlled input to the bill, and a model that decides to find 200
 * claims must not be able to spend 200 searches. When the cap bites, the
 * result says so: silently dropping claims in a product about honesty is
 * disqualifying.
 */
export const MAX_CLAIMS_PER_DOC = 20

/**
 * Input ceiling. Free, deterministic, and applied before anything is spent,
 * which makes it the highest-leverage guard in the system: cost is roughly
 * linear in document length. About 2,000 words.
 */
export const MAX_DOC_CHARS = 12_000

/** Below this there is not enough text to find a claim in. */
export const MIN_DOC_CHARS = 120
