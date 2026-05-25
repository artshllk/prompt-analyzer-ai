import type { MetadataRoute } from 'next'
import { PROMPT_LIBRARY } from '@/lib/prompt-library'

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

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/playground`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/extension`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${base}/prompts`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    ...promptPages,
    { url: `${base}/tools/prompt-improver`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/tools/prompt-analyzer`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/blog/what-is-prompt-engineering`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/how-to-write-better-prompts`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/chatgpt-prompt-tips`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/prompt-engineering-examples`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/what-is-a-good-prompt`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/best-chatgpt-prompts-for-work`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/how-to-use-chatgpt-for-writing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/how-to-get-better-results-from-chatgpt`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/claude-ai-prompts`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/ai-prompt-best-practices`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/chatgpt-system-prompt-examples`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog/zero-shot-vs-few-shot-prompting`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
