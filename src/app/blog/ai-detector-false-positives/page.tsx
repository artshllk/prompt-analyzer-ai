import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'AI Detection False Positives: Why Human Writing Gets Flagged',
  description: 'A false positive is when an AI detector flags human writing as AI. Here is why it happens, who it hits most, and how to avoid acting on a wrong result.',
  alternates: { canonical: 'https://deepclario.com/blog/ai-detector-false-positives' },
  openGraph: {
    title: 'AI Detection False Positives: Why Human Writing Gets Flagged',
    description: 'A false positive is when an AI detector flags human writing as AI. Here is why it happens, who it hits most, and how to avoid acting on it.',
    url: 'https://deepclario.com/blog/ai-detector-false-positives',
    type: 'article',
  },
}

const post = getBlogPost('ai-detector-false-positives')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'AI Detection False Positives: Why Human Writing Gets Flagged',
  description: 'What a false positive is, why AI detectors flag genuine human writing, which writers get hit most, and how to handle a flagged result fairly.',
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
      name: 'what is a false positive in ai detection?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A false positive is when an AI detector marks text that a person actually wrote as AI-generated. It happens because detectors measure how predictable writing is, and some human writing is naturally smooth and even.',
      },
    },
    {
      '@type': 'Question',
      name: 'why did an ai detector flag my own writing?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most likely your writing was clear, simple, and even, which is exactly what detectors read as AI-like. Careful, formal, or formulaic human writing gets flagged more often. A flag is not proof you did anything wrong.',
      },
    },
    {
      '@type': 'Question',
      name: 'who gets false positives most often?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Non-native English writers, students taught to write in a plain structured style, and anyone writing in a formal or templated format. Their natural writing tends to be even, which detectors mistake for machine output.',
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
    { '@type': 'ListItem', position: 3, name: 'AI Detection False Positives', item: 'https://deepclario.com/blog/ai-detector-false-positives' },
  ],
}

export default function AIDetectorFalsePositivesPage() {
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
            AI Detection False Positives
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            A false positive is when a detector flags writing as AI that a real person actually
            wrote. It is the most damaging mistake these tools make, because it can wrongly accuse
            someone. Here is why it happens, and why a flag is never proof on its own.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The cause is baked into how detectors work</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A detector does not know who wrote a text. It measures one thing: how smooth and
                predictable the writing is. AI models write smoothly, so smooth writing scores as
                AI. That works until a human also writes smoothly, which plenty of people do.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                So a false positive is not a bug that will be patched away. It comes from the core
                method. Any tool that judges writing by its evenness will sometimes mistake careful
                human writing for a machine.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Who gets flagged most</h2>
              <div className="space-y-3">
                {[
                  { t: 'Non-native English writers', d: 'People writing in a second language often use simpler, more even sentences. That evenness reads as AI, so this group gets false positives far more than others.' },
                  { t: 'Students taught a strict structure', d: 'Five-paragraph essays and rigid templates produce even, predictable writing on purpose. The structure that earns marks also trips the detector.' },
                  { t: 'Formal and technical writers', d: 'Legal, scientific, and business writing is meant to be plain and consistent. That is exactly the pattern detectors flag.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why this matters so much</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A missed piece of AI text is a small loss. A wrongly accused person is a real harm.
                A student can fail. A writer can lose work. And the accusation is hard to disprove,
                because &ldquo;the detector said so&rdquo; feels like evidence even when it is not.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                The groups most likely to be flagged are often the ones with the least power to push
                back. That is the strongest reason to never treat a score as proof.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What to do with a flagged result</h2>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Treat the flag as a question, not an answer.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Ask the writer about their process before you conclude anything.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Look for other evidence, like drafts or version history.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Never make a serious decision on a single score.</li>
              </ul>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">See the signals, not just a number</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">The Deepclario detector shows what drove the score, so you can judge it instead of trusting it blindly. Free, no account needed.</p>
            <Link href="/detector" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Try the AI detector →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/are-ai-detectors-accurate" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Are AI detectors accurate? →
              </Link>
              <Link href="/blog/human-text-vs-ai-text" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Human text vs AI text: what actually differs →
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
