import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { LISTED_POSTS } from '@/lib/blog-posts'

export const metadata: Metadata = {
  title: 'Blog - Using AI and Checking What It Writes',
  description: 'Free, plain-English guides on how AI writes, how to check the sources in what it hands you, how AI detection works, and how to get better results from ChatGPT, Claude, and Gemini.',
  alternates: { canonical: 'https://deepclario.com/blog' },
  openGraph: {
    title: 'Blog - Using AI and Checking What It Writes',
    description: 'Guides on how AI writes, how to check what it hands you, and how to get better results.',
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
          Writing with AI, and checking it
        </h1>
        <p className="text-lg leading-relaxed mb-14" style={{ color: 'var(--color-paper-mute)' }}>
          Free, practical guides on how AI writes, how to check the sources in what it hands
          you, and how to get more out of ChatGPT, Claude, and Gemini.
        </p>

        <ul className="space-y-px">
          <li className="rule-strong" />
          {LISTED_POSTS.map(post => (
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
            href="/prompt-improver"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] transition-all btn-brand"
            style={{ fontWeight: 500 }}
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
