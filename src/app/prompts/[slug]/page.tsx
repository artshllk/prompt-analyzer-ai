import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PROMPT_LIBRARY, getPromptEntry, getAllPromptSlugs } from '@/lib/prompt-library'
import { CopyButton } from '../copy-button'
import { MarketingNav } from '@/components/marketing/MarketingNav'

const BASE = 'https://deepclario.com'

// Pre-render every prompt page at build time - fastest possible response,
// best for SEO crawling.
export function generateStaticParams() {
  return getAllPromptSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = getPromptEntry(slug)
  if (!entry) return { title: 'Prompt not found' }

  return {
    title: entry.metaTitle,
    description: entry.metaDescription,
    alternates: { canonical: `${BASE}/prompts/${entry.slug}` },
    openGraph: {
      title: entry.metaTitle,
      description: entry.metaDescription,
      url: `${BASE}/prompts/${entry.slug}`,
      type: 'article',
      images: [{ url: `${BASE}/logo.png`, width: 1254, height: 1254, alt: 'Deepclario' }],
    },
  }
}

export default async function PromptPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getPromptEntry(slug)
  if (!entry) notFound()

  // Related: up to 3 other entries, same category first.
  const related = [
    ...PROMPT_LIBRARY.filter(e => e.slug !== entry.slug && e.category === entry.category),
    ...PROMPT_LIBRARY.filter(e => e.slug !== entry.slug && e.category !== entry.category),
  ].slice(0, 3)

  const pageUrl = `${BASE}/prompts/${entry.slug}`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entry.heading,
    description: entry.metaDescription,
    author: { '@type': 'Organization', name: 'Deepclario', url: BASE },
    publisher: {
      '@type': 'Organization',
      name: 'Deepclario',
      logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` },
    },
    mainEntityOfPage: pageUrl,
    datePublished: '2026-04-01',
    dateModified: '2026-05-01',
  }

  // HowTo schema - Google can surface the prompt steps directly in search results
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: entry.heading,
    description: entry.metaDescription,
    step: [
      {
        '@type': 'HowToStep',
        name: 'Copy the prompt',
        text: 'Copy the ready-to-use prompt from the box above.',
      },
      {
        '@type': 'HowToStep',
        name: 'Fill in the placeholders',
        text: 'Replace every [SQUARE BRACKET] placeholder with your own details.',
      },
      {
        '@type': 'HowToStep',
        name: 'Paste into your AI tool',
        text: 'Paste the completed prompt into ChatGPT, Claude, or Gemini and run it.',
      },
    ],
  }

  // FAQ schema from whyItWorks - earns expanded FAQ rich result in Google
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Why does this ${entry.title.toLowerCase()} prompt work better than a basic one?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: entry.whyItWorks[0] ?? entry.metaDescription,
        },
      },
      {
        '@type': 'Question',
        name: `How do I adapt this prompt for my specific situation?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: entry.tips[0] ?? 'Replace the placeholders in square brackets with your own details.',
        },
      },
      {
        '@type': 'Question',
        name: `Does this prompt work with Claude and Gemini as well as ChatGPT?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. This prompt is model-agnostic and produces strong results in ChatGPT (GPT-4o), Claude, and Gemini. Paste it into any of them.',
        },
      },
    ],
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Prompt Library', item: `${BASE}/prompts` },
      { '@type': 'ListItem', position: 3, name: entry.title, item: pageUrl },
    ],
  }

  const jsonLd = [articleSchema, howToSchema, faqSchema, breadcrumbSchema]

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
          <span>{entry.title}</span>
        </nav>

        {/* Hero */}
        <p className="eyebrow mb-5">{entry.category} · Free prompt</p>
        <h1
          className="display text-4xl md:text-[3.5rem] leading-[1.1] tracking-tight"
          style={{ color: 'var(--color-paper)' }}
        >
          {entry.heading}
        </h1>
        <p className="mt-6 text-lg leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
          {entry.intro}
        </p>

        {/* The prompt */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow">Copy this prompt</p>
            <CopyButton text={entry.prompt} />
          </div>
          <pre
            className="rounded-2xl p-5 md:p-6 text-sm leading-[1.6] overflow-x-auto whitespace-pre-wrap"
            style={{
              background: 'var(--color-ink-card)',
              border: '1px solid var(--color-rule)',
              color: 'var(--color-paper)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {entry.prompt}
          </pre>
          <p className="mt-3 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
            Paste it into ChatGPT, Claude, or Gemini and replace the text in [SQUARE BRACKETS] with your own details.
          </p>
        </section>

        {/* Why it works */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl md:text-3xl mb-5" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Why this prompt works
          </h2>
          <ul className="space-y-px">
            <li className="rule-strong" />
            {entry.whyItWorks.map((point, i) => (
              <li key={i}>
                <div className="grid grid-cols-12 gap-4 py-5">
                  <span className="col-span-1 font-serif text-xl tabular-nums" style={{ color: 'var(--color-paper-mute)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="col-span-11 text-base leading-[1.6]" style={{ color: 'var(--color-paper-mute)' }}>
                    {point}
                  </p>
                </div>
                <div className="rule" />
              </li>
            ))}
          </ul>
        </section>

        {/* Tips */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl md:text-3xl mb-5" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            How to adapt it
          </h2>
          <ul className="space-y-3">
            {entry.tips.map((tip, i) => (
              <li key={i} className="flex gap-3 text-base leading-[1.6]" style={{ color: 'var(--color-paper-mute)' }}>
                <span style={{ color: 'var(--color-paper)' }}>-</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Product CTA - the bridge from free value to the product */}
        <section
          className="mt-16 rounded-2xl p-7 md:p-9"
          style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}
        >
          <h2 className="font-serif text-2xl md:text-3xl mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Want this tuned to your exact situation?
          </h2>
          <p className="text-base leading-[1.6] mb-6 max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
            A template gets you started. Deepclario takes <em>your</em> version of a prompt, scores it,
            asks what is missing, and rewrites it for your specific task. Free, no account needed.
          </p>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] transition-all btn-paper"
            style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
          >
            Improve my prompt free
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </section>

        {/* Related prompts - internal links help SEO and keep people on site */}
        {related.length > 0 && (
          <section className="mt-16">
            <p className="eyebrow mb-4">More free prompts</p>
            <ul className="space-y-px">
              <li className="rule-strong" />
              {related.map(r => (
                <li key={r.slug}>
                  <Link
                    href={`/prompts/${r.slug}`}
                    className="flex items-center justify-between py-4 px-3 -mx-3 rounded-md row-hover"
                  >
                    <span className="text-base" style={{ color: 'var(--color-paper)' }}>{r.heading}</span>
                    <span style={{ color: 'var(--color-paper-mute)' }}>→</span>
                  </Link>
                  <div className="rule" />
                </li>
              ))}
            </ul>
          </section>
        )}
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
