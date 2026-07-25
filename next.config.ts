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

      /**
       * The two Deep Rewrite posts, unrouted by the same logic.
       *
       * Both sell Deep Rewrite as a live Pro feature, and no client sends
       * deep:true any more - so after the pricing page stopped advertising it,
       * these were the last surface still doing so. They are delisted from
       * BLOG_POSTS (which removes them from /blog, the sitemap and RSS) and
       * redirected here so the indexed URLs do not 404.
       *
       * TEMPORARY (307), not permanent, for the same reason as the detector:
       * Deep Rewrite is being rebuilt as a Pro action in the extension, and a
       * 301 tells Google the move is final. Restoring both posts means adding
       * their BLOG_POSTS entries back and deleting these two lines.
       *
       * /pricing rather than /extension: someone who searched for a Pro
       * feature wants to know what Pro actually includes.
       *
       * The SEO cost is close to nothing. Both target branded queries that
       * only someone who already knows Deepclario would type, and nothing
       * internally links to either one.
       */
      { source: '/blog/what-is-deep-rewrite', destination: '/pricing', permanent: false },
      { source: '/blog/deep-rewrite-vs-standard-rewrite', destination: '/pricing', permanent: false },
    ]
  },
}

export default nextConfig
