import type { MetadataRoute } from 'next'
import { PROMPT_LIBRARY, CATEGORY_HUBS } from '@/lib/prompt-library'
import { LISTED_POSTS } from '@/lib/blog-posts'

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
  const blogPages: MetadataRoute.Sitemap = LISTED_POSTS.map(post => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.dateModified),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // /tools/* stays absent: those pages never existed and now 404 honestly.
  //
  // /playground stays listed but drops to 0.4. The prompt improver is frozen,
  // so it is no longer something to push, but it is still a real working page
  // that 41 blog posts link to. Delisting a page dozens of internal links
  // point at tells Google those links go somewhere we do not believe in, which
  // hurts the posts more than it helps anything.
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/extension`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/detector`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/prompts`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/playground`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    ...categoryPages,
    ...promptPages,
    { url: `${base}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...blogPages,
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
