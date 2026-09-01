import { attentionFlag, type Claim } from './types'

/**
 * Ranking the unsourced-claim flags, and showing only the top few.
 *
 * WHY THIS EXISTS. On an aggregator post 34% of claims carry no attribution at
 * all, and most of those are population claims. The attention flag would
 * therefore fire a dozen times on one document. Twelve things to check is a
 * wall, not a to-do list, and a wall gets closed.
 *
 * This is the same lesson as over-extraction, and it is worth stating in the
 * general form because it will come up again: FREQUENCY DESTROYS USEFULNESS
 * INDEPENDENTLY OF ACCURACY. Every one of those twelve flags can be correct
 * and the feature can still be worthless, because the writer has no way to
 * decide where to start. Three ranked items is a task. Twelve is a mood.
 *
 * So: show three, collapse the rest behind a count, and rank by proxies we can
 * actually defend.
 */

export const FLAGS_SHOWN = 3

/**
 * The ranking, and the reasoning for each term.
 *
 * 1. FIGURE PRECISION, up to 3. "36.9%" is a number only a real dataset
 *    produces, so it cuts both ways and both ways point the same direction: if
 *    it is fabricated it is the most damaging thing in the document, and if it
 *    is real a search should have found it, which makes the empty result
 *    genuinely informative. "About a third" is idiomatic. It could be a loose
 *    restatement of anything, so finding nothing tells us close to nothing.
 *
 * 2. SUBJECT, up to 2. A named population ("small business owners") gave the
 *    search a real target, so coming back empty means something. A claim about
 *    one named entity is more likely to be genuinely unindexed, and its
 *    silence is weaker evidence.
 *
 * 3. KIND, up to 2. A statistic or a ranking is the shape of thing that gets
 *    fabricated. A bare assertion with no source is very often ordinary
 *    common knowledge, and flagging it wastes the writer's attention.
 *
 * 4. POSITION, up to 2, linear and front-loaded. The opening is what gets
 *    skimmed, screenshotted and quoted back. A wrong number in the first
 *    paragraph travels further than a wrong number in the last.
 *
 * Deliberately NOT a term: how round the number is. "50% of marketers" is
 * exactly as likely to be a real finding as a made-up one, and treating
 * roundness as suspicious would flag every honestly-reported half.
 */
export function flagScore(claim: Claim, docLength: number): number {
  return (
    figurePrecision(claim.figure) +
    (claim.subject === 'population' ? 2 : 1) +
    (claim.kind === 'statistic' || claim.kind === 'ranking' ? 2 : claim.kind === 'assertion' ? 0 : 1) +
    positionWeight(claim, docLength)
  )
}

/** A word-quantifier is not a figure. A decimal is a dataset. */
function figurePrecision(figure?: string): number {
  if (!figure) return 0
  const digits = figure.replace(/[^0-9]/g, '')
  if (!digits) return 0                       // "a third", "most"
  if (/[.,]\d/.test(figure)) return 3          // 36.9%, 2.1%
  if (digits.length >= 3) return 3             // 214, 10,240
  if (digits.length === 2) return 2            // 89%
  return 1                                     // 3x, 5
}

function positionWeight(claim: Claim, docLength: number): number {
  if (!claim.span || docLength <= 0) return 0
  const relative = claim.span.start / docLength
  return 2 * (1 - Math.min(1, Math.max(0, relative)))
}

export interface RankedFlags {
  /** The ones worth showing, most worth checking first. */
  shown: { claim: Claim; message: string }[]
  /** How many more fired and are collapsed behind a count. */
  hidden: number
  /** Every flag that fired, for the log. The number that decides if this earns its place. */
  fired: number
}

/**
 * Rank the flags and cut them to three.
 *
 * `docLength` is the normalized document's length, used only for the position
 * term. Passing 0 is safe and simply drops that term.
 */
export function rankFlags(claims: Claim[], docLength: number): RankedFlags {
  const all = claims
    .map(claim => ({ claim, message: attentionFlag(claim) }))
    .filter((f): f is { claim: Claim; message: string } => f.message !== null)
    .sort(
      (a, b) =>
        flagScore(b.claim, docLength) - flagScore(a.claim, docLength) ||
        // Stable tiebreak on id, so the same document always produces the same
        // three. A list that reshuffles between runs reads as guesswork.
        a.claim.id.localeCompare(b.claim.id)
    )

  return {
    shown: all.slice(0, FLAGS_SHOWN),
    hidden: Math.max(0, all.length - FLAGS_SHOWN),
    fired: all.length,
  }
}
