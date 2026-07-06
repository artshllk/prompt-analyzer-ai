import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'Human Text vs AI Text: What Actually Differs',
  description: 'What really separates human writing from AI writing? Here are the real differences in rhythm, surprise, and voice, and why the line is blurrier than it looks.',
  alternates: { canonical: 'https://deepclario.com/blog/human-text-vs-ai-text' },
  openGraph: {
    title: 'Human Text vs AI Text: What Actually Differs',
    description: 'What really separates human writing from AI writing? Here are the real differences in rhythm, surprise, and voice.',
    url: 'https://deepclario.com/blog/human-text-vs-ai-text',
    type: 'article',
  },
}

const post = getBlogPost('human-text-vs-ai-text')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Human Text vs AI Text: What Actually Differs',
  description: 'The genuine differences between human and AI writing, why detectors rely on them, and why the differences are shrinking.',
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
      name: 'what is the difference between human and ai writing?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Human writing tends to be bumpier: more variety in sentence length, more surprising word choices, and a personal voice. AI writing is smoother and more even by default. But careful human writing can be smooth too, so the line is not sharp.',
      },
    },
    {
      '@type': 'Question',
      name: 'can you tell ai writing just by reading it?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sometimes, on raw output. AI text often feels a bit generic, evenly paced, and hedged. But once it is edited, or written by a skilled human in a plain style, reading alone is not reliable.',
      },
    },
    {
      '@type': 'Question',
      name: 'is ai writing getting harder to spot?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Newer models write with more variety and voice, so the old tells are fading. The gap between good AI text and human text keeps narrowing, which is why detection is getting harder, not easier.',
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
    { '@type': 'ListItem', position: 3, name: 'Human Text vs AI Text', item: 'https://deepclario.com/blog/human-text-vs-ai-text' },
  ],
}

export default function HumanTextVsAITextPage() {
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
            Human Text vs AI Text
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            There are real differences between how people write and how AI writes. They are just
            softer than most people assume, and they are shrinking. Here is what actually differs,
            and why you cannot lean on it as hard as you would like.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The differences that are real</h2>
              <div className="space-y-3">
                {[
                  { t: 'Rhythm', d: 'People vary sentence length without trying. A long one, then a short punch. AI text keeps a steadier, more even beat by default.' },
                  { t: 'Surprise', d: 'Humans reach for the odd word, the unexpected turn. AI usually picks the safe, likely word, so it reads as smooth and a little predictable.' },
                  { t: 'Voice', d: 'A person has quirks, opinions, and a point of view that leaks through. Raw AI text often feels balanced to the point of having no one behind it.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why the line is blurry</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Each of those differences has a big exception. Plenty of human writing is even and
                plain, especially in formal, technical, or second-language writing. And AI can be
                prompted to write with more variety and voice. So the same trait shows up on both
                sides.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                That is why &ldquo;it just sounds like AI&rdquo; is a weak basis for a decision. The
                traits are tendencies, not proof.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Two short samples</h2>
              <div className="grid gap-4">
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[color:var(--color-paper)] font-semibold uppercase mb-2">Reads more like AI</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)] italic">&ldquo;There are many important factors to consider. Each one plays a valuable role in the overall process and should be carefully evaluated.&rdquo;</p>
                </div>
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[color:var(--color-paper)] font-semibold uppercase mb-2">Reads more like a person</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)] italic">&ldquo;Most of it does not matter. One thing does, and everyone ignores it.&rdquo;</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The gap is closing</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Newer models write with more rhythm and more voice than early ones did. The old
                tells, the hedging and the flat evenness, are fading. This is the real reason
                detection keeps getting harder. The differences that human and machine writing once
                had are quietly disappearing, which is worth remembering before you trust your own
                ear or any tool too much.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Put a sample to the test</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Paste any text into the Deepclario detector and see where it lands on the human-to-AI scale. Free, no account needed.</p>
            <Link href="/detector" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Try the AI detector →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/what-ai-detectors-look-for" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What AI detectors look for →
              </Link>
              <Link href="/blog/ai-detector-false-positives" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI detection false positives →
              </Link>
              <Link href="/blog/how-ai-detectors-work" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI detectors work →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
