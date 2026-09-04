import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'Prompt Analyzer Guide: How to Use It Well',
  description: 'A walkthrough of the Deepclario prompt analyzer: what it checks, how to read the results, and how to use it so your prompts actually get better over time.',
  alternates: { canonical: 'https://deepclario.com/blog/prompt-analyzer-guide' },
  openGraph: {
    title: 'Prompt Analyzer Guide: How to Use It Well',
    description: 'A walkthrough of the Deepclario prompt analyzer: what it checks, how to read the results, and how to get the most out of it.',
    url: 'https://deepclario.com/blog/prompt-analyzer-guide',
    type: 'article',
  },
}

const post = getBlogPost('prompt-analyzer-guide')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Prompt Analyzer Guide: How to Use It Well',
  description: 'How to use a prompt analyzer effectively, what it checks for, and how to read the results to write better prompts.',
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
      name: 'what does a prompt analyzer do?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A prompt analyzer reads your prompt and checks it against the things that make AI answers better: a clear goal, context, format, and limits. It gives you a score and points out which parts are missing, so you know exactly what to fix.',
      },
    },
    {
      '@type': 'Question',
      name: 'how do i use a prompt analyzer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Paste in the prompt you were about to send, look at the score and the notes on each part, fix the weakest one, and re-check if you want. Most people get value from just reading which part is flagged, without needing to run it more than once or twice.',
      },
    },
    {
      '@type': 'Question',
      name: 'should i analyze every prompt i write?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No, save it for prompts that matter: something you will reuse, something going to a client or your team, or anything where a bad answer wastes real time. For a quick throwaway question, just ask it.',
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
    { '@type': 'ListItem', position: 3, name: 'Prompt Analyzer Guide', item: 'https://deepclario.com/blog/prompt-analyzer-guide' },
  ],
}

export default function PromptAnalyzerGuidePage() {
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
            Prompt Analyzer Guide
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            Most people try a prompt analyzer once, glance at the score, and never think about it
            again. That is a shame, because used properly it is one of the fastest ways to get better
            at writing prompts, not just fix the one in front of you. Here is how to actually get
            something out of it.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What it is checking</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A prompt analyzer is not reading your prompt for grammar or style. It is checking
                whether the AI would have everything it needs to give you a strong answer. That comes
                down to a handful of things: is the goal clear, did you explain who the answer is for,
                did you say what shape you want it in, and did you set any limits on what to avoid.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Each of those gets checked on its own, which is why a good analyzer gives you more than
                just a number. It tells you which part is thin, so you are not left guessing what to
                fix.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The three-step way to use it</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                There is a right way to use this tool and a way that wastes your time. The wasteful way
                is pasting in a prompt, seeing a low number, and rewriting the whole thing from
                scratch. The useful way is smaller and faster.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Paste in the prompt you were about to send anyway, not a test one. Read which single
                part got flagged as weakest. Fix just that part and move on. You do not need to chase a
                perfect score, and you do not need to run it five times on the same prompt. One honest
                look is usually enough to catch the thing you missed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Reading the rewrite it suggests</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Alongside the score, you usually get a rewritten version of your prompt. Do not just
                copy it blindly. Read it and notice what changed compared to what you wrote. That
                difference is the lesson. If it added a line about the audience, that tells you
                audience is something you tend to skip. If it tightened the format, that is your
                pattern too.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                After a few uses, most people stop needing the tool for that particular gap, because
                they start writing it in from the start. That is the real payoff, not the one-time
                fix.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">When it is worth the extra minute</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                You do not need to analyze a quick question you are typing just to get an idea. Save it
                for prompts that carry some weight: something you will send to a client, reuse across a
                project, or hand to your team as a template. In those cases, a weak prompt does not
                just waste your own time, it wastes everyone downstream who relies on the answer being
                right the first time.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Try the analyzer on a real prompt</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Paste in something you are about to send. See the score, the weak spot, and the rewrite. Free, no account needed.</p>
            <Link href="/prompt-improver" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Improve my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/prompt-score-explained" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Prompt score explained →
              </Link>
              <Link href="/blog/how-to-improve-a-prompt-score" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to improve a prompt score →
              </Link>
              <Link href="/blog/why-prompt-improvement-matters" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Why prompt improvement matters →
              </Link>
            </div>
          </div>
          <PostFooter slug="prompt-analyzer-guide" />
        </main>
      </div>
    </>
  )
}
