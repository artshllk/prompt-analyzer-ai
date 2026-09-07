import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

const post = getBlogPost('prompt-score-explained')

export const metadata: Metadata = {
  title: 'What a Prompt Score Really Measures (And Why We Removed Ours)',
  description: 'A prompt score is a model reading your prompt and picking a number. We shipped one, looked at how it was produced, and took it out. Here is what a score can and cannot tell you.',
  alternates: { canonical: 'https://deepclario.com/blog/prompt-score-explained' },
  openGraph: {
    title: 'What a Prompt Score Really Measures (And Why We Removed Ours)',
    description: 'A prompt score is a model reading your prompt and picking a number. We shipped one, then took it out. Here is what a score can and cannot tell you.',
    url: 'https://deepclario.com/blog/prompt-score-explained',
    type: 'article',
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What a Prompt Score Really Measures (And Why We Removed Ours)',
  description: 'What a prompt score is made of, why ours was not worth printing, and what is worth counting instead.',
  image: 'https://deepclario.com/blog/prompt-score-explained/opengraph-image',
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
      name: 'what is a prompt score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A prompt score is a number, usually out of 100, meant to tell you how clear and complete your prompt is. In almost every tool that shows one, the number comes from a language model reading your prompt and picking a value. It is not counted from the text the way a word count is.',
      },
    },
    {
      '@type': 'Question',
      name: 'what does a prompt score measure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'At best it is a rough guess at how much the model will have to fill in for you: the audience, the length, the tone, the things to avoid. Those gaps are real and you can list them. The number on top of them is an opinion, and two tools will often give you two different ones for the same prompt.',
      },
    },
    {
      '@type': 'Question',
      name: 'is a higher prompt score always better?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not on its own. A score that rises after a rewrite you did not write tells you very little, because the same system usually produced both the rewrite and the score. Read what was added instead. If it added an audience or a deadline you never mentioned, that is a guess, and it can be wrong.',
      },
    },
    {
      '@type': 'Question',
      name: 'why did we remove our prompt score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We showed a before and after number, something like clarity 22 then 87. The first was a model rating your prompt. The second was the same system rating its own rewrite, so it was grading its own work and it never marked itself down. Nothing outside the system could confirm or contradict either number, so we replaced it with a list of what was added and what was guessed.',
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
    { '@type': 'ListItem', position: 3, name: 'What a Prompt Score Really Measures', item: 'https://deepclario.com/blog/prompt-score-explained' },
  ],
}

export default function PromptScoreExplainedPage() {
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
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 5 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            What a prompt score really measures (and why we removed ours)
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            A prompt score is a number, usually out of 100, that is supposed to tell you how good your
            prompt is. We used to show one. We took it out. This is what a number like that is made
            of, why ours was not worth printing, and what we put in its place.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Where the number comes from</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Almost every prompt score works the same way. A language model reads your prompt and
                returns a number. There is no ruler anywhere in that process. The model is being asked
                for an opinion, and the opinion is handed to you in the shape of a measurement.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                That is different from a word count or a reading level. Those are counted from the text
                itself, so two tools will agree. Ask two models to score the same prompt and you can
                get 60 from one and 85 from the other, and neither of them is wrong, because there is
                nothing for them to be wrong about.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why we removed ours</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Ours showed two numbers, before and after. Clarity 22, then 87 once the prompt had been
                rewritten. It looked like proof that the tool had done something.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The first number was a model reading your prompt and picking a score. The second number
                was the same system reading its own rewrite and picking a score for that. So the jump
                on the screen was the rewriter grading its own work. It was never going to mark itself
                down, and it never did.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Once it is written down that plainly, the number has no job left. It went up every
                time. It went up by roughly the same amount every time. Nothing outside the system
                ever agreed or disagreed with it. We shipped it, looked at how it was produced, and
                found it was measuring nothing, so we deleted it rather than keep a number that only
                looked like evidence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The question to ask any score</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                What would make this number wrong?
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A bathroom scale can be wrong, and you find out by standing on a different one. A word
                count can be wrong, and you find out by counting. A prompt score has no second scale to
                stand on. Nothing can contradict it, which also means nothing can confirm it.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                So when a tool shows you a score, ask what it compared your prompt to. If the answer is
                nothing, the number is decoration. It might still be pointing in a sensible direction,
                but you should not treat it as evidence, and you should not tune your writing to make
                it go up.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What is worth counting instead</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                There is a real thing underneath the score, and it can be counted. A prompt is weak when
                the model has to fill in parts you never gave it. Who is reading this. How long it
                should be. What tone. What to stay away from. Those gaps are not a matter of opinion.
                You can list them one by one.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                So that is what we show now. The rewrite comes back with the added parts marked, and the
                parts we had to guess marked differently. Not a number, a list you can read: we added an
                audience, a length limit and a tone, and the audience was a guess.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                You can argue with a guess. You can delete it, or swap it for the real answer, and the
                prompt gets better because you knew something the tool did not. There is nothing you
                can do with an 87.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">What a score can honestly tell you</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A rough score is still worth something as a nudge. If a tool says your prompt looks
                thin, it is usually right, because most short prompts are thin. Treat it like the red
                underline in a word processor. It is a reason to look again, not a verdict.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Two things to watch for. If the number moves when you change something that does not
                matter, it is reading your style rather than your completeness. And if it climbs after
                a rewrite you did not write yourself, read the rewrite before you trust the climb.
                Sometimes the gaps get filled with details that are not true about your situation, and
                a confident prompt built on a wrong assumption is worse than a thin one.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A clear prompt is not a correct answer</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Whatever a score or a list of gaps tells you, it is only describing the request. It says
                nothing about the reply.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                A well-built prompt gets you a better draft. It does not stop the model inventing a
                number or a source, and that is the part that actually gets people into trouble. You
                still have to check what came back. That is a different job, and it is the one we{' '}
                <Link href="/" className="underline hover:opacity-70 transition-opacity">work on now</Link>.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">See what your prompt is missing</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Paste any prompt into Deepclario. It finds the gaps, asks one question if your prompt could mean two things, and rewrites it with the added parts and the guesses marked. No score. Free, no account needed.</p>
            <Link href="/prompt-improver" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Improve my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/how-to-improve-a-prompt-score" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to improve a prompt score →
              </Link>
              <Link href="/blog/what-is-a-good-prompt" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What makes a good AI prompt? →
              </Link>
              <Link href="/blog/prompt-analyzer-guide" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Prompt analyzer guide →
              </Link>
            </div>
          </div>
          <PostFooter slug="prompt-score-explained" />
        </main>
      </div>
    </>
  )
}
