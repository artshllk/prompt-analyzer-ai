import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'Are AI Detectors Accurate? What They Can and Cannot Tell You',
  description: 'AI detectors are useful but not proof. Here is how accurate they really are, when to trust the score, and when a result should not decide anything on its own.',
  alternates: { canonical: 'https://deepclario.com/blog/are-ai-detectors-accurate' },
  openGraph: {
    title: 'Are AI Detectors Accurate? What They Can and Cannot Tell You',
    description: 'AI detectors are useful but not proof. Here is how accurate they really are, and when a result should not decide anything on its own.',
    url: 'https://deepclario.com/blog/are-ai-detectors-accurate',
    type: 'article',
  },
}

const post = getBlogPost('are-ai-detectors-accurate')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Are AI Detectors Accurate? What They Can and Cannot Tell You',
  description: 'How accurate AI detectors are, the cases where they are reliable, and the cases where the score should not be trusted on its own.',
  author: { '@type': 'Person', name: 'Art Shllaku', url: 'https://deepclario.com' },
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
      name: 'are ai detectors accurate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'They are accurate enough to be a useful signal, not proof. On long, untouched AI text they do well. On short passages, edited text, and writing by non-native English speakers, they get much less reliable. A score should never be the only basis for a serious decision.',
      },
    },
    {
      '@type': 'Question',
      name: 'can an ai detector be wrong?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, in both directions. It can flag human writing as AI (a false positive) and miss AI writing that has been edited (a false negative). Both happen often enough that you should treat any single result with care.',
      },
    },
    {
      '@type': 'Question',
      name: 'should i trust an ai detection score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Trust it as a starting point that tells you where to look closer, not as a verdict. Read the writing yourself, consider the context, and never act on the number alone when the stakes are high.',
      },
    },
    {
      '@type': 'Question',
      name: 'does a 99% accurate ai detector mean it is reliable?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not necessarily. Accuracy numbers are usually measured on clean, obvious examples, so real-world accuracy on short, edited, or unusual writing is lower. And even a true 99% means one in a hundred is wrong, which becomes a large number of wrongly flagged people when you run it across thousands of documents. Ask how the number was measured before you trust it.',
      },
    },
    {
      '@type': 'Question',
      name: 'are ai detectors getting more accurate over time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The trend is the other way. Detectors rely on the smooth, even style of AI writing, but models keep getting better at sounding human, which weakens the clue detectors depend on. A tool that looks accurate today can perform worse against newer models, so do not assume accuracy only improves.',
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
    { '@type': 'ListItem', position: 3, name: 'Are AI Detectors Accurate', item: 'https://deepclario.com/blog/are-ai-detectors-accurate' },
  ],
}

export default function AreAIDetectorsAccuratePage() {
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
            Are AI Detectors Accurate?
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            The honest answer is: accurate enough to be useful, not accurate enough to be proof.
            An AI detector gives you a signal worth paying attention to. It does not give you a
            verdict you can act on without thinking. Here is where the line sits.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A score is a probability, not a fact</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                When a detector says &ldquo;92% AI&rdquo;, it is not certain about anything. It is
                saying the writing looks a lot like the smooth, even text that AI models produce. That
                is a guess based on one clue, and guesses can be wrong.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                So the first rule of accuracy is to read the score as &ldquo;this is worth a closer
                look&rdquo;, not &ldquo;this is settled&rdquo;.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Where they are reliable</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Detectors do their best work on long, untouched AI text. A full essay pasted
                straight from a chatbot is smooth all the way through, and that is easy to spot. In
                that case, a high score is usually right.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                They are also useful as a first pass across a big stack of documents, where you only
                want to flag the ones that deserve a human read.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Where accuracy drops fast</h2>
              <div className="grid gap-4">
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[#C25E5E] font-semibold uppercase mb-2">Short text</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)]">A paragraph or two gives the detector too little to measure. Short samples are close to a coin flip.</p>
                </div>
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[#C25E5E] font-semibold uppercase mb-2">Edited text</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)]">A few human edits break the smooth pattern, so AI text that has been touched up often slips through.</p>
                </div>
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[#C25E5E] font-semibold uppercase mb-2">Non-native writing</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)]">Simpler, more even English by non-native writers can look like AI, so this group gets false positives more often.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Two kinds of mistake</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Accuracy is not one number. A detector can be wrong two ways. A false positive
                flags human writing as AI. A false negative misses AI writing. The false positive is
                the one that does real harm, because it can wrongly accuse a person.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                That is why the stakes matter. Using a detector to sort a slush pile is low risk.
                Using it to fail a student is high risk, and the same accuracy that was fine for one
                is not fine for the other.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why &ldquo;99% accurate&rdquo; can still be misleading</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Many detectors advertise a very high accuracy number. It sounds reassuring, but that
                number hides two things you need to know before you trust it.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                First, an accuracy score is usually measured on a neat test set of clean, obvious
                examples, not the messy real-world writing you will actually paste in. On the easy
                cases the tool looks great. On short text, edited text, or unusual writing, the true
                accuracy is much lower than the headline.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Second, even a genuine 99% means one in a hundred is wrong. That feels tiny until you
                run it across a lot of writing. A school checking thousands of essays, or a company
                screening thousands of applications, will produce a real pile of wrong flags, and each
                one is a real person. A high accuracy number and a real fairness problem can live side
                by side.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Accuracy is getting harder, not easier</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                It would be nice if detectors were slowly getting more accurate. The opposite is
                closer to the truth, and it is worth understanding why.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Detectors work by spotting the smooth, even style of AI writing. But AI models keep
                getting better at writing with variety and voice, so they sound more human every year.
                As the machine writing gets less robotic, the clue detectors depend on gets weaker.
                The thing they are trying to measure is fading, which means any tool that looks
                accurate today may look worse against next year&apos;s models. Do not assume accuracy
                only goes up.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How to use a score honestly</h2>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Treat it as a prompt to look closer, not as an answer.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Be more careful the shorter the text is.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Do not trust a headline accuracy number without asking how it was measured.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Never let the score alone decide something serious.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Read the writing yourself before you act.</li>
              </ul>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Check a piece of text</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Paste any text into the Deepclario detector and see the score plus the signals behind it. Free, no account needed.</p>
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
              <Link href="/blog/ai-detector-false-positives" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI detection false positives: why human writing gets flagged →
              </Link>
              <Link href="/blog/ai-detection-score-explained" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI detection score explained →
              </Link>
            </div>
          </div>
          <PostFooter slug="are-ai-detectors-accurate" />
        </main>
      </div>
    </>
  )
}
