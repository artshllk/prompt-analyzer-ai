import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'AI Detection in Universities and Schools',
  description: 'How schools and universities use AI detection, where it goes wrong at scale, and what a fair academic-integrity policy looks like when detectors are involved.',
  alternates: { canonical: 'https://deepclario.com/blog/ai-detection-in-universities' },
  openGraph: {
    title: 'AI Detection in Universities and Schools',
    description: 'How schools and universities use AI detection, where it goes wrong at scale, and what a fair academic-integrity policy looks like.',
    url: 'https://deepclario.com/blog/ai-detection-in-universities',
    type: 'article',
  },
}

const post = getBlogPost('ai-detection-in-universities')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'AI Detection in Universities and Schools',
  description: 'How institutions use AI detection, the scale problems and fairness risks, and the elements of a sound academic-integrity policy.',
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
      name: 'how do universities use ai detection?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Many run submitted work through a detector, sometimes built into their plagiarism system, to flag possible AI use. The better ones treat a flag as a prompt for review, not as proof, and pair it with a clear academic-integrity policy.',
      },
    },
    {
      '@type': 'Question',
      name: 'is ai detection reliable enough for academic decisions?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not on its own. False positives and easy evasion mean a score cannot carry a misconduct case by itself. Used as a single input alongside drafts, conversation, and context, it can be part of a fair process.',
      },
    },
    {
      '@type': 'Question',
      name: 'what makes a fair ai policy at a school?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Clear rules on what AI use is allowed, a flag that starts a review rather than a punishment, a chance for the student to explain, staff training on what the score means, and never resting a decision on a detection score alone.',
      },
    },
    {
      '@type': 'Question',
      name: 'what should i do if a detector wrongly flagged my essay?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Stay calm and ask for the specific evidence, not just the score. Show your draft history, notes, and document version history to prove how the work grew over time, offer to talk through your argument, and use the appeals process in writing. A score is a guess, not proof, and false positives are a known problem, especially for non-native English writers.',
      },
    },
    {
      '@type': 'Question',
      name: 'can a university fail a student based on an ai detector alone?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It should not, and a fair policy forbids it. A detection score is a probability based on writing texture, not evidence of misconduct. Responsible institutions treat a flag as a reason to review and talk, and require other evidence before any academic penalty.',
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
    { '@type': 'ListItem', position: 3, name: 'AI Detection in Universities', item: 'https://deepclario.com/blog/ai-detection-in-universities' },
  ],
}

export default function AIDetectionInUniversitiesPage() {
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
            AI Detection in Universities and Schools
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            Detection in a single classroom is one thing. Detection across a whole university,
            wired into the systems that grade thousands of students, is another. The same limits
            apply, but the stakes and the failure modes get much larger. A tool that is merely
            unreliable in one class becomes genuinely unfair at scale. This guide walks through how
            institutions actually use AI detection, what breaks when you run it across a whole
            student body, and what a fair policy looks like, for staff and students both.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How institutions use it</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Many schools now run submitted work through an AI detector, often bundled into the
                plagiarism system they already use. A score comes back, sometimes with sentences
                highlighted, and it feeds into how the work is reviewed.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The detail that matters is where the score sits in the process. In a healthy setup it
                is one input among several, seen by an instructor who knows the student and the
                assignment. In an unhealthy setup it is a number on a dashboard that a busy
                administrator treats as a verdict. Same tool, completely different outcomes, and the
                difference is policy, not technology.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Used well, a detector flags work worth a closer look. Used badly, it becomes an
                automatic accusation applied to thousands of students at once, and that is where the
                harm scales up with it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A worked example: the 1% problem</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                It helps to put numbers on this. Say a detector is 99% accurate, which is far better
                than most really are. That sounds almost perfect. Now run it across a university that
                processes 50,000 pieces of student writing in a term.
              </p>
              <div className="p-6 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper)] leading-relaxed mb-3">
                  A 1% false-positive rate on 50,000 submissions means about
                  <span className="font-semibold"> 500 pieces of genuine human work</span> get
                  flagged as AI. Every one of those is a real student, facing a real accusation,
                  over an essay they actually wrote.
                </p>
                <p className="text-sm text-[color:var(--color-paper-mute)]">
                  And the error is not spread evenly. Non-native English speakers, whose writing is
                  plainer and more even, absorb a larger share of those 500. A tool that looks
                  &ldquo;99% accurate&rdquo; on paper produces hundreds of unfair cases, concentrated
                  on the students least able to fight back.
                </p>
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                This is the trap of scale. An error rate you would shrug off on a single essay becomes
                a systemic fairness problem the moment you apply it to everyone.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What breaks at scale</h2>
              <div className="space-y-3">
                {[
                  { t: 'False positives multiply', d: 'A small error rate sounds fine until it runs across a whole cohort. Even 1% wrong means many real students flagged, and international students are hit most.' },
                  { t: 'The score gets treated as proof', d: 'When a number arrives inside an official system, it feels authoritative. Busy staff can lean on it as evidence it was never meant to be.' },
                  { t: 'Evasion still works', d: 'Students who edit their AI text pass anyway, so the tool mostly catches the careless and the honest, not the determined.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">If you are a student who was wrongly flagged</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                This happens, and it is frightening, so it is worth saying clearly: a detection score
                is not proof, and you are allowed to say so. If your own writing has been flagged as
                AI, here is what actually helps.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Stay calm and ask for the specific evidence, not just the score. A percent is a guess, not a finding.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Show your process. Draft history, notes, browser or document version history, and outlines all demonstrate how the work came together over time.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Offer to talk through the ideas. A student who wrote the work can explain their own argument; that conversation is far stronger evidence than any tool.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Point to the known false-positive problem, especially if English is not your first language. This is documented, not an excuse.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Ask about the appeals process in writing. Most institutions have one, and using it calmly is your right.</li>
              </ul>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                Going forward, keeping your drafts and working in a document with version history is
                the single best protection. It costs nothing and gives you a clear record if a
                question ever comes up.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What a fair institutional policy includes</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A sound approach does not ban detection or trust it blindly. It puts guardrails around
                it so the tool supports human judgment instead of replacing it. The strongest policies
                share these features:
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Clear, per-assignment rules on what AI use is allowed, so students are not guessing.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> A flag that opens a review, never triggers an automatic penalty.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> A real chance for the student to explain their process before any decision.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> A firm rule that no outcome rests on a detection score alone.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Staff training on what the score means, and what it does not, so a number is never mistaken for a verdict.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Extra care with groups known to draw false positives, so the policy does not quietly punish them.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The real fix is assignment design</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The most reliable answer is not a better detector. It is coursework that is hard to
                fake in the first place: work done in stages you can see, writing tied to class
                discussion, oral checks, and tasks that ask for the student&apos;s own experience or
                a specific in-class source.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                These formats do not need a detector, because a model cannot easily produce a
                reflection on a discussion it was not part of, or a draft that visibly grew across
                three checkpoints. Detection can sit beside that work as one small signal. On its own,
                at scale, it does more harm than good, and the more a school leans on it, the less it
                invests in the coursework changes that would actually solve the problem.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">See the signals behind a score</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">The Deepclario detector shows what drove the result, so a person can judge it fairly. Free, no account needed.</p>
            <Link href="/detector" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Try the AI detector →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/ai-detection-for-teachers" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI detection for teachers →
              </Link>
              <Link href="/blog/ai-detector-false-positives" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI detection false positives →
              </Link>
              <Link href="/blog/can-ai-detectors-be-fooled" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Can AI detectors be fooled? →
              </Link>
            </div>
          </div>
          <PostFooter slug="ai-detection-in-universities" />
        </main>
      </div>
    </>
  )
}
