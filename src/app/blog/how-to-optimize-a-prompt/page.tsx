import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

const post = getBlogPost('how-to-optimize-a-prompt')

export const metadata: Metadata = {
  title: 'How to Optimize a Prompt, Step by Step',
  description: 'Optimizing a prompt is not guesswork. Here is a clear step-by-step method to turn a rough prompt into one that gets reliable results, one change at a time.',
  alternates: { canonical: 'https://deepclario.com/blog/how-to-optimize-a-prompt' },
  openGraph: {
    title: 'How to Optimize a Prompt, Step by Step',
    description: 'Optimizing a prompt is not guesswork. Here is a clear step-by-step method to turn a rough prompt into one that gets reliable results.',
    url: 'https://deepclario.com/blog/how-to-optimize-a-prompt',
    type: 'article',
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Optimize a Prompt, Step by Step',
  description: 'A step-by-step method for optimizing an AI prompt: start from a clear goal, fix one weak part at a time, test, and stop when it is reliable.',
  image: 'https://deepclario.com/blog/how-to-optimize-a-prompt/opengraph-image',
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
      name: 'how do i optimize a prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Start with a clear goal, then improve one part at a time: the task, the context, the format, then the constraints. Test after each change so you know what helped. Stop when the prompt gives a good answer across several runs.',
      },
    },
    {
      '@type': 'Question',
      name: 'what does it mean to optimize a prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It means improving a prompt on purpose until it reliably gives the answer you want, instead of rewriting it at random and hoping. You change one thing, test, keep what works, and repeat.',
      },
    },
    {
      '@type': 'Question',
      name: 'when is a prompt good enough?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When it gives a useful answer across several runs and several inputs, not just the first one you tried. Chasing perfection past that point usually wastes time for little gain.',
      },
    },
    {
      '@type': 'Question',
      name: 'can ai improve its own prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It can help. When an answer is close but not right, tell the model what was off and ask it to rewrite your prompt, for example "That was too formal and too long. Rewrite my prompt so the next answer is warmer and under 90 words." You still make the final call, but it is a fast way to get an improved draft to react to.',
      },
    },
    {
      '@type': 'Question',
      name: 'what order should i fix a prompt in?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Start from a clear goal, then improve one part at a time in this order: the task, the context, the format, then the constraints. Test after each change so you know what helped. Fixing one thing at a time is slower than a full rewrite, but it is the only way to learn which change actually worked.',
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
    { '@type': 'ListItem', position: 3, name: 'How to Optimize a Prompt', item: 'https://deepclario.com/blog/how-to-optimize-a-prompt' },
  ],
}

export default function HowToOptimizeAPromptPage() {
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
            How to Optimize a Prompt, Step by Step
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            Optimizing a prompt sounds technical, but it is mostly a habit. You stop rewriting at
            random and start improving one part at a time, testing as you go. Here is the method,
            in plain steps you can follow every time.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Start from a clear goal</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Before you touch the wording, get honest about what a good answer looks like. Write
                it down in a sentence: who it is for, what it should say, how long, what tone. You
                cannot improve a prompt toward a target you have not named.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                This one step saves the most time. Half of bad prompts are not badly written, they
                are aimed at a goal the writer never made clear, even to themselves.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Fix one part at a time</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-5">
                Run the prompt, look at the answer, and find the single weakest part. Fix only that,
                then run it again. Work down this order and you will catch most problems.
              </p>
              <div className="space-y-4">
                {[
                  { n: '1. Task', d: 'Is the actual request clear and specific? A fuzzy task is the most common problem, and the first to fix.' },
                  { n: '2. Context', d: 'Does the model know the audience and the goal? Add what it would otherwise have to guess.' },
                  { n: '3. Format', d: 'Did you say how the answer should look? Name the structure, length, and shape.' },
                  { n: '4. Constraints', d: 'Did you say what to avoid? Add the limits that keep it from wandering.' },
                ].map(item => (
                  <div key={item.n} className="p-5 rounded-xl border border-[color:var(--color-rule)]">
                    <h3 className="font-bold text-[color:var(--color-paper)] mb-2">{item.n}</h3>
                    <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Test after every change</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Change one thing, then run the prompt again, ideally a few times. If the answer got
                better, keep the change. If it did not, undo it. This is slower than rewriting the
                whole prompt in one go, but it is the only way to know which change actually helped.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Over a few rounds, you are not just fixing this prompt. You are learning which fixes
                tend to work, which makes the next prompt faster to write.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Watch it improve, step by step</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-5">
                Here is the whole method on one prompt. Each version fixes one part and gets closer.
              </p>
              <div className="space-y-3">
                {[
                  { n: 'Start', d: '"Write a follow-up email." The answer is generic and could be for anyone.' },
                  { n: 'Fix the task', d: '"Write a follow-up email to a client who has not replied in a week." Better, but still flat.' },
                  { n: 'Add context', d: 'Add: "We sent a proposal; they seemed keen but went quiet." Now it can reference the situation.' },
                  { n: 'Add format', d: 'Add: "Keep it under 90 words, warm and low-pressure." Now the shape fits.' },
                  { n: 'Add a limit', d: 'Add: "Do not sound pushy or guilt them for not replying." The final version lands.' },
                ].map(item => (
                  <div key={item.n} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.n}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                Five small edits, tested one at a time, and a vague request became a prompt you can
                reuse with confidence. No single change was clever. The method is what did the work.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Let the model help you optimize</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A quiet trick: the AI can help improve its own prompt. When an answer is close but not
                right, tell the model what was off and ask it to suggest a better prompt.
              </p>
              <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper)]">&ldquo;That answer was too formal and too long. Rewrite my prompt so the next answer is warmer and under 90 words.&rdquo;</p>
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                You still make the final call, since the model does not know what you want better than
                you do. But it is a fast way to get an improved draft to react to, which often beats
                staring at a blank prompt trying to fix it alone.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Know when to stop</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Stop when the prompt gives a good answer across several runs and a few different
                inputs. Chasing a perfect prompt past that point is usually wasted effort. Good and
                reliable is the goal, not flawless.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Skip the guesswork</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario scores each part of your prompt and rewrites the weak ones, so optimizing takes seconds. Free, no account needed.</p>
            <Link href="/prompt-improver" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Optimize my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/prompt-structure-that-gets-better-results" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Prompt structure that gets better results →
              </Link>
              <Link href="/blog/how-to-test-a-prompt" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to test a prompt: a simple method →
              </Link>
              <Link href="/blog/how-to-compare-ai-prompts" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to compare two AI prompts →
              </Link>
            </div>
          </div>
          <PostFooter slug="how-to-optimize-a-prompt" />
        </main>
      </div>
    </>
  )
}
