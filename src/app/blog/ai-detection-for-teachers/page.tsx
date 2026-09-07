import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'
import { CheckCTA } from '@/components/blog/CheckCTA'

const post = getBlogPost('ai-detection-for-teachers')

export const metadata: Metadata = {
  title: 'AI Detection for Teachers: A Fair Way to Use It',
  description: 'AI detectors can help teachers, but they cause harm when used as proof. Here is a fair, practical way to use detection in a classroom without wrongly accusing students.',
  alternates: { canonical: 'https://deepclario.com/blog/ai-detection-for-teachers' },
  openGraph: {
    title: 'AI Detection for Teachers: A Fair Way to Use It',
    description: 'AI detectors can help teachers, but they cause harm when used as proof. Here is a fair, practical way to use detection in a classroom.',
    url: 'https://deepclario.com/blog/ai-detection-for-teachers',
    type: 'article',
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'AI Detection for Teachers: A Fair Way to Use It',
  description: 'A practical, fair approach for teachers using AI detection: what it can do, the false-positive risk to students, and how to handle a flagged paper.',
  image: 'https://deepclario.com/blog/ai-detection-for-teachers/opengraph-image',
  author: { '@type': 'Person', '@id': 'https://deepclario.com/#art', name: 'Art Shllaku', url: 'https://deepclario.com' },
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
      name: 'should teachers use ai detectors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'They can, as one signal among several, but never as proof. A detector can point to work worth a closer look. It should not decide a grade or an accusation on its own, because false positives can wrongly flag honest students.',
      },
    },
    {
      '@type': 'Question',
      name: 'can an ai detector wrongly flag a student?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, and it happens most to non-native English writers and students who write in a plain, structured style. Their natural writing looks even, which detectors mistake for AI. That is why a flag must start a conversation, not a punishment.',
      },
    },
    {
      '@type': 'Question',
      name: 'what should a teacher do about a flagged essay?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Treat the flag as a reason to talk, not a verdict. Ask the student about their process, look at drafts or version history, and consider the whole picture before deciding anything.',
      },
    },
    {
      '@type': 'Question',
      name: 'how do i talk to a student about suspected ai use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Open with curiosity, not accusation. Ask the student to walk you through how they approached the work and talk about the ideas rather than the tool. Do not lead with the detection score. Give them room to show drafts and notes, and be ready to drop it cleanly if their explanation holds up.',
      },
    },
    {
      '@type': 'Question',
      name: 'how can i design assignments that resist ai cheating?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use formats a model cannot easily fake: in-class or timed writing, staged assignments with drafts and checkpoints, prompts tied to a specific class discussion or the student’s own experience, and short oral follow-ups. These reduce your reliance on detection because the work is visible as it grows.',
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
    { '@type': 'ListItem', position: 3, name: 'AI Detection for Teachers', item: 'https://deepclario.com/blog/ai-detection-for-teachers' },
  ],
}

export default function AIDetectionForTeachersPage() {
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
            AI Detection for Teachers
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            An AI detector can be a useful tool in a classroom, or a way to wrongly accuse an honest
            student. The difference is entirely in how you use it. Here is a fair approach that gets
            the benefit without the harm.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What a detector can honestly do</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A detector can flag work that looks smooth and machine-like, which helps you decide
                where to look closer across a stack of papers. That is a real use. It saves time and
                points your attention.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                What it cannot do is prove that a student cheated. A score is a probability based on
                the texture of the writing, not evidence of what happened. Keeping that line clear is
                the whole job.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The student most likely to be wronged</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                False positives are not random. They land hardest on non-native English speakers and
                on students taught to write in a plain, structured way. Their honest writing is even,
                and even writing scores as AI.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                So the students most likely to be flagged by mistake are often the ones with the
                least room to defend themselves. That alone is a reason to never act on a score
                alone.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A fair way to handle a flag</h2>
              <div className="space-y-4">
                {[
                  { n: '1. Treat it as a question', d: 'A flag means "look closer here", not "this student cheated". Start from curiosity, not accusation.' },
                  { n: '2. Talk to the student', d: 'Ask about their process and how they wrote it. An honest student can usually walk you through their work.' },
                  { n: '3. Look for other evidence', d: 'Drafts, notes, and version history tell you far more than a score. Use them before you conclude anything.' },
                  { n: '4. Decide on the whole picture', d: 'Weigh everything together. The detector is one small input, not the deciding vote.' },
                ].map(item => (
                  <div key={item.n} className="p-5 rounded-xl border border-[color:var(--color-rule)]">
                    <h3 className="font-bold text-[color:var(--color-paper)] mb-2">{item.n}</h3>
                    <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How to have the conversation</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The hardest part is not the score, it is the talk that follows. Handled badly, it
                becomes an accusation that damages trust even when you are right, and does real harm
                when you are wrong. Handled well, it is just a genuine question. A few things make it
                go better.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Open with curiosity, not a verdict. &ldquo;Walk me through how you approached this&rdquo; beats &ldquo;this looks like AI.&rdquo;</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Ask about the ideas, not the tool. A student who wrote the essay can explain their own argument and choices.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Do not lead with the score. Naming a percent turns a conversation into a trial before it starts.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Give the student room to show their process, drafts, and notes without feeling cornered.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Be ready to be wrong. If the explanation holds up, drop it cleanly and say so.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The better long game: assignment design</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Detection is a losing race on its own, since edited AI text slips through anyway. The
                stronger move is to design work that is hard to fake in the first place, so you rely on
                a detector less and less. A few formats do most of the work:
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> In-class or timed writing, where the work happens in front of you.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Staged assignments with drafts, outlines, and checkpoints you see along the way.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Prompts tied to a specific class discussion, a local example, or the student&apos;s own experience.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> A short oral follow-up, where a student explains or defends their own work.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Reflection on the process itself, which a model cannot fake convincingly.</li>
              </ul>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                None of these need a detector, because a model cannot easily reproduce a draft that
                visibly grew or a reflection on a class it was not in. A detector can support this kind
                of teaching, but it cannot replace it, and the more you lean on the assignment design,
                the less the flaws of detection can hurt anyone.
              </p>
            </section>
          </article>

          <CheckCTA variant="detector" />

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Check a paper with the signals in view</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">The Deepclario detector shows what drove the score, so you can judge it fairly. Free, no account needed.</p>
            <Link href="/detector" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Try the AI detector →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/ai-detector-false-positives" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI detection false positives →
              </Link>
              <Link href="/blog/ai-detection-in-universities" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                AI detection in universities and schools →
              </Link>
              <Link href="/blog/are-ai-detectors-accurate" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Are AI detectors accurate? →
              </Link>
            </div>
          </div>
          <PostFooter slug="ai-detection-for-teachers" />
        </main>
      </div>
    </>
  )
}
