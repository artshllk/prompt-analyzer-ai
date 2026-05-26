// RSS feed for blog posts. Used by feed readers, AI aggregators
// (Feedly, Inoreader), and some link directories to auto-pick up
// new content. Update POSTS when adding a new blog post.

const BASE = 'https://deepclario.com'

type Post = {
  slug: string
  title: string
  description: string
  date: string // ISO
}

const POSTS: Post[] = [
  { slug: 'zero-shot-vs-few-shot-prompting', title: 'Zero-Shot vs Few-Shot Prompting', description: 'What each technique is, when to use which, and real examples.', date: '2026-05-01' },
  { slug: 'chatgpt-system-prompt-examples', title: 'ChatGPT System Prompt Examples', description: 'Four ready-to-use system prompts for writing, coding, research, and strategy.', date: '2026-05-01' },
  { slug: 'ai-prompt-best-practices', title: 'AI Prompt Best Practices', description: 'Eight prompt best practices that consistently produce better output.', date: '2026-05-01' },
  { slug: 'claude-ai-prompts', title: 'Claude AI Prompts', description: 'How Claude handles prompts differently from ChatGPT, and what to do about it.', date: '2026-05-01' },
  { slug: 'how-to-get-better-results-from-chatgpt', title: 'How to Get Better Results from ChatGPT', description: 'Eight techniques that fix the most common reasons for mediocre ChatGPT output.', date: '2026-05-01' },
  { slug: 'how-to-use-chatgpt-for-writing', title: 'How to Use ChatGPT for Writing', description: 'A practical guide for getting ChatGPT to produce writing that does not sound like AI.', date: '2026-05-01' },
  { slug: 'best-chatgpt-prompts-for-work', title: 'Best ChatGPT Prompts for Work', description: 'Ready-to-use ChatGPT prompts for the most common work tasks.', date: '2026-05-01' },
  { slug: 'what-is-a-good-prompt', title: 'What Makes a Good AI Prompt', description: 'Five elements every strong prompt has, with practical guidance.', date: '2026-04-01' },
  { slug: 'prompt-engineering-examples', title: 'Prompt Engineering Examples', description: 'Real before-and-after examples across writing, coding, research, and business.', date: '2026-04-01' },
  { slug: 'chatgpt-prompt-tips', title: '10 ChatGPT Prompt Tips That Actually Work', description: 'Practical tips for writing better ChatGPT prompts with real examples.', date: '2026-04-01' },
  { slug: 'how-to-write-better-prompts', title: 'How to Write Better AI Prompts', description: 'Seven proven techniques for writing prompts that actually work.', date: '2026-04-01' },
  { slug: 'what-is-prompt-engineering', title: 'What is Prompt Engineering?', description: 'A complete guide for beginners.', date: '2026-04-01' },
]

function escape(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function GET() {
  const items = POSTS.map(p => `
    <item>
      <title>${escape(p.title)}</title>
      <link>${BASE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${BASE}/blog/${p.slug}</guid>
      <description>${escape(p.description)}</description>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
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
