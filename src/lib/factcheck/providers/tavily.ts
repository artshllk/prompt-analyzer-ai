import type {
  ProviderFailure,
  RetrievalProvider,
  RetrievalResult,
  RetrievedPage,
  UnretrievedPage,
} from './types'

/**
 * Tavily, behind the retrieval interface.
 *
 * Chosen over Exa on three details rather than on price, which is close:
 *
 *  - Failed extractions are not billed. `source_unreachable` is exactly the
 *    branch that fires on paywalls and link rot, which is the commonest thing
 *    we will hit, and it costs nothing.
 *  - /extract batches 20 URLs, which is exactly MAX_CLAIMS_PER_DOC, so one
 *    document's whole citation axis is one request.
 *  - 1,000 free credits a month, and a 20-claim document costs about 4, so
 *    validation runs at zero spend for roughly 250 documents a month.
 *
 * The same key covers /extract and /search, so the linked path and the named
 * path need one credential between them.
 *
 * NOT BUILDING A FETCHER IS THE POINT. Our server never resolves DNS for a URL
 * pulled out of somebody's pasted document, and never opens a socket to it, so
 * there is no SSRF surface here to guard. A document containing
 * http://169.254.169.254/ reaches Tavily's infrastructure, not ours.
 *
 * What that does NOT remove is prompt injection: retrieved content still flows
 * into a judge prompt. The defence is in citation.ts and it is the same on
 * both axes, that an evidence quote must be findable by indexOf in the text we
 * actually retrieved before it is allowed to mean anything.
 */

const BASE = 'https://api.tavily.com'

/** Their documented ceiling for one /extract call. Also our per-doc claim cap. */
export const EXTRACT_BATCH_LIMIT = 20

/** Long enough for a slow page, short enough to sit inside a request budget. */
const REQUEST_TIMEOUT_MS = 25_000

/**
 * Map an HTTP status to a failure.
 *
 * THE ONE THAT MATTERS: 432 (plan limit) and 433 (pay-as-you-go limit) are
 * `out_of_credit`, which is ours. They are deliberately NOT `unavailable` and
 * deliberately NOT anything the citation axis could turn into a statement
 * about the writer's link. Running out of credit must never produce a sentence
 * telling somebody their citation is wrong.
 */
function failureForStatus(status: number): ProviderFailure {
  if (status === 432 || status === 433) return 'out_of_credit'
  if (status === 429) return 'rate_limited'
  if (status === 401 || status === 403) return 'unauthorized'
  if (status >= 500) return 'unavailable'
  // 400 and friends mean we sent something wrong. That is still our fault, and
  // it is not a fact about the page.
  return 'malformed'
}

export class TavilyProvider implements RetrievalProvider {
  readonly name = 'tavily'
  private readonly key: string | undefined

  constructor(key = process.env.TAVILY_API_KEY) {
    this.key = key?.trim() || undefined
  }

  async extract(urls: string[]): Promise<RetrievalResult> {
    const unique = [...new Set(urls.filter(Boolean))].slice(0, EXTRACT_BATCH_LIMIT)
    if (unique.length === 0) return { ok: true, pages: [], unretrieved: [] }
    const res = await this.post('/extract', {
      urls: unique,
      extract_depth: 'basic',
      format: 'markdown',
    })
    // We asked for URLs and got back neither a page nor a named failure for
    // any of them. That is a response we do not understand, and treating it as
    // an empty success would let a check read zero pages and conclude the
    // source does not contain the claim. Emptiness means something different
    // here than it does for search, which is why the decision lives at the
    // call site rather than in readResponse.
    if (res.ok && res.pages.length === 0 && res.unretrieved.length === 0) {
      console.error('[tavily] /extract returned nothing for', unique.length, 'urls')
      return { ok: false, failure: 'malformed' }
    }
    return res
  }

  /**
   * Zero results here is a REAL ANSWER, not a malformed one: it means we
   * searched the publisher's own site and the claim is not on it, which is the
   * finding the writer most needs for an unlinked citation. That is the whole
   * reason emptiness is judged per endpoint rather than in readResponse.
   */
  async searchDomains(query: string, domains: string[]): Promise<RetrievalResult> {
    const clean = [...new Set(domains.filter(Boolean))]
    if (clean.length === 0 || !query.trim()) {
      return { ok: true, pages: [], unretrieved: [] }
    }
    return this.post('/search', {
      query: query.slice(0, 400),
      include_domains: clean,
      include_raw_content: 'markdown',
      search_depth: 'basic',
      max_results: 5,
    })
  }

  private async post(path: string, body: Record<string, unknown>): Promise<RetrievalResult> {
    if (!this.key) return { ok: false, failure: 'not_configured' }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.key}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        const failure = failureForStatus(res.status)
        console.error(`[tavily] ${path} ${res.status} -> ${failure}`)
        return { ok: false, failure }
      }

      const json: unknown = await res.json()
      return readResponse(json)
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError'
      console.error(`[tavily] ${path} ${aborted ? 'timeout' : 'network error'}:`, err)
      return { ok: false, failure: aborted ? 'timeout' : 'unavailable' }
    } finally {
      clearTimeout(timer)
    }
  }
}

/**
 * Read a 200 response into pages.
 *
 * Everything is treated as unknown and coerced, for the same reason coerce.ts
 * exists on the model side: a field typed string in the docs can arrive as
 * null, and one `.trim()` on it becomes an unhandled 500 three frames later. A
 * body we cannot read at all is `malformed`, which is a failure, which means
 * no check can conclude anything from it.
 */
export function readResponse(json: unknown): RetrievalResult {
  if (!json || typeof json !== 'object') return { ok: false, failure: 'malformed' }
  const obj = json as Record<string, unknown>

  // A body with no results array at all is a shape we do not understand. An
  // EMPTY results array is a different thing entirely and is left to the
  // caller, because it means "nothing found" for search and "something went
  // wrong" for extract.
  if (!Array.isArray(obj.results)) return { ok: false, failure: 'malformed' }

  const pages: RetrievedPage[] = []
  const unretrieved: UnretrievedPage[] = []

  for (const row of obj.results) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const url = typeof r.url === 'string' ? r.url : ''
    if (!url) continue
    const content =
      typeof r.raw_content === 'string' ? r.raw_content
        : typeof r.content === 'string' ? r.content
        : ''
    if (content.trim()) {
      pages.push({
        url,
        title: typeof r.title === 'string' ? r.title : '',
        content,
        retrievedAt: new Date().toISOString(),
      })
    } else {
      // A row with a URL and no readable body. Recorded as unretrieved rather
      // than dropped, because dropping it would leave the claim looking as
      // though we never asked, and `source_unreachable` is the honest answer
      // for a page we could not read.
      unretrieved.push({ url, detail: 'empty content' })
    }
  }

  if (Array.isArray(obj.failed_results)) {
    for (const row of obj.failed_results) {
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      const url = typeof r.url === 'string' ? r.url : ''
      if (!url) continue
      unretrieved.push({ url, detail: typeof r.error === 'string' ? r.error : 'unknown' })
    }
  }

  return { ok: true, pages, unretrieved }
}
