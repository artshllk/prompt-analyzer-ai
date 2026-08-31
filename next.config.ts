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
   * The two Deep Rewrite posts stay redirected for now. They sell a Pro
   * feature that no client can reach, so they are delisted from BLOG_POSTS
   * (which removes them from /blog, the sitemap and RSS) and sent to
   * /pricing rather than 404ing an indexed URL. Temporary (307), not
   * permanent: the feature is being removed outright, and these two lines
   * go with it.
   */
  async redirects() {
    return [
      { source: '/blog/what-is-deep-rewrite', destination: '/pricing', permanent: false },
      { source: '/blog/deep-rewrite-vs-standard-rewrite', destination: '/pricing', permanent: false },
    ]
  },
}

export default nextConfig
