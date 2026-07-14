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
   * The product moved into the browser extension. The on-site playground and
   * tool pages are gone: nobody writes a prompt on one site to run it on
   * another.
   *
   * These are permanent redirects rather than deletions-with-404s because
   * roughly 50 blog posts link to these pages, and so does Google's index and
   * every marketing email already sent. Redirecting keeps all of that working
   * and hands the SEO equity to /extension, where the product actually lives.
   *
   * The blog CTAs can be rewritten at leisure. Nothing breaks in the meantime.
   */
  async redirects() {
    return [
      { source: '/playground', destination: '/extension', permanent: true },
      { source: '/tools/prompt-improver', destination: '/extension', permanent: true },
      { source: '/tools/prompt-analyzer', destination: '/extension', permanent: true },
      // The detector is unrouted, not deleted: its code and its 11 blog posts
      // stay. If the extension bet underperforms we have not destroyed a
      // working product - re-listing it is a one-line change.
      { source: '/detector', destination: '/', permanent: false },
    ]
  },
}

export default nextConfig
