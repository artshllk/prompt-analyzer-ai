import type { MetadataRoute } from 'next'

/**
 * ONE GROUP, NOT TWO. This used to emit two separate `User-agent: *` records,
 * one allowing / and one listing the disallows. Google and Bing merge records
 * with the same user-agent so the result was right, but RFC 9309 leaves split
 * groups to the crawler and smaller ones differ. A single record says the same
 * thing without depending on that.
 *
 * AI CRAWLERS ARE ALLOWED, DELIBERATELY. GPTBot, ClaudeBot, PerplexityBot,
 * OAI-SearchBot, CCBot and Google-Extended all inherit the `*` rule, and that
 * is the decision rather than an oversight. A tool whose whole job is checking
 * whether AI-drafted citations hold up should be findable inside the
 * assistants people draft in. Blocking them would hide the product from the
 * exact moment it is needed, to protect writing we publish in order to be
 * read. Revisit only if the crawl volume itself starts costing money.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /api/ is machinery. The other three are signed-in surfaces with
        // nothing to index; they also carry their own noindex, since
        // disallow only stops crawling and a URL linked from elsewhere can
        // still be listed without it.
        disallow: ['/api/', '/history', '/settings', '/auth/'],
      },
    ],
    sitemap: 'https://deepclario.com/sitemap.xml',
  }
}
