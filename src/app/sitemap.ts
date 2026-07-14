import type { MetadataRoute } from 'next'
import { PROMPT_LIBRARY, CATEGORY_HUBS } from '@/lib/prompt-library'
import { BLOG_POSTS } from '@/lib/blog-posts'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://deepclario.com'
  const now = new Date()

  // Generated from the library so new prompt pages appear automatically.
  const promptPages: MetadataRoute.Sitemap = PROMPT_LIBRARY.map(entry => ({
    url: `${base}/prompts/${entry.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Category hub pages (/prompts/category/<slug>) - generated from the hubs
  // registry so new categories appear automatically. Higher priority than a
  // single prompt page because a hub aggregates many.
  const categoryPages: MetadataRoute.Sitemap = CATEGORY_HUBS.map(hub => ({
    url: `${base}/prompts/category/${hub.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }))

  // Generated from the shared blog registry; lastModified reflects the real
  // edit date so search engines get an honest freshness signal.
  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map(post => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.dateModified),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // /playground, /tools/* and /detector are deliberately absent: the first two
  // are gone (301 -> /extension in next.config.ts) and the detector is
  // unrouted. Listing a redirect in a sitemap is a crawl-budget own goal.
  // The extension takes the top priority the playground used to hold - it is
  // the product now.
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/extension`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/prompts`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    ...categoryPages,
    ...promptPages,
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...blogPages,
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
