import type { MetadataRoute } from 'next'
import { PROMPT_LIBRARY } from '@/lib/prompt-library'
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

  // Generated from the shared blog registry; lastModified reflects the real
  // edit date so search engines get an honest freshness signal.
  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map(post => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.dateModified),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/playground`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/detector`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/extension`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/prompts`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    ...promptPages,
    { url: `${base}/tools/prompt-improver`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/tools/prompt-analyzer`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...blogPages,
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
