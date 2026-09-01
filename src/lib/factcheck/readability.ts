/**
 * Can we honestly read this source, and if not, why not?
 *
 * ===================================================================
 * "CANNOT CHECK" IS NOT SILENCE. IT IS A SECOND FINDING.
 * ===================================================================
 *
 * The instinct is to treat an unreadable source as coverage lost: we could not
 * judge it, so we say nothing. That is wrong, and it undersells the honest
 * answer badly.
 *
 * If a citation is behind a paywall, THE READER HITS THE SAME WALL WE DID. If
 * it is dead, they land on a product page. If it is a live dashboard, the
 * number they see will not be the number that was written. Every one of those
 * is a real credibility problem in the writer's document, with a real fix:
 * cite the primary source instead.
 *
 * So a refused citation is not a gap in what we can say. It is a different
 * sentence we can say with complete confidence, and one we can say WITHOUT
 * ever reading the page:
 *
 *   "12 of your citations your reader cannot verify either:
 *    9 paywalled, 2 dead, 1 live dashboard."
 *
 * That claim needs no judgement, carries no risk of false accusation, and is
 * arguably more useful than a verdict, because the fix is unambiguous.
 */

export type Readability =
  | 'readable'    // real content came back and a judge can work on it
  | 'paywalled'   // masked, truncated, or gated
  | 'dead'        // 404, gone, or redirected somewhere else entirely
  | 'live_source' // a dashboard, current data only
  | 'no_source'   // nothing was cited at all

/**
 * Hosts that gate their figures from non-subscribers.
 *
 * MEASURED. Statista returns 3,346 to 9,395 characters of page against a
 * non-paywalled median above 12,000, with the numbers rendered as asterisks in
 * the chart. The description paragraph sometimes carries a figure and
 * sometimes does not, which is worse than a clean refusal, because a page that
 * is PARTLY readable produces a confident `does_not_contain` about a number
 * that is sitting right there behind the mask.
 *
 * Ten of SproutSocial's thirteen sampled citations are Statista, so this one
 * host decides what we can say about a whole article.
 */
const PAYWALLED_HOSTS: readonly string[] = [
  'statista.com',
  'wsj.com',
  'ft.com',
  'nytimes.com',
  'economist.com',
  'bloomberg.com',
  'hbr.org',
  'gartner.com',
  'forrester.com',
  'sciencedirect.com',
  'jstor.org',
  'springer.com',
  'tandfonline.com',
  'wiley.com',
  'nature.com',
  'lancet.com',
  'thetimes.co.uk',
  'telegraph.co.uk',
  'businessinsider.com',
  'theinformation.com',
]

/**
 * Text that a gate leaves behind.
 *
 * Asterisk runs are the strongest single signal and the reason this is not
 * just a length test: Statista renders a masked figure as `***`, so the page
 * can be long and still have had every number removed from it.
 */
const GATE_MARKERS: readonly RegExp[] = [
  /\*{3,}/,
  /\bsubscribe to (?:read|continue|unlock)/i,
  /\bthis (?:content|article|chart) is (?:for|available to) (?:subscribers|members)/i,
  /\b(?:unlock|access) (?:this|all|full) (?:statistic|data|content|report)/i,
  /\bregister (?:now )?to (?:see|view|access)/i,
  /\byou have reached your (?:free )?(?:article|monthly) limit/i,
  /\bpremium (?:statistic|content|account required)/i,
  /\bsign in to (?:read|view|continue)/i,
]

/**
 * Below this, a page is a shell rather than a page.
 *
 * Raised hard from 1,200. Measured: paywalled Statista pages came back between
 * 3,346 and 9,395 characters while genuinely readable articles ran past
 * 12,000. 1,200 caught 2 of 11. This is deliberately aggressive, because the
 * cost of being wrong is asymmetric: refusing a readable page costs one
 * citation of coverage, and accepting a gated one produces a false accusation
 * about somebody's writing.
 */
export const MIN_READABLE_CHARS = 3_000

export function isPaywalledHost(url: string): boolean {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return false
  }
  return PAYWALLED_HOSTS.some(h => host === h || host.endsWith(`.${h}`))
}

/** Does the retrieved text carry the marks of a gate? */
export function looksGated(content: string): boolean {
  return GATE_MARKERS.some(rx => rx.test(content))
}

/**
 * Classify what came back for one source.
 *
 * `retrieved` is null when the provider named the URL as failed, which is the
 * only thing that can mean `dead`. Everything else is decided from the text.
 */
export function classifySource(url: string, retrieved: string | null): Readability {
  if (retrieved === null) return 'dead'

  const text = retrieved.trim()
  // A gated host that returned a short page is gated, whatever else is true.
  // Checked before length alone so the reason we report is the useful one.
  if (isPaywalledHost(url) && text.length < 20_000) return 'paywalled'
  if (looksGated(text)) return 'paywalled'
  if (text.length < MIN_READABLE_CHARS) return 'paywalled'
  return 'readable'
}

/** The sentence for the writer. Never a verdict, always a fix. */
export const READABILITY_COPY: Record<Exclude<Readability, 'readable'>, string> = {
  paywalled: 'Your reader hits the same paywall we did. Cite the primary source if you can.',
  dead: 'That link is gone. Your reader lands on nothing, or on something else entirely.',
  live_source: 'That page only shows current data, so the number your reader sees will not be the one you wrote.',
  no_source: 'No source was given, so there is nothing for a reader to follow.',
}

export const PAYWALLED_HOST_LIST = PAYWALLED_HOSTS
