import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'AI Detection for Recruiters and Hiring',
  description: 'AI-written cover letters and applications are everywhere. Here is how recruiters can use AI detection fairly, what it misses, and why it should never auto-reject.',
  alternates: { canonical: 'https://deepclario.com/blog/ai-detection-for-recruiters' },
  openGraph: {
    title: 'AI Detection for Recruiters and Hiring',
    description: 'AI-written cover letters are everywhere. Here is how recruiters can use AI detection fairly, and why it should never auto-reject.',
    url: 'https://deepclario.com/blog/ai-detection-for-recruiters',
    type: 'article',
  },
}

const post = getBlogPost('ai-detection-for-recruiters')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'AI Detection for Recruiters and Hiring',
  description: 'How recruiters can use AI detection on applications fairly, the false-positive risk to candidates, and why a score should never trigger an automatic rejection.',
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
      name: 'should recruiters use ai detectors on applications?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Only as a soft signal, never as an auto-reject. A detector can flag a cover letter that looks machine-written, but many strong candidates use AI to polish honest applications, and false positives can drop good people unfairly.',
      },
    },
    {
      '@type': 'Question',
      name: 'is using ai to write a cover letter a red flag?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not on its own. Using AI to draft or polish is now normal and often sensible. What matters is whether the candidate can do the job, not whether a tool touched their cover letter. Judge the substance, not the texture.',
      },
    },
    {
      '@type': 'Question',
      name: 'can ai detection wrongly reject a candidate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, if a score triggers rejection. False positives hit non-native English speakers hardest, so an auto-reject rule can quietly screen out qualified international applicants. Keep a human in the loop.',
      },
    },
    {
      '@type': 'Question',
      name: 'is auto-rejecting candidates by ai score legal?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It is risky. Employment law in many places judges hiring filters by their effect, not just intent. Because AI detectors flag plain, even writing, an auto-reject rule can reject non-native English speakers at a higher rate, which can amount to unlawful disparate impact even though the rule never mentions language. Consult your own legal guidance and keep a human decision-maker in the process.',
      },
    },
    {
      '@type': 'Question',
      name: 'how should recruiters handle ai-written applications?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Judge the substance, not the texture. Look at experience, skills, and fit, and test real ability with a task or interview. Treat a detection score as a small note of context at most, never a gate. Using AI to polish an application is usually a sign of practical judgment, not dishonesty.',
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
    { '@type': 'ListItem', position: 3, name: 'AI Detection for Recruiters', item: 'https://deepclario.com/blog/ai-detection-for-recruiters' },
  ],
}

export default function AIDetectionForRecruitersPage() {
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
            AI Detection for Recruiters and Hiring
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            Cover letters and applications written with AI are now common. That tempts recruiters to
            run a detector and filter them out. It is the same idea as detection in a classroom, in
            a different setting, and it carries the same risk of getting good people wrong, plus a
            few risks that are specific to hiring. This guide covers what a detector can and cannot
            tell you about a candidate, the legal exposure an auto-reject rule creates, and the few
            places detection actually earns its keep in a hiring process.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The question worth asking first</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Before you detect anything, ask what you actually care about. It is almost never
                &ldquo;did a tool touch this cover letter&rdquo;. It is &ldquo;can this person do the
                job&rdquo;. Those are different questions, and a detector only pretends to answer the
                first.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Plenty of excellent candidates use AI to fix grammar or tighten a draft. That is not
                dishonesty, it is using a normal tool. Penalizing it filters for people who did not
                bother, not for the best hires.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Who an auto-reject quietly screens out</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                If a high AI score triggers automatic rejection, you have built a filter with a bias
                in it. False positives fall hardest on non-native English speakers, whose plain,
                even writing reads as machine-made.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                So an auto-reject rule can silently drop qualified international candidates while
                looking neutral. That is a legal and ethical problem, not just a quality one.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The legal risk hiring managers miss</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                This is the part that turns a quality problem into a liability. In most places,
                employment law does not care whether you meant to discriminate. It cares about the
                effect. If a hiring filter rejects one protected group at a higher rate than others,
                that can be unlawful even if the rule looks perfectly neutral on paper. Lawyers call
                this disparate impact.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                An AI-detector auto-reject is a textbook example. It flags plain, even writing, which
                is exactly what many non-native English speakers produce. The rule never mentions
                nationality or first language, yet it can screen those candidates out at a higher
                rate. You would be building a bias into your pipeline and keeping no good record of
                why anyone was rejected, since &ldquo;the detector said so&rdquo; is not a defensible
                reason.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Even setting fairness aside, that is a bad position to be in. A candidate who asks why
                they were rejected deserves a real answer, and &ldquo;a tool guessed your cover letter
                was too smooth&rdquo; is not one.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Using AI to apply is not a red flag</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                It is worth challenging the assumption underneath all of this. Why would you penalize a
                candidate for using AI to write a cleaner cover letter? In most modern jobs, using the
                available tools well is a skill, not a failing. A candidate who used a model to tighten
                their application and fix their grammar showed exactly the kind of practical judgment
                you probably want.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                The thing you are hiring for is almost never &ldquo;wrote this cover letter unassisted.&rdquo;
                It is whether they can do the work. A detector answers the wrong question, and then
                answers it badly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A saner way to use it</h2>
              <div className="space-y-3">
                {[
                  { t: 'Signal, not gate', d: 'Let a score add a small note of context, not decide the outcome. It never rejects on its own.' },
                  { t: 'Judge the substance', d: 'Look at experience, skills, and fit. A polished cover letter is not the thing you are hiring.' },
                  { t: 'Test what matters', d: 'If you want to know how someone works, use a real task or interview, not the texture of their writing.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Where detection does earn its place</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                There is a fair use: a written test given as part of the process, where you have told
                candidates the work should be their own. There, a smooth, machine-like answer is
                worth a second look. Even then it starts a conversation, it does not end one.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Use detection as a signal, not a verdict</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">The Deepclario detector shows the signals behind the score, so a human can judge it. Free, no account needed.</p>
            <Link href="/detector" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Try the AI detector →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/ai-detector-false-positives" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI detection false positives →
              </Link>
              <Link href="/blog/are-ai-detectors-accurate" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Are AI detectors accurate? →
              </Link>
              <Link href="/blog/ai-detection-for-teachers" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI detection for teachers →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
