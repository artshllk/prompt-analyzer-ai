/**
 * Is the source checker actually checking anything?
 *
 * ===================================================================
 * WHY A STATUS CODE IS NOT A HEALTH CHECK HERE
 * ===================================================================
 *
 * This product has been dark twice in two days and both times a human found
 * out by using it.
 *
 * The first outage is the one that decides the shape of this file. The Tavily
 * key was missing from production, so `new TavilyProvider()` had no key, every
 * check returned `not_configured`, every claim came back `not_applicable`, and
 * THE REQUEST RETURNED HTTP 200. A status check, an uptime monitor, a ping,
 * any of the obvious things, would have reported the product healthy for as
 * long as that lasted while it checked nothing at all.
 *
 * So the assertion is about the RESULT: at least one claim was judged against
 * a page we really fetched and read. Nothing else proves the whole path is
 * alive, because nothing else requires it to be. Reaching a judgement means
 * extraction ran, the model answered, retrieval had a key, the provider
 * returned a readable page, and the judge came back with something the
 * evidence gate accepted.
 */

import type { Claim } from './types'

/**
 * The document under test.
 *
 * Two claims, and only one of them costs anything, which is deliberate.
 *
 * The linked claim is the whole point: it must be fetched and judged, and if
 * it is not, we are down. The unsourced one is free (no source means no fetch
 * and no judge call) and it exercises the other branch, so a build that
 * started reporting everything as unsourced would show up as the linked claim
 * going quiet rather than as silence everywhere.
 *
 * It cites Wikipedia because the check has to fail for OUR outages and not
 * somebody else's. A page that is enormous, never paywalled, never rotates
 * and almost never blocks a fetcher is the closest thing to a constant the
 * open web has.
 *
 * The verdict does not matter. `supports` and `does_not_contain` both prove
 * the path works, so the figure below does not need to be true and this file
 * never needs updating when the page changes.
 */
export const HEALTH_DOC =
  'Search engine optimisation has been studied for decades. ' +
  'One survey found that [41.2% of marketers rank technical SEO first](https://en.wikipedia.org/wiki/Search_engine_optimization). ' +
  'A separate report claimed that 62% of small businesses now publish weekly, with no source given.'

export type HealthVerdict =
  | { ok: true; judged: number; checked: number; ms: number }
  | { ok: false; reason: string; detail: string; ms: number }

/**
 * The one thing that counts as working.
 *
 * `supports` and `does_not_contain` are the only two outcomes that can be
 * reached by reading a page. Everything else - not_applicable,
 * source_unreachable - is reachable without retrieval working at all, which
 * is exactly how the last outage hid.
 */
export function judgedCount(claims: Claim[]): number {
  return claims.filter(
    c => c.citation.check === 'supports' || c.citation.check === 'does_not_contain'
  ).length
}
