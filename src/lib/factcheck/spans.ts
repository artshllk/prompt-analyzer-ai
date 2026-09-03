import {
  type Claim,
  type CitationDensity,
  type ClaimVerdict,
  WELL_CITED_AT,
  UNCITED_BELOW,
} from './types'


/**
 * Resolve overlaps by keeping the FIRST claim to occupy a character.
 *
 * Not the shortest, not the highest priority, not the most severe. First, in
 * document order, deterministically. Two reasons.
 *
 * A stable rule is worth more than a clever one here: whichever claim wins,
 * the reader can click it and see what it was, but a mark that moves between
 * runs on the same document destroys trust faster than a mark that is merely
 * not the one you would have chosen.
 *
 * And "most severe wins" is actively wrong for this product. It would let a
 * contradicted claim's mark spread over a neighbouring verified one, which
 * paints red across a sentence nobody disputed. Severity must never decide
 * geometry.
 */
export function resolveOverlaps(claims: Claim[]): Claim[] {
  const anchored = markableClaims(claims)
    .filter(c => c.span)
    .sort((a, b) => a.span!.start - b.span!.start || a.span!.end - b.span!.end)

  const kept: Claim[] = []
  let furthest = -1
  for (const c of anchored) {
    const { start, end } = c.span!
    if (start < furthest) continue // overlaps something already placed
    kept.push(c)
    furthest = end
  }
  return kept
}


/**
 * The claims that could not be placed inline.
 *
 * These still ship. They render in a list under the document, because the
 * alternative is guessing a span, and a coloured mark on the wrong sentence is
 * worse than a mark that is merely somewhere else on the page.
 */
export function unanchoredClaims(claims: Claim[]): Claim[] {
  const placedIds = new Set(resolveOverlaps(claims).map(c => c.id))
  // First-party claims are excluded here as well as from the marks. They are
  // not "found but unplaceable", they are a different category with its own
  // heading, and putting them in this list would explain them wrongly.
  return markableClaims(claims).filter(c => !placedIds.has(c.id))
}

/**
 * The claims that get a mark on the document.
 *
 * First-party claims are deliberately NOT marked. They are the author's own
 * figures, and in a case study they are 84% of everything in the document. A
 * mark on each of them paints a wall of amber across writing that has done
 * nothing wrong, and the writer reasonably concludes the tool is broken. They
 * are listed separately instead, under a heading that says what they are.
 */
export function markableClaims(claims: Claim[]): Claim[] {
  return claims.filter(c => c.subject !== 'first_party')
}

/**
 * OPEN QUESTION FOR 4a, recorded here rather than decided by accident.
 *
 * A first-party claim can still be LINKED: "we surveyed 214 customers,
 * methodology here". Nobody outside can verify the number, so it is rightly
 * off the claim axis, but the citation axis could still ask whether the
 * author's own linked page says 214. That is a real check and today it never
 * runs, because markableClaims() removes the claim before either axis sees it.
 *
 * Left as it is for now. Marking these would put the amber wall back, and the
 * fix is a citation-only pass rather than a change to what gets marked. Worth
 * doing when the provider is wired in and it costs one extra URL in a batch
 * that is already going out.
 */

/** The author's own figures. Listed, never marked, never counted in a ratio. */
export function firstPartyClaims(claims: Claim[]): Claim[] {
  return claims.filter(c => c.subject === 'first_party')
}

/** Counts for the summary line. Countable by hand from the document. */
export function countByVerdict(claims: Claim[]): Record<ClaimVerdict, number> & {
  total: number
} {
  const out = { verified: 0, contradicted: 0, unchecked: 0, total: 0 }
  for (const c of claims) {
    out[c.judgement.verdict] += 1
    out.total += 1
  }
  return out
}

/**
 * The count that makes the report worth attaching.
 *
 * "Four citations to fix" is the only actionable line on the page. It is
 * deliberately separate from the verdict counts, because a citation defect is
 * a thirty-second fix and a contradiction is a rewrite, and presenting them on
 * one scale would flatten that difference.
 */
export function citationsToFix(claims: Claim[]): number {
  return markableClaims(claims).filter(c => c.citation.check === 'does_not_contain').length
}

/**
 * Is there anything here to check at all?
 *
 * A marketing page yields claims that are all the author describing their own
 * product, with no figure and no source anywhere. Marking twenty of those is a
 * wall of noise on somebody's first use, and every one of them is
 * uncheckable by construction.
 *
 * Handled the way the density banner handles genre: say what kind of document
 * this is instead of pretending to have found something. An honest "there is
 * nothing here for us to check" is a real answer.
 *
 * Deliberately strict. It fires only when NOTHING carries a figure and NOTHING
 * carries a source, because a single real statistic means the document is
 * worth marking and the wall is worth having.
 */
export function nothingToCheck(claims: Claim[]): boolean {
  if (claims.length === 0) return false
  return claims.every(c => !c.figure && c.sourceForm === 'none')
}

/**
 * How well the document cites itself. One pass, no network, no model call.
 *
 * First-party claims are excluded from the denominator rather than counted as
 * uncited. Counting them would tell a case-study author their document is
 * badly sourced when what is actually true is that their document is about
 * their own work, and that is the single most likely way this number could
 * insult somebody.
 */
export function citationDensity(claims: Claim[]): CitationDensity {
  let linked = 0
  let named = 0
  let none = 0
  let firstParty = 0

  for (const c of claims) {
    if (c.subject === 'first_party') {
      firstParty += 1
      continue
    }
    if (c.sourceForm === 'linked') linked += 1
    else if (c.sourceForm === 'named') named += 1
    else none += 1
  }

  const checkable = linked + named + none
  const ratio = checkable === 0 ? 0 : linked / checkable
  const band: CitationDensity['band'] =
    checkable === 0 ? 'uncited'
      : ratio >= WELL_CITED_AT ? 'well_cited'
      : ratio < UNCITED_BELOW ? 'uncited'
      : 'mixed'

  return { linked, named, none, firstParty, ratio, band }
}
