import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  CATEGORY_HUBS,
  getCategoryHub,
  getPromptsInCategory,
} from '@/lib/prompt-library'
import { MarketingNav } from '@/components/marketing/MarketingNav'

const BASE = 'https://deepclario.com'

// Pre-render every category hub at build time - best for SEO crawling.
export function generateStaticParams() {
  return CATEGORY_HUBS.map(hub => ({ category: hub.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const hub = getCategoryHub(category)
  if (!hub) return { title: 'Category not found' }

  return {
    title: hub.metaTitle,
    description: hub.metaDescription,
    alternates: { canonical: `${BASE}/prompts/category/${hub.slug}` },
    openGraph: {
      title: hub.metaTitle,
      description: hub.metaDescription,
      url: `${BASE}/prompts/category/${hub.slug}`,
      type: 'website',
    },
  }
}

export default async function CategoryHubPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const hub = getCategoryHub(category)
  if (!hub) notFound()

  const prompts = getPromptsInCategory(hub.category)
  const pageUrl = `${BASE}/prompts/category/${hub.slug}`

  // Other hubs, for cross-linking at the bottom (hub-to-hub reach).
  const otherHubs = CATEGORY_HUBS.filter(h => h.slug !== hub.slug)

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: hub.heading,
    description: hub.metaDescription,
    url: pageUrl,
    isPartOf: { '@id': `${BASE}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: prompts.length,
      itemListElement: prompts.map((entry, i) => ({
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
      { '@type': 'ListItem', position: 3, name: hub.heading, item: pageUrl },
    ],
  }

  const jsonLd = [collectionSchema, breadcrumbSchema]

  return (
    <div
      className="editorial grain min-h-screen"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <MarketingNav current="prompts" />

      <main className="max-w-3xl mx-auto px-6 md:px-10 pt-28 md:pt-36 pb-14 md:pb-20">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
          <Link href="/prompts" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>
            Prompt library
          </Link>
          <span className="mx-2">/</span>
          <span>{hub.heading}</span>
        </nav>

        {/* Hero */}
        <p className="eyebrow mb-5">{hub.category} · Free prompts</p>
        <h1
          className="display text-4xl md:text-[3.5rem] leading-[1.1] tracking-tight"
          style={{ color: 'var(--color-paper)' }}
        >
          {hub.heading}
        </h1>
        {hub.intro.map((para, i) => (
          <p
            key={i}
            className="mt-6 text-lg leading-relaxed"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            {para}
          </p>
        ))}

        {/* The prompts in this category */}
        <section className="mt-12">
          <p className="eyebrow mb-4">
            {prompts.length} {hub.category.toLowerCase()} prompt{prompts.length === 1 ? '' : 's'}
          </p>
          <ul className="space-y-px">
            <li className="rule-strong" />
            {prompts.map(p => (
              <li key={p.slug}>
                <Link
                  href={`/prompts/${p.slug}`}
                  className="block py-5 px-3 -mx-3 rounded-md row-hover"
                >
                  <span className="block text-base md:text-lg" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>
                    {p.title}
                  </span>
                  <span className="block mt-1 text-sm leading-[1.5]" style={{ color: 'var(--color-paper-mute)' }}>
                    {p.intro}
                  </span>
                </Link>
                <div className="rule" />
              </li>
            ))}
          </ul>
        </section>

        {/* Product CTA */}
        <section
          className="mt-16 rounded-2xl p-7 md:p-9"
          style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}
        >
          <h2 className="font-serif text-2xl md:text-3xl mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Want one tuned to your exact task?
          </h2>
          <p className="text-base leading-[1.6] mb-6 max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
            A template gets you started. Deepclario takes <em>your</em> version of a prompt, scores it,
            asks what is missing, and rewrites it for your specific task. Free, no account needed.
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

        {/* Other categories - hub-to-hub links */}
        <section className="mt-16">
          <p className="eyebrow mb-4">Browse other categories</p>
          <ul className="space-y-px">
            <li className="rule-strong" />
            {otherHubs.map(h => (
              <li key={h.slug}>
                <Link
                  href={`/prompts/category/${h.slug}`}
                  className="block py-3.5 text-[15px] leading-snug row-hover-text"
                  style={{ color: 'var(--color-paper)' }}
                >
                  {h.heading}
                </Link>
                <div className="rule" />
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
            Or{' '}
            <Link href="/prompts" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>
              browse the full prompt library
            </Link>
            .
          </p>
        </section>
      </main>

      <footer className="px-6 md:px-10 py-10" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <div className="max-w-3xl mx-auto text-xs flex flex-wrap gap-x-4 gap-y-2" style={{ color: 'var(--color-paper-mute)' }}>
          <span>© 2026 Deepclario</span>
          <Link href="/prompts" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>
            All prompts
          </Link>
          <Link href="/" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>
            deepclario.com
          </Link>
        </div>
      </footer>
    </div>
  )
}
