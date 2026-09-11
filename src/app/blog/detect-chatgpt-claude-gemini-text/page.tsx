import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'
import { CheckCTA } from '@/components/blog/CheckCTA'

const post = getBlogPost('detect-chatgpt-claude-gemini-text')

export const metadata: Metadata = {
  title: 'Can You Detect Text from ChatGPT, Claude, and Gemini?',
  description: 'Does the AI model change whether a detector can spot the text? Here is why detection works the same for ChatGPT, Claude, and Gemini, and where each one differs.',
  alternates: { canonical: 'https://deepclario.com/blog/detect-chatgpt-claude-gemini-text' },
  openGraph: {
    title: 'Can You Detect Text from ChatGPT, Claude, and Gemini?',
    description: 'Does the AI model change whether a detector can spot the text? Here is why detection works the same across ChatGPT, Claude, and Gemini.',
    url: 'https://deepclario.com/blog/detect-chatgpt-claude-gemini-text',
    type: 'article',
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Can You Detect Text from ChatGPT, Claude, and Gemini?',
  description: 'Why AI detection does not depend much on which model wrote the text, and how ChatGPT, Claude, and Gemini output compares for a detector.',
  image: 'https://deepclario.com/blog/detect-chatgpt-claude-gemini-text/opengraph-image',
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
      name: 'can ai detectors tell which model wrote the text?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Usually not reliably. Detectors look for the smooth, predictable pattern shared by all these models, not a fingerprint unique to one. So they judge whether text is AI, not whether it came from ChatGPT, Claude, or Gemini.',
      },
    },
    {
      '@type': 'Question',
      name: 'is chatgpt easier to detect than claude or gemini?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not in a strong, consistent way. All three produce even, predictable writing by default, which is what detectors catch. Differences in style are small next to that shared pattern, and editing affects the score far more than which model was used.',
      },
    },
    {
      '@type': 'Question',
      name: 'does the same detector work for all ai models?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, because it measures the general traits of machine writing rather than one model. The same tool applies to ChatGPT, Claude, Gemini, and others, with the same strengths and the same blind spots.',
      },
    },
    {
      '@type': 'Question',
      name: 'how can you tell chatgpt, claude, and gemini writing apart?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Only by soft style habits, and never with confidence. ChatGPT tends to be tidy and list-friendly, Claude tends toward longer flowing sentences and a warmer voice, and Gemini is often brisk and fact-forward. These are tendencies, not fingerprints, and they vanish as soon as the text is edited or the model is asked for a different tone.',
      },
    },
    {
      '@type': 'Question',
      name: 'can a detector prove text came from a specific ai tool?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. There is no reliable fingerprint that survives real use, so any claim that text came from one specific model should be treated with heavy doubt. A detector answers the useful question, which is whether text looks AI-written at all, not which tool produced it.',
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
    { '@type': 'ListItem', position: 3, name: 'Detecting ChatGPT, Claude, and Gemini Text', item: 'https://deepclario.com/blog/detect-chatgpt-claude-gemini-text' },
  ],
}

export default function DetectChatgptClaudeGeminiPage() {
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
            Detecting ChatGPT, Claude, and Gemini
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            People often ask if a detector can tell which model wrote a piece of text, or whether
            one model is easier to catch than another. The short answer is that the model barely
            matters. Detectors look for what all of them share, not what sets them apart.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">They all write the same way, underneath</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                ChatGPT, Claude, and Gemini are built on the same basic idea. Each one writes by
                predicting the most likely next word, over and over. That is what makes their
                default writing smooth and even, and smoothness is exactly what a detector measures.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                So a detector is not really looking for &ldquo;ChatGPT writing&rdquo; or &ldquo;Claude
                writing&rdquo;. It is looking for machine writing in general, which all three
                produce.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The differences are real but small</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The models do have their own habits. One tends to be more formal, another more
                chatty, another fond of lists. A careful reader might notice. But for a detector,
                these style differences are minor next to the shared trait of being even and
                predictable.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Put simply: the gap between any two of these models is much smaller than the gap
                between all of them and a bumpy human draft.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Can a detector name the model?</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Not reliably. Some tools claim to guess the source model, but there is no clean
                fingerprint that survives real use. As soon as text is edited or the model is asked
                for a different style, any small signal fades. Treat &ldquo;this was written by model
                X&rdquo; claims with heavy doubt.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                What a detector can do is answer the useful question: does this look like AI at all?
                Which model is a much harder call, and rarely the one you actually need.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The small style differences you might notice</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A detector does not care about these, but a careful human reader sometimes does. Each
                model has picked up its own habits. None of these are rules, and any of them can be
                changed with a prompt, but here is the rough feel people report.
              </p>
              <div className="space-y-3">
                {[
                  { t: 'ChatGPT', d: 'Often tidy and list-friendly. It likes clear structure, headings, and a helpful, slightly formal tone by default.' },
                  { t: 'Claude', d: 'Tends toward longer, more flowing sentences and a warmer, more explanatory voice. It often "talks through" an answer.' },
                  { t: 'Gemini', d: 'Frequently brisk and fact-forward, and quick to pull in current information when it can.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                Notice that these are style, not fingerprints. The moment someone edits the text or
                asks for a different tone, the habit disappears. That is why even a sharp human guess
                about the source model is shaky, and a detector does not try to make it at all.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why the model barely matters for detection</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Here is the point that ties it together. A detector is not looking for &ldquo;ChatGPT
                writing&rdquo; or &ldquo;Gemini writing.&rdquo; It is looking for the one thing all
                these models share: smooth, predictable text. Their style differences are tiny next to
                that shared trait.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                So the gap between any two of these models is much smaller than the gap between all of
                them and a rough, bumpy human draft. That is why one detector covers every model. It
                is measuring the family resemblance, not the individual face.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What this means in practice</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                You do not need a different detector for each model. One tool covers ChatGPT, Claude,
                Gemini, and whatever comes next, because it measures the shared traits of machine
                writing. And it carries the same limits for all of them: strong on raw text, weak on
                short or edited text, never proof on its own.
              </p>
            </section>
          </article>

          <CheckCTA variant="detector" />

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Check text from any model</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">The Deepclario detector works the same across ChatGPT, Claude, and Gemini. Paste text and see the score. Free, no account needed.</p>
            <Link href="/detector" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Try the AI detector →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/how-ai-detectors-work" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How AI detectors work →
              </Link>
              <Link href="/blog/what-ai-detectors-look-for" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What AI detectors look for →
              </Link>
              <Link href="/blog/can-ai-detectors-be-fooled" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Can AI detectors be fooled? →
              </Link>
            </div>
          </div>
          <PostFooter slug="detect-chatgpt-claude-gemini-text" />
        </main>
      </div>
    </>
  )
}
