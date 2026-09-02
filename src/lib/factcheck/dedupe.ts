/**
 * The same statistic, twice, because the article said it twice.
 *
 * ===================================================================
 * WHY THIS IS NOT COSMETIC
 * ===================================================================
 *
 * Source articles summarise at the top and repeat in the body, so a claim
 * arrives once as a headline and once in context. Measured on one Ahrefs
 * listicle, two of the first eight claims were repeats:
 *
 *   "96.55% of all pages get zero search traffic from Google"
 *   "96.55% of all pages get zero organic search traffic from Google"
 *
 * Both point at the same URL. Checking both costs two fetches and two judge
 * calls to reach the same answer, prints the same finding twice in a report
 * somebody forwards as proof, and burns two of the twenty slots the cap
 * allows, so a real claim further down the document goes unchecked to make
 * room for a copy.
 *
 * It is also the most likely explanation for the found-count wobbling between
 * 49 and 93 across runs of one document: a near-repeat is exactly the thing a
 * model decides differently each time.
 *
 * ===================================================================
 * THE RULE, AND WHY IT IS THIS NARROW
 * ===================================================================
 *
 * Two claims collapse only when they share BOTH a normalised figure AND a
 * normalised source. Either half alone is not enough:
 *
 *   Same figure, different source. "50% of marketers" from two studies is two
 *   claims, and merging them would hide a real disagreement between sources.
 *
 *   Same source, different figure. One article supports many numbers. Merging
 *   on the URL alone would delete most of what a stats piece says.
 *
 * A claim with no figure never collapses. "Adoption is rising" and "adoption
 * has stalled" cite the same page and are opposites, and there is no key that
 * safely tells them apart. Unsourced claims never collapse either: "no source"
 * is not evidence that two claims are the same claim, and a round number like
 * 50% will collide by chance.
 *
 * Normalisation is deliberately shallow. 96.5 and 96.55 are DIFFERENT
 * figures, and a normaliser that rounded them together would merge a claim
 * with its own near-miss, which is the one error this product cannot make.
 */

import type { Claim } from './types'

/** The shape dedupe needs. Kept structural so it works pre- and post-locate. */
export interface Dedupable {
  claimText: string
  quote: string
  figure?: string
  sourceUrl?: string
  sourceName?: string
  sourceForm: Claim['sourceForm']
}

/**
 * A figure, reduced to the characters that carry its value.
 *
 * Case, thousands separators, spacing and the word "percent" are noise.
 * Digits and the decimal point are not. Returns null when there is nothing
 * numeric in it, which is what stops a text-only "claim" from keying at all.
 */
export function normaliseFigure(raw: string | undefined): string | null {
  if (!raw) return null
  const t = raw
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/,/g, '')
    .replace(/percent(age)?/g, '%')
    // Currency and comparison words are not part of the value.
    .replace(/^(about|around|roughly|nearly|almost|over|under|morethan|lessthan)/, '')
  if (!/\d/.test(t)) return null
  return t
}

/**
 * A source, reduced to the page it points at.
 *
 * Trailing slashes, `www.`, the fragment and tracking parameters all vary
 * between two links to the same article. The path does not, so it stays.
 * Query parameters that are not tracking are kept, because `?page=2` is a
 * different page.
 */
const TRACKING = /^(utm_|gclid|fbclid|mc_|ref|source|si$)/i

export function normaliseSource(claim: Dedupable): string | null {
  if (claim.sourceForm === 'linked' && claim.sourceUrl) {
    try {
      const u = new URL(claim.sourceUrl)
      const host = u.hostname.toLowerCase().replace(/^www\./, '')
      const path = u.pathname.replace(/\/+$/, '')
      const keep = [...u.searchParams.entries()]
        .filter(([k]) => !TRACKING.test(k))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
      return `url:${host}${path}${keep ? `?${keep}` : ''}`
    } catch {
      return `url:${claim.sourceUrl.trim().toLowerCase()}`
    }
  }
  if (claim.sourceForm === 'named' && claim.sourceName) {
    return `name:${claim.sourceName.trim().toLowerCase().replace(/\s+/g, ' ')}`
  }
  // sourceForm 'none'. Deliberately unkeyable. See the header.
  return null
}

export interface DedupeResult<T> {
  kept: T[]
  /** How many were folded into an earlier claim. */
  removed: number
}

/**
 * Collapse repeats, keeping the fullest wording of each.
 *
 * "Fullest" is the longer claimText, because that is what gets searched and
 * what the reader is shown. The whole claim object is kept, never a mix of
 * two: the quote has to stay the one that the claimText actually came from or
 * the highlight lands on a sentence that does not say what the panel says.
 *
 * Document order is preserved, and a claim that replaces an earlier one takes
 * that one's position. A report that reorders itself because the second
 * mention was wordier would be hard to follow against the original.
 */
export function dedupeClaims<T extends Dedupable>(claims: T[]): DedupeResult<T> {
  const slot = new Map<string, number>()
  const kept: (T | null)[] = []
  let removed = 0

  for (const claim of claims) {
    const figure = normaliseFigure(claim.figure)
    const source = normaliseSource(claim)
    if (figure === null || source === null) {
      kept.push(claim)
      continue
    }
    const key = `${figure}@${source}`
    const at = slot.get(key)
    if (at === undefined) {
      slot.set(key, kept.length)
      kept.push(claim)
      continue
    }
    removed++
    const existing = kept[at] as T
    if (claim.claimText.length > existing.claimText.length) kept[at] = claim
  }

  return { kept: kept.filter((c): c is T => c !== null), removed }
}
