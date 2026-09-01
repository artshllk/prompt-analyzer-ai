/**
 * Sources that only ever show current data.
 *
 * WHY THIS IS NOT OPTIONAL. Ahrefs cite StatCounter for "Google holds a 90.39%
 * global search engine market share". StatCounter today says 91.31%. The
 * article was correct when it was written, and the citation check calls it
 * `does_not_contain`, which reads to the writer as "your link is wrong" about
 * a link that was right.
 *
 * That is a false accusation, produced by us, on a real article by exactly the
 * kind of publisher this product is for. It is the failure the whole design is
 * built to avoid, and it arrives through a door nobody was watching.
 *
 * IT ALSO CANNOT BE SOLVED BY ARCHIVE LOOKUP. Measured: the Wayback
 * availability API returns NO SNAPSHOT for gs.statcounter.com, because live
 * dashboards are largely unarchived. So the archive cannot rescue this class,
 * and a list is the only thing that can.
 *
 * A live source is checked by NOT checking it. We say what is true and useful
 * instead: this cites a page that only shows current data, so your reader
 * cannot verify it either, and you should quote the date you read it. That is
 * better advice than any verdict we could have produced, and it costs nothing
 * because the page is never fetched.
 */

/**
 * Matched on the registrable host and its subdomains.
 *
 * Deliberately short and deliberately specific. A domain on this list is one
 * we will never check, so a wrong entry silently blinds the product to a whole
 * publisher. Add one only when the page genuinely cannot show what it showed
 * last month.
 */
const LIVE_HOSTS: readonly string[] = [
  // Market share and analytics dashboards. The canonical case.
  'gs.statcounter.com',
  'statcounter.com',
  'similarweb.com',
  'trends.google.com',
  'semrush.com/trending',
  'ahrefs.com/websites',
  // Live indices and counters.
  'worldometers.info',
  'internetlivestats.com',
  'speedtest.net/global-index',
  // Markets and prices, which are current by definition.
  'coinmarketcap.com',
  'finance.yahoo.com/quote',
  'google.com/finance',
  'tradingview.com/symbols',
  'xe.com/currencyconverter',
  // Platform status and usage pages that report "now".
  'downdetector.com',
  'npmtrends.com',
  'trends.builtwith.com',
]

/**
 * Does this URL point at something that only shows current data?
 *
 * Host and path prefix, never a substring of the whole URL: matching
 * 'statcounter.com' anywhere in the string would catch
 * 'example.com/why-statcounter-is-wrong', which is an ordinary article.
 */
export function isLiveSource(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
  const path = parsed.pathname.toLowerCase()

  for (const entry of LIVE_HOSTS) {
    const [entryHost, ...rest] = entry.split('/')
    const entryPath = rest.length ? `/${rest.join('/')}` : ''
    const hostMatches = host === entryHost || host.endsWith(`.${entryHost}`)
    if (!hostMatches) continue
    if (!entryPath) return true
    if (path.startsWith(entryPath)) return true
  }
  return false
}

/** Exposed for the eval and for a test that asserts every entry is well formed. */
export const LIVE_SOURCE_HOSTS = LIVE_HOSTS
