import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

const post = getBlogPost('how-to-improve-a-prompt-score')

export const metadata: Metadata = {
  title: 'How to Improve a Weak Prompt (Instead of Chasing a Prompt Score)',
  description: 'A weak prompt is usually missing one or two specific things. A prompt score will not tell you which one. Here is how to find it, with before-and-after examples.',
  alternates: { canonical: 'https://deepclario.com/blog/how-to-improve-a-prompt-score' },
  openGraph: {
    title: 'How to Improve a Weak Prompt (Instead of Chasing a Prompt Score)',
    description: 'A weak prompt is usually missing one or two specific things. Here is how to find which one, with real before-and-after examples.',
    url: 'https://deepclario.com/blog/how-to-improve-a-prompt-score',
    type: 'article',
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Improve a Weak Prompt (Instead of Chasing a Prompt Score)',
  description: 'How to find the one or two gaps that make a prompt weak, instead of chasing a number.',
  image: 'https://deepclario.com/blog/how-to-improve-a-prompt-score/opengraph-image',
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
      name: 'how do i improve my prompt score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Do not start from the number. Read the prompt back and ask four questions: is the goal clear, did you give the background the model cannot see, did you say what the answer should look like, and did you say what to avoid. Fix the one that is missing. That is the change that moves the answer, whatever any score says.',
      },
    },
    {
      '@type': 'Question',
      name: 'why is my prompt score still low after i added more detail?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'More words do not always mean more clarity. Detail that does not touch the goal, the background, the format or the limits will not change the answer. Check that what you added answers one of those four questions instead of just making the prompt longer.',
      },
    },
    {
      '@type': 'Question',
      name: 'what is the fastest way to raise a prompt score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Say who the answer is for and what it should look like. Those two fix more weak prompts than any other single change, because in your own head the audience and the format are obvious, so they are the parts people leave out most.',
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
    { '@type': 'ListItem', position: 3, name: 'How to Improve a Weak Prompt', item: 'https://deepclario.com/blog/how-to-improve-a-prompt-score' },
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
            How to Improve a Weak Prompt
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            You paste a prompt in and get back something generic. Your first instinct is to rewrite
            the whole thing. Do not. A weak prompt is rarely bad from top to bottom. Usually one or
            two things are missing, and once you spot them the fix takes thirty seconds.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Stop rewriting. Start diagnosing.</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                When the answer comes back wrong, the natural reaction is to scrap the prompt and
                start over. That wastes time. The prompt is rarely wrong. It just left the model
                guessing at a few things you never mentioned.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                So before you touch a word, read the prompt back and ask four questions. Is the goal
                actually clear, or just clear to you? Did you say who this is for? Did you say what the
                answer should look like? Did you say anything to avoid? Whichever question you can&apos;t
                answer is almost always the thing that is missing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The two fixes that do the most work</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Two things do more than everything else combined. Tell the model who the answer is
                for. Tell it what shape you want back.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                People skip both constantly, because in their own head the audience and the format are
                obvious. They are not obvious to a model reading a bare sentence. Add &ldquo;for a
                first-time customer who has never used software like this&rdquo; and you have handed
                over the context it was missing. Add &ldquo;three short paragraphs, no bullet
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
                Once people know detail helps, they add detail that has nothing to do with what the
                model needs. A longer prompt with the same gaps produces the same answer the short
                one did.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                If you added three sentences and the answer barely changed, check whether those
                sentences touched the goal, the audience, the format, or the limits. If they did not,
                that is why. Backstory the model does not need is not the same as closing a gap.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">When a rough prompt is fine</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Not every prompt needs work. If you want a quick idea or a one-line answer, a short
                prompt gets you there faster than writing a careful one. Spend the effort when the
                answer matters and you plan to use it as it comes back. For a throwaway question,
                do not bother.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Make it a habit, not a one-time fix</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                The real win is noticing your own pattern. Most people leave out the same one or two
                things every time, usually context or limits. Once you know which is yours, you start
                writing it in without thinking about it.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Find your weak spot in seconds</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario finds the part of your prompt that is holding it back, then rewrites it. Free, no account needed.</p>
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
