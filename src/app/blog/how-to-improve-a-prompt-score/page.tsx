import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'How to Improve a Prompt Score (Without Overthinking It)',
  description: 'A low prompt score usually comes down to one or two missing pieces, not a bad idea. Here is how to raise your score fast, with real before-and-after examples.',
  alternates: { canonical: 'https://deepclario.com/blog/how-to-improve-a-prompt-score' },
  openGraph: {
    title: 'How to Improve a Prompt Score (Without Overthinking It)',
    description: 'A low prompt score usually comes down to one or two missing pieces. Here is how to raise your score fast, with real examples.',
    url: 'https://deepclario.com/blog/how-to-improve-a-prompt-score',
    type: 'article',
  },
}

const post = getBlogPost('how-to-improve-a-prompt-score')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Improve a Prompt Score (Without Overthinking It)',
  description: 'Practical steps to raise a low prompt score, focused on the one or two gaps that usually cause it.',
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
      name: 'how do i improve my prompt score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Look at which part is weakest, not the whole prompt. Most low scores come from one gap: a vague goal, missing context, no format, or no limits. Fix that one thing and re-check. Usually just one or two fixes take a prompt from weak to strong.',
      },
    },
    {
      '@type': 'Question',
      name: 'why is my prompt score still low after i added more detail?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'More words do not always mean more clarity. Extra detail that does not touch the goal, context, format, or limits will not move the score. Check that what you added actually answers one of those four questions, not just makes the prompt longer.',
      },
    },
    {
      '@type': 'Question',
      name: 'what is the fastest way to raise a prompt score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Add the audience and the format. Saying who the answer is for and how it should look (length, structure, tone) fixes more low scores than any other single change, because those two things are the ones people forget most often.',
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
    { '@type': 'ListItem', position: 3, name: 'How to Improve a Prompt Score', item: 'https://deepclario.com/blog/how-to-improve-a-prompt-score' },
  ],
}

export default function HowToImproveAPromptScorePage() {
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
            How to Improve a Prompt Score
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            You paste a prompt in, and it comes back scoring 40 out of 100. Your first instinct might
            be to rewrite the whole thing. Don&apos;t. A low score almost never means your prompt is
            bad from top to bottom. It usually means one or two things are missing, and once you spot
            them, the fix takes thirty seconds.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Stop rewriting. Start diagnosing.</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                When people see a low score, the natural reaction is to scrap the prompt and start
                over. That wastes time. A score is not saying your prompt is wrong. It is saying the
                model would have to guess at a few things you never mentioned.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                So before you touch a word, read the prompt back and ask four questions. Is the goal
                actually clear, or just clear to you? Did you say who this is for? Did you say what the
                answer should look like? Did you say anything to avoid? Whichever question you can&apos;t
                answer is almost always where your points went.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The two fixes that do the most work</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Out of everything that goes into a score, two things move the needle more than the
                rest combined: telling the model who the answer is for, and telling it what shape you
                want back.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                People skip both constantly, because in their own head the audience and the format are
                obvious. They are not obvious to a model reading a bare sentence. Add &ldquo;for a
                first-time customer who has never used software like this&rdquo; and you have handed
                over context worth a dozen points. Add &ldquo;three short paragraphs, no bullet
                points&rdquo; and you have removed a whole category of guesswork.
              </p>
              <div className="grid gap-4">
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[#C25E5E] font-semibold uppercase mb-2">Before</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)] italic">&ldquo;Explain how our return policy works.&rdquo;</p>
                </div>
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[color:var(--color-paper)] font-semibold uppercase mb-2">After</p>
                  <p className="text-sm text-[color:var(--color-paper)]">&ldquo;Explain our return policy to a customer who wants to send an item back. Keep it to two short paragraphs, plain language, no legal terms.&rdquo;</p>
                </div>
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                Nothing here is clever. It is just filling in what was missing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">More words are not the goal</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A mistake people make once they know the score cares about detail: they add detail that
                has nothing to do with what the model actually needs. A longer prompt with the same
                gaps scores about the same as the short one did.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                If you added three sentences and the score barely moved, check whether those sentences
                touched the goal, the audience, the format, or the limits. If they didn&apos;t, that is
                why nothing changed. Padding a prompt with backstory the model doesn&apos;t need is not
                the same as closing a real gap.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">When a low score is actually fine</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Not every prompt needs to hit 90. If you just want a quick idea, a rough draft, or a
                one-line answer, a shorter prompt with a lower score can still get you exactly what you
                wanted in less time than it takes to write a perfect version. Chase a high score when
                the answer actually matters and you plan to use it as-is. For a throwaway question, let
                it go.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Make it a habit, not a one-time fix</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                The real win isn&apos;t raising the score on one prompt. It&apos;s noticing your own
                pattern. Most people are weak on the same one or two parts every time, usually context
                or limits. Once you know your habit, you start writing it into the prompt automatically,
                and you stop needing the score to catch it for you.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Find your weak spot in seconds</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario finds the part of your prompt that is holding it back, then rewrites it. Free, no account needed.</p>
            <Link href="/playground" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Improve my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/prompt-score-explained" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Prompt score explained →
              </Link>
              <Link href="/blog/prompt-quality-checklist" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Prompt quality checklist →
              </Link>
              <Link href="/blog/why-most-prompts-fail" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Why most AI prompts fail →
              </Link>
            </div>
          </div>
          <PostFooter slug="how-to-improve-a-prompt-score" />
        </main>
      </div>
    </>
  )
}
