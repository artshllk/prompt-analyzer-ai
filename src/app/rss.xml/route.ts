// RSS feed for blog posts. Used by feed readers, AI aggregators
// (Feedly, Inoreader), and some link directories to auto-pick up
// new content. Posts come from the shared registry in
// src/lib/blog-posts.ts, so new posts appear here automatically.

import { LISTED_POSTS } from '@/lib/blog-posts'

const BASE = 'https://deepclario.com'

function escape(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function GET() {
  const items = LISTED_POSTS.map(p => `
    <item>
      <title>${escape(p.title)}</title>
      <link>${BASE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${BASE}/blog/${p.slug}</guid>
      <description>${escape(p.description)}</description>
      <pubDate>${new Date(p.datePublished).toUTCString()}</pubDate>
    </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Deepclario Blog</title>
    <link>${BASE}/blog</link>
    <description>Practical guides on writing better prompts for ChatGPT, Claude, and Gemini.</description>
    <language>en-us</language>
    <atom:link href="${BASE}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
