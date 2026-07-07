import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'How to Test a Prompt: A Simple Method',
  description: 'A good prompt is one you have tested, not one you hoped would work. Here is a simple way to test a prompt, spot where it breaks, and fix it before you rely on it.',
  alternates: { canonical: 'https://deepclario.com/blog/how-to-test-a-prompt' },
  openGraph: {
    title: 'How to Test a Prompt: A Simple Method',
    description: 'A good prompt is one you have tested, not one you hoped would work. Here is a simple way to test a prompt and fix where it breaks.',
    url: 'https://deepclario.com/blog/how-to-test-a-prompt',
    type: 'article',
  },
}

const post = getBlogPost('how-to-test-a-prompt')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Test a Prompt: A Simple Method',
  description: 'A practical method for testing an AI prompt: run it more than once, feed it hard inputs, and check the answer against a clear standard.',
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
      name: 'how do i test an ai prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Run the prompt more than once to see if the answers stay consistent, feed it a few hard or messy inputs, and check each answer against a clear standard you set in advance. Where it fails is where you fix the prompt.',
      },
    },
    {
      '@type': 'Question',
      name: 'why does the same prompt give different answers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI models have some randomness built in, so the same prompt can vary. A well-built prompt keeps that variation small and on-target. If your answers swing wildly, the prompt is too loose and needs tighter instructions.',
      },
    },
    {
      '@type': 'Question',
      name: 'how do i know if a prompt is good?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It gives a useful answer across several tries and several inputs, not just the one you happened to test first. If it only works on the easy example, it is not ready.',
      },
    },
    {
      '@type': 'Question',
      name: 'do i need to test every prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Match the effort to the stakes. A one-time question needs no real testing; just fix and re-ask. A prompt you will reuse is worth the three checks. A prompt others rely on, like one that powers a template or a tool, deserves the hardest testing, because a weak prompt fails quietly at scale.',
      },
    },
    {
      '@type': 'Question',
      name: 'how long does it take to test a prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For most prompts, about five minutes. Write down what a good answer must include, run the prompt on three real and varied inputs including a hard one, and check each result against your list. Where it fails is what you fix.',
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
    { '@type': 'ListItem', position: 3, name: 'How to Test a Prompt', item: 'https://deepclario.com/blog/how-to-test-a-prompt' },
  ],
}

export default function HowToTestAPromptPage() {
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
            <span className="text-xs text-[color:var(--color-paper)] font-semibold uppercase tracking-wider">Prompting</span>
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 6 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            How to Test a Prompt
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            Most people write a prompt, get one decent answer, and call it done. Then it fails the
            moment the input changes. A good prompt is one you have tested, not one you hoped would
            work. Here is a simple way to do that.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">One good answer is not proof</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A single good answer can be luck. Models have some randomness, so the same prompt
                can give a great answer once and a weak one the next time. If you are going to reuse
                a prompt, you need to know it holds up, not that it worked once.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Testing a prompt is not complicated. It is three habits: run it again, throw hard
                inputs at it, and judge it against a standard you set first.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The three checks</h2>
              <div className="space-y-4">
                {[
                  { n: '1. Run it more than once', d: 'Send the same prompt three or four times. If the answers stay close and stay useful, the prompt is stable. If they swing all over, it is too loose and needs tighter instructions.' },
                  { n: '2. Feed it hard inputs', d: 'Do not only test the easy case. Try a messy input, a short one, an odd one. A prompt that only works on the neat example will break in real use.' },
                  { n: '3. Judge against a standard', d: 'Before you test, write down what a good answer must have: the right length, the right tone, the facts you need. Then score each answer against that, instead of a vague "feels fine".' },
                ].map(item => (
                  <div key={item.n} className="p-5 rounded-xl border border-[color:var(--color-rule)]">
                    <h3 className="font-bold text-[color:var(--color-paper)] mb-2">{item.n}</h3>
                    <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Change one thing at a time</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                When a test fails, resist the urge to rewrite the whole prompt. Change one part,
                then test again. Maybe you add a format line. Maybe you tighten the constraint. If
                you change five things at once and it improves, you will not know which fix did it.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                One change, one test. It feels slower, but it is how you end up with a prompt you
                actually understand.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Match the effort to the stakes</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Not every prompt deserves a full test. The right amount of testing depends on how many
                times you will use the prompt and how much a bad answer would cost.
              </p>
              <div className="space-y-3">
                {[
                  { t: 'A one-time question', d: 'No real testing needed. If the answer looks off, just fix the prompt and ask again. This is most of what people do.' },
                  { t: 'A prompt you will reuse', d: 'Worth the three checks: run it a few times, try a hard input, and judge against a standard. A few minutes now saves repeated cleanup later.' },
                  { t: 'A prompt others will rely on', d: 'Test it hardest. If it powers a workflow, a template, or a tool, a weak prompt fails quietly at scale. Stress it before you trust it.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What a quick test looks like</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Testing sounds formal, but for most prompts it takes about five minutes. Say you have a
                prompt that turns messy meeting notes into a clean summary.
              </p>
              <div className="p-6 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">
                  Write down what a good summary must have first: three to five bullets, decisions and
                  owners named, no filler. Then run the prompt on three real sets of notes, including a
                  short one and a rambling one. Check each result against your list. If the rambling
                  one drops the decisions, you know exactly what to fix, and you know it before you
                  trusted the prompt on something that mattered.
                </p>
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                That is the whole method: a standard written in advance, a few varied inputs, and an
                honest look at the results.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">When to stop</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Stop when the prompt gives a good answer across several runs and several inputs, not
                just the first one. That is the difference between a prompt that works and a prompt
                that worked once. For anything you will reuse, it is worth the few extra minutes.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Score your prompt before you test it</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario finds the weak parts of a prompt up front, so there is less to fix in testing. Free, no account needed.</p>
            <Link href="/playground" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Analyze my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/how-to-compare-ai-prompts" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to compare two AI prompts →
              </Link>
              <Link href="/blog/how-to-optimize-a-prompt" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to optimize a prompt, step by step →
              </Link>
              <Link href="/blog/why-most-prompts-fail" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Why most AI prompts fail →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
