import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'What AI Detectors Look For in Writing',
  description: 'AI detectors do not read for meaning. They look for a few specific patterns in the writing. Here is exactly what they measure, in plain terms.',
  alternates: { canonical: 'https://deepclario.com/blog/what-ai-detectors-look-for' },
  openGraph: {
    title: 'What AI Detectors Look For in Writing',
    description: 'AI detectors do not read for meaning. They look for a few specific patterns in the writing. Here is exactly what they measure.',
    url: 'https://deepclario.com/blog/what-ai-detectors-look-for',
    type: 'article',
  },
}

const post = getBlogPost('what-ai-detectors-look-for')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What AI Detectors Look For in Writing',
  description: 'The specific patterns AI detectors measure, including predictability and sentence variety, explained without jargon.',
  author: { '@type': 'Organization', name: 'Deepclario' },
  publisher: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  datePublished: post.datePublished,
  dateModified: post.dateModified,
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'what do ai detectors look for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'They look at how predictable the writing is and how much the sentence length and rhythm vary. AI text tends to be smooth and even, so low surprise and low variety push the AI score up.',
      },
    },
    {
      '@type': 'Question',
      name: 'do ai detectors understand the meaning of text?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. They do not judge whether the ideas are good or true. They measure surface patterns in the writing, like word predictability and sentence variety, and guess from those.',
      },
    },
    {
      '@type': 'Question',
      name: 'what makes writing look ai-generated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Smoothness. Writing where each word is easy to predict and every sentence has a similar length and rhythm looks machine-made. Human writing is usually bumpier, with more surprise and more variety.',
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deepclario.com' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://deepclario.com/blog' },
    { '@type': 'ListItem', position: 3, name: 'What AI Detectors Look For', item: 'https://deepclario.com/blog/what-ai-detectors-look-for' },
  ],
}

export default function WhatAIDetectorsLookForPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="editorial grain min-h-screen">
        <MarketingNav current="blog" />

        <main className="max-w-2xl mx-auto px-6 pt-28 md:pt-36 pb-16">
          <div className="mb-6">
            <Link href="/" className="text-xs text-[color:var(--color-paper-mute)] hover:text-[color:var(--color-paper-mute)] transition-colors">← Back to Deepclario</Link>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-[color:var(--color-paper)] font-semibold uppercase tracking-wider">AI Detection</span>
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 6 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            What AI Detectors Look For
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            An AI detector does not read your writing the way a teacher does. It does not care if
            the ideas are good. It scans for a few specific patterns on the surface of the text.
            Once you know what those are, the score stops feeling like magic.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">It measures the writing, not the meaning</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                This is the part people get wrong. A detector cannot tell whether an argument is
                smart or an essay is honest. It only sees the shape of the words. Everything it
                reports comes from patterns in that shape, not from understanding.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                There are two patterns that do most of the work.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Signal 1: How predictable each word is</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                AI models write by choosing the most likely next word again and again. So AI text is
                full of words that are easy to guess from the ones before them. A detector checks how
                surprising each word is. Low surprise looks like a machine.
              </p>
              <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper-mute)] mb-2">Easy to predict, so it reads as AI:</p>
                <p className="text-sm text-[color:var(--color-paper)] italic">&ldquo;In conclusion, it is important to consider the many benefits and drawbacks.&rdquo;</p>
                <p className="text-sm text-[color:var(--color-paper-mute)] mt-3 mb-2">Harder to predict, so it reads as human:</p>
                <p className="text-sm text-[color:var(--color-paper)] italic">&ldquo;Anyway, the whole benefits-and-drawbacks thing misses the point.&rdquo;</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Signal 2: How much the rhythm varies</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                People mix long and short sentences without thinking about it. One sentence runs on,
                the next is three words. AI text tends to keep a steadier beat, with sentences of
                similar length one after another. A detector measures that variety, and low variety
                pushes the score toward AI.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Between these two signals, predictability and variety, a detector builds its guess.
                That is really all it has.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why knowing this helps</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Once you know a detector only measures smoothness, its blind spots make sense. Plain,
                careful human writing is smooth, so it can be flagged. Lightly edited AI text is
                bumpy enough to pass. The tool is not judging authorship. It is judging texture, and
                texture and authorship are not the same thing.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">See these signals on real text</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Paste any text into the Deepclario detector and see how predictable and even it is. Free, no account needed.</p>
            <Link href="/detector" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Try the AI detector →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/how-ai-detectors-work" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI detectors work →
              </Link>
              <Link href="/blog/human-text-vs-ai-text" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Human text vs AI text: what actually differs →
              </Link>
              <Link href="/blog/ai-detection-score-explained" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI detection score explained →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
