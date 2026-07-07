import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'How AI Detectors Work: A Clear Guide to Accuracy and Limits',
  description: 'AI detectors guess whether text was written by a machine by measuring how predictable it is. Learn how they work, how accurate they are, and where they fail.',
  alternates: { canonical: 'https://deepclario.com/blog/how-ai-detectors-work' },
  openGraph: {
    title: 'How AI Detectors Work: A Clear Guide to Accuracy and Limits',
    description: 'AI detectors guess whether text was written by a machine by measuring how predictable it is. Here is how that works, and why they still make mistakes.',
    url: 'https://deepclario.com/blog/how-ai-detectors-work',
    type: 'article',
  },
}

const post = getBlogPost('how-ai-detectors-work')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How AI Detectors Work: A Clear Guide to Accuracy and Limits',
  description: 'A plain explanation of how AI text detectors work, what signals they use, and the reasons they produce wrong answers.',
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
      name: 'How do AI detectors work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI detectors measure how predictable a piece of writing is. AI models tend to pick the most likely next word, so their writing is smoother and more even than human writing. A detector scores that smoothness and uses it to guess whether text was machine-written.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are AI detectors accurate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'They are useful as a signal, not as proof. Detectors do well on long, plain AI text, but they get less reliable on short passages, edited text, and writing by non-native English speakers. They should never be the only basis for a serious decision.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why do AI detectors flag human writing?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Because they measure predictability, not authorship. Simple, careful, or formulaic human writing can look just as even as AI writing, so it gets a high AI score. This is called a false positive.',
      },
    },
    {
      '@type': 'Question',
      name: 'How are AI detectors trained?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The makers gather two large piles of writing, one known to be human and one known to be AI, and the detector studies both to learn the patterns that separate them, like smoothness and predictable word choices. Nobody hands it a list of rules; it finds the patterns by comparing thousands of examples. Its blind spots come from whatever was missing or outdated in those piles.',
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
    { '@type': 'ListItem', position: 3, name: 'How AI Detectors Work', item: 'https://deepclario.com/blog/how-ai-detectors-work' },
  ],
}

export default function HowAIDetectorsWorkPage() {
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
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 7 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            How AI Detectors Work
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            An AI detector does not know who wrote your text. It makes a guess based on one main
            clue: how predictable the writing is. Once you understand that clue, you understand
            both what these tools are good at and why they get things wrong.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The one idea behind almost every detector</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                AI models write by guessing the next word, over and over. Most of the time they
                pick the most likely word. That makes their writing smooth and even. It rarely
                surprises you, and it rarely takes a weird turn.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Human writing is bumpier. People pause, change direction, use an odd word, or make
                a strange choice that a model would not. A detector looks for that bumpiness. Smooth,
                even text gets a high AI score. Bumpy, surprising text gets a low one.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The two signals it measures</h2>
              <div className="space-y-4">
                {[
                  { n: 'Predictability', d: 'How well the detector can guess each word from the words before it. If almost every word is easy to guess, the text looks machine-made. Detectors often call this "perplexity", but it just means how surprised the model is.' },
                  { n: 'Variety', d: 'How much the sentence length and rhythm change through the piece. Humans mix long and short sentences without thinking. AI text tends to keep a steadier, more uniform beat. Low variety pushes the AI score up.' },
                ].map(item => (
                  <div key={item.n} className="p-5 rounded-xl border border-[color:var(--color-rule)]">
                    <h3 className="font-bold text-[color:var(--color-paper)] mb-2">{item.n}</h3>
                    <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">{item.d}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                A detector blends these into a single number, usually a percent chance that the text
                is AI-written. That number is a guess, not a verdict.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Where detectors do well</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Detectors are at their best on long, untouched AI text. If someone pastes a full
                essay straight out of a chatbot, the smoothness is easy to spot and the score is
                usually right.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                They also work well as a first filter across a large pile of documents, where you
                just want to flag the ones worth a closer human look.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Where they get it wrong</h2>
              <div className="grid gap-4">
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[#C25E5E] font-semibold uppercase mb-2">Short text</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)]">There is not enough writing to measure. A single paragraph can score almost any way, so short passages are close to a coin flip.</p>
                </div>
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[#C25E5E] font-semibold uppercase mb-2">Edited AI text</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)]">A person who rewrites a few lines of AI output adds enough bumpiness to slip past the detector. Light editing beats most tools.</p>
                </div>
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[#C25E5E] font-semibold uppercase mb-2">Plain human writing</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)]">Careful, simple, or formulaic human writing is also smooth and even. It can score as AI when a real person wrote every word. This is a false positive, and it is the most damaging mistake a detector makes.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How a detector learns what to look for</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A detector does not come with these rules built in by a person. It learns them. The
                process is simpler than it sounds.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The makers gather two big piles of writing. One pile is known to be written by people.
                The other is known to be written by AI. The detector studies both and learns the
                patterns that tend to separate them: the smoothness, the even rhythm, the predictable
                word choices. Nobody hands it a list of tells. It finds them by comparing thousands of
                examples.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                This is also where its weak spots come from. A detector is only as good as the piles
                it learned from. If it never saw much writing from non-native English speakers, it may
                wrongly lump their plain style in with AI. And because it learned from yesterday&apos;s
                AI writing, it can struggle with the newer, more human-sounding models it was never
                trained on. The tool is always looking slightly backward.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How to use a detector without getting burned</h2>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Treat the score as a signal that starts a conversation, not as proof.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Never make a serious decision, like a grade or a job, on the score alone.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Be extra careful with short text and with non-native English writers, who get flagged more often.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Look at the actual writing yourself before you act on any result.</li>
              </ul>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Check a piece of text yourself</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Paste any text into the Deepclario detector and see the AI score, with the signals that drove it. Free, no account needed.</p>
            <Link href="/detector" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Try the AI detector →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/ai-detector-false-positives" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                False positives explained: why human writing gets flagged →
              </Link>
              <Link href="/blog/can-ai-detectors-be-fooled" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Can AI detectors be fooled, and should you trust them →
              </Link>
              <Link href="/blog/are-ai-detectors-accurate" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Are AI detectors accurate? →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
