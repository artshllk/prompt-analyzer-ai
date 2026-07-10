import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'Deep Rewrite vs Standard Rewrite: Which One Do You Need?',
  description: 'Standard rewrite fixes the obvious problems in a prompt fast. Deep rewrite digs deeper for prompts that really matter. Here is how to tell which one a task actually needs.',
  alternates: { canonical: 'https://deepclario.com/blog/deep-rewrite-vs-standard-rewrite' },
  openGraph: {
    title: 'Deep Rewrite vs Standard Rewrite: Which One Do You Need?',
    description: 'Standard rewrite fixes the obvious problems fast. Deep rewrite digs deeper for prompts that matter. Here is how to tell which one you need.',
    url: 'https://deepclario.com/blog/deep-rewrite-vs-standard-rewrite',
    type: 'article',
  },
}

const post = getBlogPost('deep-rewrite-vs-standard-rewrite')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Deep Rewrite vs Standard Rewrite: Which One Do You Need?',
  description: 'A practical guide to choosing between a quick standard prompt rewrite and a deeper, multi-pass rewrite, based on what the prompt is actually for.',
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
      name: 'when should i use deep rewrite instead of a regular rewrite?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use deep rewrite for prompts you will reuse often, prompts that matter for work or clients, or ones where the first version keeps giving you answers that miss the mark. Use the standard rewrite for everyday, one-off requests where speed matters more than squeezing out every detail.',
      },
    },
    {
      '@type': 'Question',
      name: 'is deep rewrite worth the extra time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For a prompt you will use once, usually not; the standard rewrite gets you 90% of the way in a fraction of the time. For a prompt that becomes a template, feeds into a workflow, or represents your work to someone else, the extra pass is worth it, because a small blind spot repeats every time you reuse it.',
      },
    },
    {
      '@type': 'Question',
      name: 'what is the actual difference between deep rewrite and standard rewrite?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The standard rewrite fixes the obvious gaps in one pass: missing role, unclear goal, no structure. Deep rewrite adds a second pass where the draft is reviewed for the less obvious problems, like contradictory instructions or unstated assumptions, before a final version is returned.',
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
    { '@type': 'ListItem', position: 3, name: 'Deep Rewrite vs Standard Rewrite', item: 'https://deepclario.com/blog/deep-rewrite-vs-standard-rewrite' },
  ],
}

export default function DeepRewriteVsStandardRewritePage() {
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
            <span className="text-xs text-[color:var(--color-paper)] font-semibold uppercase tracking-wider">Product</span>
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 6 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            Deep Rewrite vs Standard Rewrite
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            Once you know Deepclario has two rewrite modes, the obvious question is which one you
            should actually reach for. Not in theory, but for the prompt sitting in front of you
            right now. Here is how to make that call in about five seconds.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Start with what the prompt is for</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The decision has almost nothing to do with how complicated your topic is. It comes
                down to one question: will you use this prompt once, or will you use it again and
                again?
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                A one-off question, a quick email, a random idea you want fleshed out: the standard
                rewrite handles these fine. It catches the obvious problems, a missing role, a vague
                goal, no clear format, and hands you something usable right away. There is no reason
                to slow down for a prompt you will type once and never touch again.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Where the standard rewrite starts to fall short</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The standard rewrite is fast because it only looks once. It fixes what jumps out
                immediately and stops there. That is exactly right for most prompts, and exactly not
                enough for a few.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                If you are building a prompt template your whole team will use, writing something for
                a client, or you have already tried a prompt twice and the answers keep missing the
                same thing, that is a sign the problem is not obvious. It is buried. A contradictory
                instruction, an assumption you never stated, a detail that only matters in edge cases.
                A single pass will not catch that. A second look at the draft will.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What deep rewrite is actually doing differently</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Deep rewrite does not just try harder in some vague sense. It adds a real second step.
                First it writes a draft the way the standard rewrite would. Then it goes back over
                that draft the way a strict editor would, looking specifically for what a first pass
                tends to miss: instructions that quietly contradict each other, missing detail on
                what counts as a good answer, and assumptions that were never actually written down.
                Only after that review does it hand you the final version.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                That is why it costs a little more time. You are paying for a second, more critical
                read, not just a longer prompt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A simple way to decide</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                If you are still unsure, ask yourself one question before you pick a mode: if this
                prompt gives a slightly wrong answer, how much does that cost me?
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                If the cost is low, you just re-ask, use standard. If the cost is high, the prompt
                becomes a template, goes out under your name, or feeds into something else, use deep
                rewrite. The extra time up front is small compared to what a repeated, unnoticed flaw
                would cost you later.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Try both and feel the difference</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Run the same prompt through both modes and compare the results yourself.</p>
            <Link href="/playground" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Try Deepclario →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/what-is-deep-rewrite" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is Deep Rewrite? How the Pro rewrite mode works →
              </Link>
              <Link href="/blog/prompt-score-explained" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Prompt score explained →
              </Link>
              <Link href="/blog/why-prompt-improvement-matters" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Why prompt improvement matters →
              </Link>
            </div>
          </div>
          <PostFooter slug="deep-rewrite-vs-standard-rewrite" />
        </main>
      </div>
    </>
  )
}
