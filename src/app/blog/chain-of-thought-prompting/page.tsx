import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'Chain-of-Thought Prompting Explained (With Examples)',
  description: 'Chain-of-thought prompting asks the AI to reason step by step before answering. Here is what it is, when it helps, and how to use it, with clear examples.',
  alternates: { canonical: 'https://deepclario.com/blog/chain-of-thought-prompting' },
  openGraph: {
    title: 'Chain-of-Thought Prompting Explained (With Examples)',
    description: 'Chain-of-thought prompting asks the AI to reason step by step before answering. Here is what it is, when it helps, and how to use it.',
    url: 'https://deepclario.com/blog/chain-of-thought-prompting',
    type: 'article',
  },
}

const post = getBlogPost('chain-of-thought-prompting')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Chain-of-Thought Prompting Explained (With Examples)',
  description: 'What chain-of-thought prompting is, why asking the model to reason step by step improves hard answers, and when to use it.',
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
      name: 'what is chain-of-thought prompting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Chain-of-thought prompting asks the AI to work through a problem step by step before giving the final answer. Adding a line like "think step by step" makes the model show its reasoning, which raises accuracy on math, logic, and multi-step questions.',
      },
    },
    {
      '@type': 'Question',
      name: 'when should i use chain-of-thought prompting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use it for problems with more than one step: math, logic puzzles, planning, and questions where the model needs to compare options. For simple lookups or short answers it adds length without helping.',
      },
    },
    {
      '@type': 'Question',
      name: 'does chain-of-thought prompting really improve answers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, on multi-step problems. Making the model lay out its steps reduces skipped logic and careless mistakes. On easy questions it makes no real difference and just adds text.',
      },
    },
    {
      '@type': 'Question',
      name: 'what is a good chain-of-thought prompt to copy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A simple one is "Think step by step, then give your final answer." For a clean result, add "then give only the final answer on its own line." For a decision, try "List the options, weigh the pros and cons of each, then recommend one and say why." Any line that tells the model to reason before answering works.',
      },
    },
    {
      '@type': 'Question',
      name: 'can chain-of-thought reasoning still be wrong?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Reasoning that looks tidy can still reach a wrong answer. Chain-of-thought reduces careless mistakes on multi-step problems, but it is not a guarantee. Read the steps and check them; do not trust them just because they look organized.',
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
    { '@type': 'ListItem', position: 3, name: 'Chain-of-Thought Prompting', item: 'https://deepclario.com/blog/chain-of-thought-prompting' },
  ],
}

export default function ChainOfThoughtPromptingPage() {
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
            Chain-of-Thought Prompting Explained
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            Chain-of-thought prompting is a small change with a big effect. Instead of asking the
            AI for the answer, you ask it to work through the problem step by step first. On hard
            questions, that one habit turns wrong answers into right ones.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What it actually means</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                When you ask a model a hard question and it just blurts the answer, it often skips
                steps. It jumps to a guess that sounds right but is not. Chain-of-thought prompting
                fixes this by telling the model to slow down and show its work.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                In practice it is one added line, usually something like &ldquo;think step by
                step&rdquo; or &ldquo;work through this before you answer&rdquo;. That prompt makes
                the model reason out loud, and reasoning out loud is where it catches its own
                mistakes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The same question, two ways</h2>
              <div className="grid gap-4">
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[#C25E5E] font-semibold uppercase mb-2">Without chain-of-thought</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)] italic mb-2">&ldquo;A shirt costs $40. It is 25% off, then another $5 coupon. What do I pay?&rdquo;</p>
                  <p className="text-xs text-[color:var(--color-paper-mute)]">The model may rush and apply the coupon first, or drop a step, and land on the wrong number.</p>
                </div>
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[color:var(--color-paper)] font-semibold uppercase mb-2">With chain-of-thought</p>
                  <p className="text-sm text-[color:var(--color-paper)] mb-2">&ldquo;A shirt costs $40. It is 25% off, then another $5 coupon. Work through it step by step, then give the final price.&rdquo;</p>
                  <p className="text-xs text-[color:var(--color-paper-mute)]">Now it shows: $40 minus 25% is $30, minus the $5 coupon is $25. The steps make the right answer hard to miss.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">When it helps, and when it does not</h2>
              <div className="space-y-3">
                {[
                  { t: 'Great for', d: 'Math, logic, planning, comparing options, anything with two or more steps. These are where skipped reasoning causes wrong answers.' },
                  { t: 'Pointless for', d: 'Simple lookups, short facts, or quick rewrites. Asking the model to "think step by step" about a one-line answer just makes it longer.' },
                  { t: 'A middle case', d: 'For a final answer you want clean, ask it to reason first, then give only the result. You get the accuracy without the wall of working.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why showing the steps works</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A model builds its answer one piece at a time, each piece based on what came before.
                When it writes the reasoning out, each step becomes something the next step can lean
                on. The answer is built on a visible chain instead of a single guess.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                There is a second benefit for you. When the steps are on the page, you can spot
                where the logic went wrong. A hidden answer you can only accept or reject. A
                reasoned one you can check and correct.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Phrases you can copy</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                You do not need special wording. Any line that tells the model to slow down and reason
                first will do. Here are a few that work well, depending on what you want.
              </p>
              <div className="space-y-3">
                {[
                  { t: 'Simple and general', d: '"Think step by step, then give your final answer."' },
                  { t: 'When you want a clean result', d: '"Work through this carefully, then give only the final answer on its own line."' },
                  { t: 'For a decision', d: '"List the options, weigh the pros and cons of each, then recommend one and say why."' },
                  { t: 'For checking work', d: '"Solve it, then check your own answer a second way and tell me if the two match."' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Two ways to do it</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                There are two flavors of chain-of-thought, and it is useful to know the difference.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The first is just asking. You add &ldquo;think step by step&rdquo; and let the model
                reason on its own. This is the easy, everyday version, and it is usually enough.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                The second is showing an example. You include one worked problem, with the reasoning
                written out, before your real question. The model copies that style of thinking. This
                takes more effort, but it helps when the problem has a specific method you want
                followed. If you want to go deeper on this, it is the same idea as few-shot prompting.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Common mistakes</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Chain-of-thought is simple, but a few habits waste its value.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Using it on everything. On a simple lookup it just adds length and slows you down.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Trusting the steps blindly. Reasoning that looks tidy can still reach a wrong answer. Read it, do not just admire it.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Forgetting to ask for the final answer. Without it, you get a wall of working and no clear result.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Burying the request. Put the &ldquo;think step by step&rdquo; instruction near the task, not lost in a long paragraph.</li>
              </ul>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Want the model to reason better?</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Paste your prompt into Deepclario. It scores the structure and rewrites it so the model has what it needs. Free, no account needed.</p>
            <Link href="/prompt-improver" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Analyze my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/zero-shot-vs-few-shot-prompting" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Zero-shot vs few-shot prompting →
              </Link>
              <Link href="/blog/how-to-write-better-prompts" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to write better prompts: 7 proven techniques →
              </Link>
              <Link href="/blog/why-most-prompts-fail" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Why most AI prompts fail →
              </Link>
            </div>
          </div>
          <PostFooter slug="chain-of-thought-prompting" />
        </main>
      </div>
    </>
  )
}
