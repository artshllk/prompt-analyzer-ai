import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'
import { CheckCTA } from '@/components/blog/CheckCTA'

const post = getBlogPost('ai-detection-score-explained')

export const metadata: Metadata = {
  title: 'AI Detection Score Explained: What the Percentage Means',
  description: 'What does a "78% AI" score actually mean? Here is how to read an AI detection score, what the number does and does not tell you, and how to act on it.',
  alternates: { canonical: 'https://deepclario.com/blog/ai-detection-score-explained' },
  openGraph: {
    title: 'AI Detection Score Explained: What the Percentage Means',
    description: 'What does a "78% AI" score actually mean? Here is how to read an AI detection score and what the number does and does not tell you.',
    url: 'https://deepclario.com/blog/ai-detection-score-explained',
    type: 'article',
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'AI Detection Score Explained: What the Percentage Means',
  description: 'How to read an AI detection score, what the percentage represents, and why it is a confidence estimate rather than a share of the text.',
  image: 'https://deepclario.com/blog/ai-detection-score-explained/opengraph-image',
  author: { '@type': 'Organization', '@id': 'https://deepclario.com/#organization', name: 'Deepclario', url: 'https://deepclario.com' },
  publisher: { '@id': 'https://deepclario.com/#organization' },
  datePublished: post.datePublished,
  dateModified: post.dateModified,
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'what does an ai detection score mean?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It is the tool’s confidence that the text is AI-written, not the share of the text that is AI. A score of 80% means the detector is fairly confident the writing is machine-made, based on how smooth and predictable it looks.',
      },
    },
    {
      '@type': 'Question',
      name: 'does 90% ai mean 90% of the text is ai?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. It means the detector is 90% confident the text is AI-generated overall. It is a measure of certainty, not a portion of the words. Some tools also show a sentence-level view, which is a different thing.',
      },
    },
    {
      '@type': 'Question',
      name: 'what is a good ai detection score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For your own human writing, a low score is reassuring but a high one is not proof of anything. Treat scores in the middle as uncertain, and remember that short text produces unreliable numbers in either direction.',
      },
    },
    {
      '@type': 'Question',
      name: 'why do two ai detectors give different scores?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each detector was trained on different writing and tuned to weigh the signals differently, so they draw the AI-versus-human line in different places. They are all estimating the same hidden thing from the same surface clues. When two tools disagree sharply, the honest reading is that the text is genuinely uncertain, not that one tool is right.',
      },
    },
    {
      '@type': 'Question',
      name: 'does a high ai score mean i will get caught?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. A high score is a probability, not evidence, and a careful reviewer knows that. It also swings with text length and small edits. A high number is a reason for a closer look, not a verdict, and it should never decide a serious outcome on its own.',
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
    { '@type': 'ListItem', position: 3, name: 'AI Detection Score Explained', item: 'https://deepclario.com/blog/ai-detection-score-explained' },
  ],
}

export default function AIDetectionScoreExplainedPage() {
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
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 5 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            AI Detection Score Explained
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            You paste some text, and the detector says &ldquo;78% AI&rdquo;. Most people read that
            wrong. It does not mean 78% of the text is AI. It means something more specific, and
            knowing the difference changes how much you should trust it.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The score is confidence, not a portion</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                An overall score like 78% is the detector&apos;s confidence that the whole text is
                AI-written. It is answering &ldquo;how sure am I?&rdquo;, not &ldquo;how much of this
                is AI?&rdquo;. Those sound similar but they are not the same thing.
              </p>
              <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper)] mb-1"><span className="font-semibold">What people think 78% means:</span> 78% of the words are AI.</p>
                <p className="text-sm text-[color:var(--color-paper)]"><span className="font-semibold">What it actually means:</span> the tool is 78% confident the text is AI-written.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How to read the range</h2>
              <div className="space-y-3">
                {[
                  { t: 'High (roughly 80% and up)', d: 'The detector is fairly confident it sees AI. On long, untouched text this is often right. On short or edited text, still treat it with care.' },
                  { t: 'Middle (around 40 to 70%)', d: 'This is the tool saying it is not sure. A middle score is the least useful result, and the easiest to misread as a firm answer.' },
                  { t: 'Low (roughly 20% and under)', d: 'The detector sees the bumpiness of human writing. Reassuring, but a low score is not a certificate either.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why the length of the text matters</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                A score on two sentences is close to a guess. There is not enough writing to measure
                the patterns the detector relies on. The same tool on a full page is far more
                stable. So always read a score together with how much text produced it. A confident
                number on a tiny sample is not confident at all.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Sentence-level scores are different</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Some tools also highlight individual sentences as more or less AI-like. That is a
                separate view from the overall confidence score, and it is useful for seeing which
                parts look smooth. But it carries the same warning: a highlighted sentence is a hint
                to look closer, not a finding. A single flagged sentence in an otherwise human essay
                usually means nothing, since one smooth line is a coincidence, not a pattern.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why two detectors give different scores</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Paste the same text into two AI detectors and you will often get two different
                numbers. One says 30% AI, the other says 80%. People find this alarming, but it makes
                sense once you know what a score is.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Each detector was trained on a different pile of writing and tuned to weigh the
                signals differently. They are all guessing at the same hidden thing from the same
                surface clues, but they draw the line in different places. The disagreement is not a
                bug you can fix by finding the &ldquo;real&rdquo; detector. It is a reminder that every
                one of these numbers is an estimate. When two tools disagree sharply, the honest
                reading is &ldquo;this text is genuinely uncertain,&rdquo; not &ldquo;one of them is
                right.&rdquo;
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What to actually do at each score</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Reading a score is only useful if it changes what you do. Here is a sensible response
                to each range, whether you are checking your own writing or someone else&apos;s.
              </p>
              <div className="space-y-3">
                {[
                  { t: 'High score on long text', d: 'Worth a closer look, but still not proof. Read the writing yourself and, if it matters, ask about the process. Never act on the number alone.' },
                  { t: 'Middle score', d: 'The least useful result. Treat it as "no clear answer" rather than a lean either way. Do not build any decision on a middle score.' },
                  { t: 'Low score', d: 'Mildly reassuring, nothing more. A low score does not certify that a human wrote it, since edited AI text scores low too.' },
                  { t: 'Any score on short text', d: 'Ignore the confidence. A couple of sentences cannot produce a reliable number in either direction.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>
          </article>

          <CheckCTA variant="detector" />

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Get a score you can actually read</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">The Deepclario detector shows the score and the signals behind it, so the number means something. Free, no account needed.</p>
            <Link href="/detector" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Try the AI detector →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/are-ai-detectors-accurate" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Are AI detectors accurate? →
              </Link>
              <Link href="/blog/what-ai-detectors-look-for" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What AI detectors look for →
              </Link>
              <Link href="/blog/how-ai-detectors-work" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI detectors work →
              </Link>
            </div>
          </div>
          <PostFooter slug="ai-detection-score-explained" />
        </main>
      </div>
    </>
  )
}
