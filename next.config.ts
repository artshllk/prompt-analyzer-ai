import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is the default bundler in Next.js 16 - no config needed.
  // An empty `turbopack: {}` here broke Vercel's modifyConfig build step
  // (ERR_INVALID_ARG_TYPE: path undefined), so it is intentionally omitted.

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  /**
   * Config redirects run BEFORE filesystem routing, so anything listed here
   * wins even when a real page exists at that path. That is what made
   * /detector serve the homepage while a finished detector page sat in the
   * repo, and it is why this list stays short and gets read carefully.
   *
   * What used to be here, and why it is gone:
   *
   * - /detector -> /          The page, its client, /api/detector/analyze,
   *                           its quotas and its usage tracking were all
   *                           built and working. Thirteen blog posts, a
   *                           canonical tag and a JSON-LD block already
   *                           pointed at it. Hiding it broke all of that to
   *                           save nothing.
   * - /playground -> /extension
   * - /tools/prompt-improver -> /extension
   * - /tools/prompt-analyzer -> /extension
   *                           Sixty-four internal links pointed at these.
   *                           /playground is now a real page again. The
   *                           /tools/* pair never existed as pages and now
   *                           404s honestly; the links that pointed there
   *                           were repointed at /playground.
   *
   * The two Deep Rewrite posts are the one thing still redirected, and now
   * permanently. Deep Rewrite is deleted, not parked: it had no client, so
   * nothing could ever send deep:true and no paying customer could run it.
   * Both posts described it as a live Pro feature in detail, which makes them
   * wrong rather than merely stale, so the pages are gone. A 301 to /pricing
   * keeps the two indexed URLs working and sends someone who searched for a
   * Pro feature to what Pro actually includes.
   */
  async redirects() {
    return [
      /**
       * The fact checker moved to the homepage. One product, one URL, and
       * "deepclario.com" is what gets said to people.
       *
       * A config redirect runs BEFORE filesystem routing, which is normally
       * the trap this file exists to warn about. Here it is exactly what we
       * want: src/app/check/page.tsx is deleted, and /check must resolve to
       * the homepage rather than serve a second copy of the same tool at a
       * second URL.
       */
      // statusCode 301, not `permanent: true`. Next's `permanent` emits a 308,
      // which preserves the request method. This is a GET-only marketing URL
      // and 301 is what search engines and every link checker expect to see.
      { source: '/check', destination: '/', statusCode: 301 },
      { source: '/blog/what-is-deep-rewrite', destination: '/pricing', permanent: true },
      { source: '/blog/deep-rewrite-vs-standard-rewrite', destination: '/pricing', permanent: true },
    ]
  },
}

export default nextConfig
