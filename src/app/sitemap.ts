import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://deepclario.com'
  const now = new Date()

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/playground`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/tools/prompt-improver`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/tools/prompt-analyzer`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/blog/what-is-prompt-engineering`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/how-to-write-better-prompts`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/chatgpt-prompt-tips`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/prompt-engineering-examples`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/what-is-a-good-prompt`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
