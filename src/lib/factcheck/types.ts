/**
 * The shared vocabulary of the fact checker.
 *
 * Pure types and constants. No Next, no Supabase, no HTTP, no React. Same rule
 * as analyzePrompt(): the eval harness and any future client have to be able
 * to import this without dragging a framework behind it.
 *
 * ===================================================================
 * TWO AXES, DECIDED SEPARATELY, THAT CANNOT CONTAMINATE EACH OTHER
 * ===================================================================
 *
 * Measured on two real published articles, 64 claims, every third-party claim
 * searched by hand: nothing was fabricated. Every organisation cited was real
 * and nearly every document existed at roughly the URL given.
 *
 * The real defects were all of one kind. A true Ahrefs figure attributed to
 * the wrong Ahrefs article, nine months newer than the study it came from. A
 * date qualifier the source never supports. A source that says "Teams" against
 * an article that says "knowledge workers".
 *
 * NONE OF THOSE IS A FALSE CLAIM. The claim is true and the citation is wrong,
 * and a single three-state scale has nowhere to put that. Forcing it into
 * `contradicted` would be exactly the false positive this product is designed
 * around.
 *
 * So there are two axes:
 *
 *   CLAIM AXIS     is this true?              judge.ts, from search results
 *   CITATION AXIS  does the cited source      citation.ts, from the page at
 *                  actually show it?          the URL the author gave
 *
 * THE GOVERNING RULE EXTENDS: a citation defect is NEVER `contradicted`. That
 * is enforced by the type system rather than by convention. `ClaimVerdict` and
 * `CitationCheck` share no members, and `citation.ts` returns the latter, so a
 * citation check cannot produce an accusation about the claim. It is a compile
 * error, not a code review note. See CITATION_CHECKS below for the runtime
 * assertion that backs it up.
 */

/**
 * What we concluded about whether the claim is TRUE.
 *
 * `unchecked` is the resting state, the value every claim starts at and the
 * value every failure returns to. Verification can only ever upgrade away
 * from it.
 *
 * `contradicted` is the only value in this file that accuses the writer of
 * anything, and a wrong one kills the product. It is reachable from exactly
 * one function, judge.ts, under the conditions listed on ClaimJudgement.
 * Absence of evidence is ALWAYS unchecked. Never contradicted.
 */
export type ClaimVerdict = 'verified' | 'contradicted' | 'unchecked'

export const CLAIM_VERDICTS: readonly ClaimVerdict[] = [
  'verified',
  'contradicted',
  'unchecked',
] as const

/** The safe answer. The coercion fallback everywhere on the claim axis. */
export const DEFAULT_VERDICT: ClaimVerdict = 'unchecked'

/**
 * Whether the source the writer cited actually contains the claim.
 *
 * Deliberately shares no member with ClaimVerdict. `does_not_contain` is the
 * strongest thing this axis can say, and it says nothing about whether the
 * claim is true: the most common real defect is a TRUE claim behind a link
 * that does not show it.
 *
 * `not_applicable` covers the case where there is nothing to check, which is
 * decided by SourceForm before any network call happens.
 */
export type CitationCheck =
  | 'supports'
  | 'does_not_contain'
  | 'source_unreachable'
  | 'not_applicable'

export const CITATION_CHECKS: readonly CitationCheck[] = [
  'supports',
  'does_not_contain',
  'source_unreachable',
  'not_applicable',
] as const

export const DEFAULT_CITATION_CHECK: CitationCheck = 'not_applicable'

/**
 * What the author gave us to check, as opposed to what we found.
 *
 * THIS IS THE FIELD THAT REMOVES THE NEED FOR A FIFTH CitationCheck VALUE.
 * "No source given" was never a check result. It is a property of the
 * document, knowable at extraction with no network call, and putting it in
 * the result enum is what forced "named but not linked" to look like it
 * needed a state of its own. It does not. It is `named` crossed with the same
 * four results, checked by a domain-restricted search instead of a fetch.
 *
 * It also gates spend, which is why it is decided first: `none` never buys an
 * API call, and `linked` routes to the cheap endpoint while `named` routes to
 * the one that costs five times as much.
 */
export type SourceForm =
  | 'linked'  // a hyperlink we can fetch and read
  | 'named'   // a publisher named in prose with no link. Search their domain.
  | 'none'    // nothing to check against

export const SOURCE_FORMS: readonly SourceForm[] = ['linked', 'named', 'none'] as const

/**
 * Who the claim is about, which decides whether anyone outside could ever
 * check it.
 *
 * Measured across six real stats-heavy articles and two hand-checked ones, the
 * ratio of first-party to third-party claims is bimodal by genre: 84% of a
 * case study's claims are the author's own numbers, against 0% of a stats
 * post's. A tool that marks the case study's sixteen own-figures amber paints
 * a wall of amber across an honest document, and the writer concludes the tool
 * is broken. So first-party claims are identified here, for free, and excluded
 * from marking and from every ratio.
 *
 * The population/entity split exists for one narrow purpose, described on
 * `looksPublished` below. Party is relative to the DOCUMENT'S AUTHOR, never to
 * the claim's subject: "Asana reported that its own users..." is first-party
 * in Asana's blog and `entity` in yours.
 */
export type ClaimSubject =
  | 'first_party'  // the author's own operations. Unfindable by nature.
  | 'population'   // a general population the author has no access to.
  | 'entity'       // a specific third party, which may or may not publish.

export const CLAIM_SUBJECTS: readonly ClaimSubject[] = [
  'first_party',
  'population',
  'entity',
] as const

/**
 * Why a claim ended up unchecked.
 *
 * Split into two groups on purpose, and the split is load-bearing. The first
 * four are facts about the WORLD and are shown to the writer as prose, because
 * "this cites a dashboard that only shows current data, so your reader cannot
 * check it either" is genuinely useful to someone about to publish. The last
 * four are OUR failures and render as one honest line saying we did not
 * finish. Conflating them is how amber quietly stops meaning anything.
 */
export type UncheckedReason =
  // --- facts about the world. Shown to the writer. ---
  | 'first_party'   // the author's own figure. Nobody outside can check it.
  | 'live_source'   // cites a dashboard or page that only shows current data.
  | 'unreachable'   // paywalled, 404, or blocked.
  | 'not_found'     // searched properly, nothing either way.
  // --- our failures. Shown as "we did not finish". ---
  | 'not_checked'   // nothing has tried yet. The initial value.
  | 'search_failed'
  | 'judge_failed'
  | 'deadline'      // we ran out of time and said so.

export const UNCHECKED_REASONS: readonly UncheckedReason[] = [
  'first_party',
  'live_source',
  'unreachable',
  'not_found',
  'not_checked',
  'search_failed',
  'judge_failed',
  'deadline',
] as const

/** The four the writer sees as prose. The rest render as "we did not finish". */
export const WORLD_REASONS: readonly UncheckedReason[] = [
  'first_party',
  'live_source',
  'unreachable',
  'not_found',
] as const

export function isWorldReason(r: UncheckedReason): boolean {
  return (WORLD_REASONS as readonly string[]).includes(r)
}

/**
 * Fixed precedence for the reason field.
 *
 * Reasons are not mutually exclusive. A StatCounter page can also return 403,
 * and if the reason varied run to run the same document would produce
 * different reports, which is disqualifying in a document someone forwards as
 * proof. So the order is fixed here and applied by one function.
 *
 * `live_source` from the domain list beats `unreachable` because "your source
 * only shows current data" is true whether or not we got through, and it is
 * the more useful of two true statements. `live_source` merely INFERRED from
 * page content loses to `unreachable`, because you cannot infer anything from
 * a page you could not fetch.
 */
export const REASON_PRECEDENCE: readonly UncheckedReason[] = [
  'first_party',
  'live_source',
  'unreachable',
  'not_found',
] as const

/** What a claim is, in the writer's document. */
export type ClaimKind =
  | 'statistic'    // a number, a percentage, a quantity
  | 'ranking'      // an ordinal or a ranked position: "the 4th largest"
  | 'citation'     // a named study, paper, report or DOI
  | 'url'          // a link that either resolves or does not
  | 'quote'        // words attributed to a person
  | 'attribution'  // "according to X"
  | 'assertion'    // a plain factual statement with no number in it

export const CLAIM_KINDS: readonly ClaimKind[] = [
  'statistic',
  'ranking',
  'citation',
  'url',
  'quote',
  'attribution',
  'assertion',
] as const

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

/** One piece of evidence behind a verdict, on either axis. */
export interface Evidence {
  url: string
  /** Page or publication title, for the report. */
  title: string
  /**
   * The sentence from the source that settles it, quoted verbatim.
   *
   * Load-bearing on BOTH axes, and enforced by test rather than by
   * convention: this string must be findable by indexOf in the text we
   * actually retrieved before it is allowed to mean anything. A model that
   * paraphrases, embellishes, or invents a supporting sentence produces a
   * verdict the reader cannot check, which is just our opinion with a citation
   * stapled to it. It is also the only defence we have against a hostile page
   * talking the judge into a verdict.
   */
  quote: string
  /** When we retrieved it. The report is a claim about a moment in time. */
  retrievedAt: string
}

/** The claim axis: is it true? */
export interface ClaimJudgement {
  verdict: ClaimVerdict
  /** Set whenever verdict is 'unchecked'. */
  reason?: UncheckedReason
  /**
   * Never empty when verdict is 'contradicted'. Enforced in code, not by
   * convention: judge.ts is the only place that value is reachable from, and
   * MarkedDocument downgrades an evidence-free contradiction to unchecked as a
   * last gate before a colour reaches a person.
   */
  evidence: Evidence[]
  /** One plain sentence for the reader. Never hedged into meaninglessness. */
  note?: string
}

/** The citation axis: does the source the writer pointed at actually show it? */
export interface CitationResult {
  check: CitationCheck
  /**
   * The source's own figure, when we found one and it differs in precision
   * from the writer's wording.
   *
   * We show it and never judge it. "Rounded in the author's favour" is a
   * judgement about intent, and a tool that infers intent will be wrong
   * sometimes and insulting exactly when it is wrong. Putting "your text says
   * 'over a third', the source says 34.2%" in front of the writer lets them
   * decide, which is both more honest and more useful.
   */
  sourceFigure?: string
  /**
   * Whether the writer's literal figure appears anywhere in the page we
   * retrieved. Computed by indexOf, not asked of the model.
   *
   * It decides which of two different mistakes we describe: the number is
   * there but attached to something else, or the number is not there at all.
   * Those have different fixes, so getting it wrong gives the writer the wrong
   * instruction. Measured on real articles, asking the judge for the source's
   * figure only distinguished 8 of 13 cases. A substring test distinguishes
   * all of them and costs nothing.
   */
  figureOnPage?: boolean
  /**
   * Why we could not read the source, when check is 'source_unreachable'.
   *
   * Carried so the report can say WHICH kind of unreadable, because the three
   * are different problems for the writer with different fixes, and because
   * "your reader cannot verify this either" is a finding rather than an
   * absence of one.
   */
  unreadable?: 'paywalled' | 'dead' | 'live_source' | 'no_source'
  /** Same indexOf discipline as the claim axis. Same reason. */
  evidence: Evidence[]
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
  subject: ClaimSubject

  /** --- what the author cited. All decided at extraction, no network. --- */
  sourceForm: SourceForm
  /** Present when sourceForm is 'linked'. */
  sourceUrl?: string
  /** Present when sourceForm is 'named'. The publisher as the author wrote it. */
  sourceName?: string
  /**
   * Whether the cited page can even be checked, decided from the URL alone.
   *
   * Same shape of idea as SourceForm, and here for the same reason: this is a
   * property of the SOURCE, known before any network call, not a result. A
   * dashboard that only renders the current month cannot support or fail to
   * support a figure written six months ago, so asking is meaningless and
   * answering is worse than meaningless. Deciding it up front also means we
   * never spend a credit fetching one.
   */
  sourceKind?: 'stable' | 'live'
  /**
   * The literal number as written, when there is one. Lets the citation check
   * start with a free substring test before it spends a model call.
   */
  figure?: string
  /**
   * Does this read like something that WOULD have been published, if true?
   *
   * Set at extraction, costs nothing, and does not become a verdict on its
   * own. Its only job is to let the report distinguish two very different
   * silences: "our client saw a 30% lift" is unfindable by nature and finding
   * nothing means nothing, while "89% of small business owners use AI" is
   * shaped like a published statistic and finding nothing is worth the
   * writer's attention.
   *
   * See attentionFlag() for the one sentence this is allowed to produce, and
   * for why that sentence blames our search rather than the claim.
   */
  looksPublished: boolean

  /** Absent when the quote could not be located. The claim still ships. */
  span?: ClaimSpan

  /** --- the two axes --- */
  judgement: ClaimJudgement
  citation: CitationResult
}

/**
 * How well this document cites itself, computed at extraction for free.
 *
 * Shown BEFORE any result, as the first thing on the page. Across six real
 * stats-heavy articles the split was 82% linked for Ahrefs, Semrush, Backlinko
 * and SproutSocial against 12% for the aggregator posts, and in the hand-
 * checked sample 100% for a stats post against 16% for a case study. That is
 * the same bimodal distribution showing up for the third time, and it decides
 * how much this tool can do before it does anything.
 *
 * Saying so up front is the difference between a writer thinking the tool is
 * broken and a writer understanding their document. It costs one division.
 */
export interface CitationDensity {
  linked: number
  named: number
  none: number
  /** Excluded from `ratio` entirely. Nobody can check these, including us. */
  firstParty: number
  /** linked / (linked + named + none). NaN-free: 0 when there is nothing. */
  ratio: number
  band: 'well_cited' | 'mixed' | 'uncited'
}

/**
 * Band thresholds, from the measured distribution rather than from taste.
 * The observed gap sits between SproutSocial at 55% and Wyzowl at 13%, so the
 * lower cut lands in the empty space and the upper cut separates the four
 * citation-heavy publishers from the rest.
 */
export const WELL_CITED_AT = 0.6
export const UNCITED_BELOW = 0.25

export interface CheckResult {
  /** The normalized document. The client renders THIS, never its own copy. */
  text: string
  claims: Claim[]
  density: CitationDensity
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
 *
 * It also happens to be exactly Tavily's per-call /extract batch limit, so a
 * document's whole citation axis is one request.
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

/** The resting state. Every claim starts here and verification upgrades away. */
export function initialJudgement(subject: ClaimSubject): ClaimJudgement {
  return {
    verdict: 'unchecked',
    // A first-party claim is already in its final state. Nothing outside the
    // author's own records could ever move it, so it is not pending, it is
    // answered, and it must never buy a search.
    reason: subject === 'first_party' ? 'first_party' : 'not_checked',
    evidence: [],
  }
}

/**
 * Everything starts not-applicable, including a linked source. The citation
 * axis has run when it says something other than this, and until 4a wires the
 * provider in, nothing has run.
 */
export function initialCitation(): CitationResult {
  return { check: 'not_applicable', evidence: [] }
}

/**
 * The one sentence `looksPublished` is allowed to produce, and the reason it
 * is phrased against US rather than against the claim.
 *
 * "We found no source" is a statement about the world that one search is not
 * entitled to make. "We could not find a source" is a statement about us, and
 * it is true whenever it is returned. The weaker sentence is the honest one,
 * and it is still the closest this product gets to catching a fabrication.
 *
 * Returns null in every case where the sentence would be noise: anything we
 * actually settled, anything first-party, anything that does not read like a
 * published figure, and anything whose silence was our own fault rather than
 * the web's.
 */
export function attentionFlag(claim: Claim): string | null {
  if (!claim.looksPublished) return null
  if (claim.subject === 'first_party') return null
  if (claim.judgement.verdict !== 'unchecked') return null
  if (claim.judgement.reason !== 'not_found') return null
  return 'This reads like a published statistic and we could not find a source for it. Worth checking before you publish.'
}
