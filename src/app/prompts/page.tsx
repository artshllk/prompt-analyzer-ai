import type { Metadata } from 'next'
import Link from 'next/link'
import { PROMPT_LIBRARY, CATEGORY_HUBS } from '@/lib/prompt-library'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PromptLibraryBrowser } from '@/components/prompts/PromptLibraryBrowser'

export const metadata: Metadata = {
  title: 'Free AI Prompt Library - Copy-Paste Prompts That Work',
  description:
    'A free library of ready-to-use AI prompts for cover letters, emails, summaries, code review and more. Copy, paste, fill in the blanks. Works with ChatGPT, Claude, and Gemini.',
  alternates: { canonical: 'https://deepclario.com/prompts' },
  openGraph: {
    title: 'Free AI Prompt Library',
    description:
      'Ready-to-use AI prompts for real tasks: cover letters, emails, summaries, code review. Copy and paste.',
    url: 'https://deepclario.com/prompts',
    type: 'website',
    // No explicit image so the site's default OG card applies instead of
    // the square logo (which crops badly in social previews).
  },
}

const BASE = 'https://deepclario.com'

export default async function PromptsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams

  // Structured data: tells Google this is a curated collection and lists
  // every prompt page as an ItemList, which strengthens indexing of the
  // whole hub and its child pages. The index previously had no JSON-LD.
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Free AI Prompt Library',
    description:
      'A free, curated library of ready-to-use AI prompts for writing, work, coding, learning, and business. Works with ChatGPT, Claude, and Gemini.',
    url: `${BASE}/prompts`,
    isPartOf: { '@id': `${BASE}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: PROMPT_LIBRARY.length,
      itemListElement: PROMPT_LIBRARY.map((entry, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${BASE}/prompts/${entry.slug}`,
        name: entry.heading,
      })),
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Prompt Library', item: `${BASE}/prompts` },
    ],
  }

  return (
    <div
      className="editorial grain min-h-screen"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      {[collectionSchema, breadcrumbSchema].map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <MarketingNav current="prompts" />

      <main className="max-w-4xl mx-auto px-6 md:px-10 pt-28 md:pt-36 pb-16 md:pb-24">
        {/* Hero */}
        <div className="max-w-2xl">
          <p className="eyebrow mb-6">Free prompt library</p>
          <h1
            className="display text-5xl md:text-[4.5rem] leading-[1.05] tracking-tight"
            style={{ color: 'var(--color-paper)' }}
          >
            The free AI prompt library{' '}
            <span style={{ color: 'var(--color-paper-mute)' }}>that actually works.</span>
          </h1>
          <p className="mt-6 md:mt-8 text-lg md:text-xl leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
            Ready-to-use prompts for real tasks. Copy one, paste it into ChatGPT, Claude,
            or Gemini, and fill in the blanks. Each one is written the way a prompt
            engineer would write it, and free.
          </p>
        </div>

        {/* Browse by category - links to the hub pages. Gives crawlers a clean
            home -> hub -> prompt path and users a quick way in. */}
        <nav className="mt-10 md:mt-12 flex flex-wrap gap-2.5" aria-label="Prompt categories">
          {CATEGORY_HUBS.map(hub => (
            <Link
              key={hub.slug}
              href={`/prompts/category/${hub.slug}`}
              className="px-4 py-2 rounded-full text-sm transition-all row-hover"
              style={{
                border: '1px solid var(--color-rule-strong)',
                color: 'var(--color-paper)',
              }}
            >
              {hub.category}
            </Link>
          ))}
        </nav>

        {/* Search + category filter (client). All entries are still
            server-rendered for crawlers; this only filters on the client. */}
        <div className="mt-12 md:mt-14">
          <PromptLibraryBrowser entries={PROMPT_LIBRARY} initialQuery={q} />
        </div>

        {/* CTA */}
        <section
          className="mt-20 rounded-2xl p-8 md:p-10"
          style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}
        >
          <h2 className="font-serif text-2xl md:text-3xl mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Already have a prompt of your own?
          </h2>
          <p className="text-base md:text-lg leading-[1.6] mb-6 max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
            Templates are a starting point. Deepclario takes the prompt <em>you</em> wrote,
            scores it, and rewrites it for your exact task. Free, no account needed.
          </p>
          <Link
            href="/extension"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] transition-all btn-paper"
            style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
          >
            Improve my prompt free
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </section>
      </main>

      <footer className="px-6 md:px-10 py-10" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <div className="max-w-4xl mx-auto text-xs" style={{ color: 'var(--color-paper-mute)' }}>
          © 2026 Deepclario{' '}
          <Link href="/" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>
            deepclario.com
          </Link>
        </div>
      </footer>
    </div>
  )
}
