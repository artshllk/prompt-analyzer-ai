import type { MetadataRoute } from 'next'
import { PROMPT_LIBRARY, CATEGORY_HUBS } from '@/lib/prompt-library'
import { LISTED_POSTS } from '@/lib/blog-posts'

// Real edit dates, kept by hand. These used to be `new Date()`, which told
// Google that all 45 non-blog URLs changed at every build. Google detects a
// lastmod that is always "now" and stops trusting the whole file, including
// the blog entries, which are honest and are the ones we actually want
// crawled on a schedule. A stale-but-true date is worth more than a fresh lie.
//
// Update the date on a page when its CONTENT changes. Not on a refactor, and
// not on a dependency bump.
const UPDATED = {
  home: '2026-09-04',
  extension: '2026-09-02',
  detector: '2026-09-02',
  promptsIndex: '2026-08-31',
  promptImprover: '2026-09-04',
  promptLibrary: '2026-07-12',
  howItWorks: '2026-09-02',
  pricing: '2026-09-03',
  faq: '2026-09-04',
  blogIndex: '2026-09-04',
  privacy: '2026-09-02',
  terms: '2026-09-03',
  refund: '2026-09-02',
} as const

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://deepclario.com'
  const on = (d: string) => new Date(d)

  // Generated from the library so new prompt pages appear automatically.
  const promptPages: MetadataRoute.Sitemap = PROMPT_LIBRARY.map(entry => ({
    url: `${base}/prompts/${entry.slug}`,
    lastModified: on(UPDATED.promptLibrary),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Category hub pages (/prompts/category/<slug>) - generated from the hubs
  // registry so new categories appear automatically. Higher priority than a
  // single prompt page because a hub aggregates many.
  const categoryPages: MetadataRoute.Sitemap = CATEGORY_HUBS.map(hub => ({
    url: `${base}/prompts/category/${hub.slug}`,
    lastModified: on(UPDATED.promptLibrary),
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
  // /prompt-improver and /extension both sit at 0.4. Both are frozen, so
  // neither is something to push, but both are real working pages that the
  // blog still links to (30 links across 26 prompting posts). Delisting a
  // page that internal links point at tells Google those links go somewhere
  // we do not believe in, which hurts the linking posts more than it helps.
  //
  // /extension used to be 0.9, the highest priority on the site after the
  // homepage, which said the frozen browser extension mattered more than
  // pricing, the FAQ and every blog post.
  return [
    { url: base, lastModified: on(UPDATED.home), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/how-it-works`, lastModified: on(UPDATED.howItWorks), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/detector`, lastModified: on(UPDATED.detector), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${base}/prompts`, lastModified: on(UPDATED.promptsIndex), changeFrequency: 'weekly', priority: 0.85 },
    ...categoryPages,
    ...promptPages,
    { url: `${base}/pricing`, lastModified: on(UPDATED.pricing), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/faq`, lastModified: on(UPDATED.faq), changeFrequency: 'monthly', priority: 0.6 },
    ...blogPages,
    { url: `${base}/blog`, lastModified: on(UPDATED.blogIndex), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/extension`, lastModified: on(UPDATED.extension), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/prompt-improver`, lastModified: on(UPDATED.promptImprover), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/privacy`, lastModified: on(UPDATED.privacy), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: on(UPDATED.terms), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/refund`, lastModified: on(UPDATED.refund), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
