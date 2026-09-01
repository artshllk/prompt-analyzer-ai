/**
 * The retrieval interface, and the failure taxonomy that keeps our problems
 * from being reported as the writer's problems.
 *
 * ===================================================================
 * THE STRUCTURAL RULE THIS FILE EXISTS TO ENFORCE
 * ===================================================================
 *
 * `does_not_contain` is the citation axis telling a writer their link is
 * wrong. It must be reachable ONLY from a request that succeeded and returned
 * content we actually read. Every transport-level outcome, every billing
 * outcome, and every provider outage must be structurally incapable of
 * producing it.
 *
 * That is why retrieval returns a discriminated union rather than a page and a
 * nullable error. On the failure branch there is no content field at all, so
 * there is nothing for a check to read and nothing to conclude from. The
 * compiler makes the mistake unwritable instead of a reviewer having to catch
 * it.
 *
 * RUNNING OUT OF CREDIT IS THE SHARPEST VERSION OF THIS. Tavily returns 432
 * for a plan limit and 433 for a pay-as-you-go limit. If either were mapped to
 * `source_unreachable`, the writer would read "we could not open your link,
 * your reader may not either" about a perfectly good link, because we did not
 * pay our bill. That sentence blames them for our billing, which is the same
 * class of error as returning 402 for our own database outage, and we already
 * decided that one was unacceptable.
 *
 * So credit exhaustion is `out_of_credit`, it is document-wide, it is OUR
 * fault, and it says so.
 */

/** One page we actually retrieved and read. */
export interface RetrievedPage {
  url: string
  title: string
  /** Extracted text or markdown. The only thing a check is allowed to read. */
  content: string
  retrievedAt: string
}

/** A URL the provider tried and could not get. This one IS about their link. */
export interface UnretrievedPage {
  url: string
  /** Provider's own message. Logged, never shown to a writer verbatim. */
  detail: string
}

/**
 * Why a whole request failed.
 *
 * Every member of this union is a statement about US or about the provider.
 * None of them is a statement about the writer's document, which is the point.
 */
export type ProviderFailure =
  | 'out_of_credit'   // 432 / 433. We did not pay. Never the writer's fault.
  | 'rate_limited'    // 429. Also ours: we sent too many.
  | 'unauthorized'    // 401 / 403. Key missing, wrong, or revoked.
  | 'timeout'
  | 'unavailable'     // 5xx, network, DNS
  | 'malformed'       // 200 with a body we could not read
  | 'not_configured'  // no key set. The state this repo is in until Art adds one.

/**
 * The result of asking a provider for content.
 *
 * Note the shape: `pages` exists only on the success branch. A caller cannot
 * read content out of a failure because there is no content field to read.
 */
export type RetrievalResult =
  | { ok: true; pages: RetrievedPage[]; unretrieved: UnretrievedPage[] }
  | { ok: false; failure: ProviderFailure }

/**
 * Everything the citation axis needs from the outside world.
 *
 * Two methods, deliberately. Tavily and Exa both implement both, so switching
 * providers is a constructor swap rather than a rewrite, and the eval can
 * implement it with frozen fixtures and no network at all.
 */
export interface RetrievalProvider {
  readonly name: string
  /** Fetch the content at these exact URLs. The linked-source path. */
  extract(urls: string[]): Promise<RetrievalResult>
  /**
   * Search for `query`, restricted to these domains. The named-source path:
   * the writer said "according to Ahrefs" and gave no link, so we go and look
   * on ahrefs.com.
   */
  searchDomains(query: string, domains: string[]): Promise<RetrievalResult>
}

/**
 * Is this failure ours rather than the provider being momentarily busy?
 *
 * Used only for logging and for deciding whether a retry could ever help.
 * `out_of_credit` and `unauthorized` will not fix themselves, so retrying
 * them just spends latency.
 */
export function isPermanent(f: ProviderFailure): boolean {
  return f === 'out_of_credit' || f === 'unauthorized' || f === 'not_configured'
}
