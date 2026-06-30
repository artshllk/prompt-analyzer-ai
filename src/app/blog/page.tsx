import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'Blog - Prompt Engineering Guides and Tips',
  description: 'Free guides on prompt engineering, how to write better AI prompts, and getting more out of ChatGPT, Claude, and Gemini. Written by the Deepclario team.',
  alternates: { canonical: 'https://deepclario.com/blog' },
  openGraph: {
    title: 'Blog - Prompt Engineering Guides',
    description: 'Free guides on prompt engineering and writing better AI prompts.',
    url: 'https://deepclario.com/blog',
    type: 'website',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deepclario.com' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://deepclario.com/blog' },
  ],
}

const POSTS = [
  {
    slug: 'what-is-prompt-engineering',
    title: 'What is Prompt Engineering? A Complete Guide for Beginners',
    description: 'Prompt engineering is the practice of writing structured instructions for AI models to get better, more reliable results. Learn the fundamentals and key techniques.',
    readTime: '8 min read',
    tag: 'Guide',
  },
  {
    slug: 'how-to-write-better-prompts',
    title: 'How to Write Better AI Prompts - 7 Proven Techniques',
    description: '7 practical techniques to write better prompts for ChatGPT, Claude, and Gemini. Includes real before and after examples for each technique.',
    readTime: '7 min read',
    tag: 'Techniques',
  },
  {
    slug: 'chatgpt-prompt-tips',
    title: '10 ChatGPT Prompt Tips That Actually Work',
    description: 'Most ChatGPT users get mediocre results because their prompts are too vague. These 10 practical tips will immediately improve what you get back.',
    readTime: '6 min read',
    tag: 'Tips',
  },
  {
    slug: 'prompt-engineering-examples',
    title: 'Prompt Engineering Examples - Real Before and After Prompts',
    description: 'Real prompt engineering examples with before and after comparisons across writing, coding, research, and business use cases.',
    readTime: '9 min read',
    tag: 'Examples',
  },
  {
    slug: 'what-is-a-good-prompt',
    title: 'What Makes a Good AI Prompt? 5 Things Every Strong Prompt Has',
    description: 'A good AI prompt has five elements: goal clarity, context, format specification, constraints, and examples. Here is what each one means in practice.',
    readTime: '5 min read',
    tag: 'Fundamentals',
  },
  {
    slug: 'best-chatgpt-prompts-for-work',
    title: 'Best ChatGPT Prompts for Work (2026)',
    description: 'Ready-to-use ChatGPT prompts for emails, meeting notes, job descriptions, performance reviews, and SWOT analysis. Copy, fill in the blanks, get results.',
    readTime: '7 min read',
    tag: 'Templates',
  },
  {
    slug: 'how-to-use-chatgpt-for-writing',
    title: 'How to Use ChatGPT for Writing - A Practical Guide',
    description: 'How to use ChatGPT for writing without sounding like a robot. Covers blog posts, emails, stories, and marketing copy with real examples.',
    readTime: '8 min read',
    tag: 'Guide',
  },
  {
    slug: 'how-to-get-better-results-from-chatgpt',
    title: 'How to Get Better Results from ChatGPT - 8 Techniques',
    description: '8 techniques that fix the most common reasons people get mediocre ChatGPT output. Each one with a weak vs. strong prompt example.',
    readTime: '8 min read',
    tag: 'Techniques',
  },
  {
    slug: 'claude-ai-prompts',
    title: 'Claude AI Prompts - How to Write Better Prompts for Claude',
    description: 'How Claude handles prompts differently from ChatGPT, what it excels at, and ready-to-use prompt examples optimized for Claude.',
    readTime: '7 min read',
    tag: 'Guide',
  },
  {
    slug: 'ai-prompt-best-practices',
    title: 'AI Prompt Best Practices - What Actually Works in 2026',
    description: 'Eight prompt best practices that consistently produce better output across ChatGPT, Claude, and Gemini. Not theory - actual techniques.',
    readTime: '7 min read',
    tag: 'Best Practices',
  },
  {
    slug: 'chatgpt-system-prompt-examples',
    title: 'ChatGPT System Prompt Examples - What They Are and How to Use Them',
    description: 'What system prompts are, how to set them in ChatGPT, and four ready-to-use system prompt examples for writing, coding, research, and strategy.',
    readTime: '7 min read',
    tag: 'Guide',
  },
  {
    slug: 'zero-shot-vs-few-shot-prompting',
    title: 'Zero-Shot vs Few-Shot Prompting - What the Difference Means in Practice',
    description: 'Zero-shot and few-shot prompting explained clearly. What each technique is, when to use which, and real examples showing how examples change output.',
    readTime: '6 min read',
    tag: 'Fundamentals',
  },
]

export default function BlogIndexPage() {
  return (
    <div className="editorial grain min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <MarketingNav current="blog" />

      <main className="max-w-3xl mx-auto px-6 md:px-10 pt-28 md:pt-36 pb-14 md:pb-20">
        <p className="eyebrow mb-5">Blog</p>
        <h1
          className="display text-4xl md:text-5xl leading-[1.1] tracking-tight mb-4"
          style={{ color: 'var(--color-paper)' }}
        >
          Prompt engineering guides
        </h1>
        <p className="text-lg leading-relaxed mb-14" style={{ color: 'var(--color-paper-mute)' }}>
          Free, practical guides on writing better prompts for ChatGPT, Claude, and Gemini.
          No fluff, no theory for its own sake.
        </p>

        <ul className="space-y-px">
          <li className="rule-strong" />
          {POSTS.map(post => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="flex flex-col md:flex-row md:items-start gap-3 py-7 px-3 -mx-3 rounded-md row-hover group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="eyebrow text-xs">{post.tag}</span>
                    <span style={{ color: 'var(--color-paper-mute)' }} className="text-xs">· {post.readTime}</span>
                  </div>
                  <h2
                    className="text-lg font-semibold leading-snug mb-2"
                    style={{ color: 'var(--color-paper)' }}
                  >
                    {post.title}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
                    {post.description}
                  </p>
                </div>
                <span
                  className="text-lg mt-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--color-paper)' }}
                >
                  →
                </span>
              </Link>
              <div className="rule" />
            </li>
          ))}
        </ul>

        <div
          className="mt-16 rounded-2xl p-7 md:p-9"
          style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}
        >
          <h2 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Want to improve a specific prompt right now?
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-paper-mute)' }}>
            Deepclario scores your prompt, asks what is missing, and rewrites it for you. Free, no account needed.
          </p>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] transition-all btn-paper"
            style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
          >
            Try the prompt improver
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </main>

      <footer className="px-6 md:px-10 py-10" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <div className="max-w-3xl mx-auto text-xs flex flex-wrap gap-x-4 gap-y-2" style={{ color: 'var(--color-paper-mute)' }}>
          <span>© 2026 Deepclario</span>
          <Link href="/" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>deepclario.com</Link>
          <Link href="/prompts" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>Prompt library</Link>
        </div>
      </footer>
    </div>
  )
}
