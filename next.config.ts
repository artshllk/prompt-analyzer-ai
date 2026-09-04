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
      { source: '/blog/what-is-deep-rewrite', destination: '/pricing', permanent: true },
      { source: '/blog/deep-rewrite-vs-standard-rewrite', destination: '/pricing', permanent: true },

      /**
       * The prompt improver moved from /playground to /prompt-improver.
       *
       * "Playground" is a word nobody searches. The page ranks, if it ranks,
       * on "prompt improver", so that is the URL.
       *
       * PERMANENT, NOT TEMPORARY. A 302 tells Google to keep the old URL
       * indexed and pass nothing on, which is the opposite of a rename. 301
       * moves the history to the new URL and is the only correct answer when
       * the old one is never coming back.
       *
       * The /tools/* pair is here because both were real redirects once and
       * external links may still carry them. They have 404'd since, so this
       * is repair rather than migration.
       *
       * These run BEFORE filesystem routing, per the note above, which is
       * exactly what makes them work: there is no longer a page at
       * /playground, and if one is ever added by accident this entry will
       * hide it rather than serve two URLs for one tool.
       */
      { source: '/playground', destination: '/prompt-improver', permanent: true },
      { source: '/tools/prompt-improver', destination: '/prompt-improver', permanent: true },
      { source: '/tools/prompt-analyzer', destination: '/prompt-improver', permanent: true },
    ]
  },
}

export default nextConfig
