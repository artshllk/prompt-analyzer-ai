import type { Claim } from './types'

/**
 * Turning located claims into something a component can render.
 *
 * The problem: claim spans can overlap. Two claims in one sentence, a
 * statistic sitting inside a longer attribution, a fuzzy anchor that reached
 * further than it should. HTML cannot render overlapping highlights without
 * nesting, and nested coloured pills are unreadable at body size.
 *
 * So this flattens spans into a list of non-overlapping runs. The component
 * maps over runs and never has to reason about geometry, which is the whole
 * point: geometry belongs in a pure function with tests, not in JSX.
 *
 * Pure. No React, no DOM, no imports beyond a type.
 */

export interface RenderRun {
  text: string
  /** The claim this run belongs to, or null for untouched prose. */
  claimId: string | null
}

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
  const anchored = claims
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
 * Flatten a document and its claims into non-overlapping runs.
 *
 * Guarantee: joining every run's text reproduces the document exactly. That is
 * asserted in the tests, and it is what stops a rendering bug from silently
 * dropping or duplicating a sentence of somebody's writing.
 */
export function toRenderRuns(text: string, claims: Claim[]): RenderRun[] {
  const placed = resolveOverlaps(claims)
  const runs: RenderRun[] = []
  let cursor = 0

  for (const c of placed) {
    const { start, end } = c.span!
    // Defensive: a span outside the document would silently truncate the
    // output. Skip it rather than render a shorter document than the one
    // the user pasted.
    if (start < cursor || end > text.length || end <= start) continue
    if (start > cursor) runs.push({ text: text.slice(cursor, start), claimId: null })
    runs.push({ text: text.slice(start, end), claimId: c.id })
    cursor = end
  }

  if (cursor < text.length) runs.push({ text: text.slice(cursor), claimId: null })
  return runs.filter(r => r.text.length > 0)
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
  return claims.filter(c => !placedIds.has(c.id))
}

/** Counts for the summary line. Countable by hand from the document. */
export function countByState(claims: Claim[]): {
  verified: number
  unverifiable: number
  contradicted: number
  total: number
} {
  const out = { verified: 0, unverifiable: 0, contradicted: 0, total: claims.length }
  for (const c of claims) out[c.verdict.state] += 1
  return out
}
