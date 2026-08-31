import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'How to Compare Two AI Prompts (And Pick the Better One)',
  description: 'Which prompt is better? Guessing does not work. Here is a fair way to compare two AI prompts side by side and pick the one that really performs.',
  alternates: { canonical: 'https://deepclario.com/blog/how-to-compare-ai-prompts' },
  openGraph: {
    title: 'How to Compare Two AI Prompts (And Pick the Better One)',
    description: 'Which prompt is better? Here is a fair way to compare two AI prompts side by side and pick the one that really performs.',
    url: 'https://deepclario.com/blog/how-to-compare-ai-prompts',
    type: 'article',
  },
}

const post = getBlogPost('how-to-compare-ai-prompts')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Compare Two AI Prompts (And Pick the Better One)',
  description: 'A fair method for comparing two AI prompts: same input, same standard, several runs, so you pick the better prompt on evidence not on a hunch.',
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
      name: 'how do i compare two ai prompts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Give both prompts the same input, judge both answers against the same written standard, and run each a few times so one lucky result does not decide it. The prompt that wins across several runs is the better one.',
      },
    },
    {
      '@type': 'Question',
      name: 'why can i not just pick the prompt that looks better?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Because a single answer can be luck, and a prompt that reads nicer can still perform worse. A fair comparison uses the same input and standard across several runs, so you are judging results, not first impressions.',
      },
    },
    {
      '@type': 'Question',
      name: 'what should i measure when comparing prompts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Whatever matters for your task: accuracy, tone, length, format, and how consistent the answers are across runs. Decide these before you test, so you are not moving the goalposts to fit the prompt you already liked.',
      },
    },
    {
      '@type': 'Question',
      name: 'should i pick the prompt with the single best answer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. A single great answer can be luck. Judge consistency instead: a prompt that is good on every run is usually better to rely on than one that swings between brilliant and poor. Steady and good beats occasionally brilliant for anything you will reuse.',
      },
    },
    {
      '@type': 'Question',
      name: 'why do my prompt comparisons give unreliable results?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Usually one of four mistakes: feeding each prompt a different input, running each only once, deciding what counts as good after seeing the results, or judging the prompt text instead of the answers it produces. Fix those and use the same input, a written standard set in advance, and several runs each.',
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
    { '@type': 'ListItem', position: 3, name: 'How to Compare AI Prompts', item: 'https://deepclario.com/blog/how-to-compare-ai-prompts' },
  ],
}

export default function HowToCompareAIPromptsPage() {
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
            How to Compare Two AI Prompts
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            You have two versions of a prompt and you want to know which is better. The wrong way
            is to run each once and go with the one you like. The right way takes a few more minutes
            and actually tells you the truth.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why a quick look misleads you</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A single answer from each prompt is not enough to judge. Models have some
                randomness, so prompt A might get a great answer once and a poor one next time.
                Judge on one run each and you are half testing the prompt and half testing luck.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                There is also a trap of taste. A prompt that reads nicely can still perform worse.
                To compare fairly, you have to look at the answers, not the prompts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A fair comparison, in three rules</h2>
              <div className="space-y-4">
                {[
                  { n: '1. Same input', d: 'Feed both prompts the exact same input. If prompt A gets an easy example and prompt B gets a hard one, the test is rigged before it starts.' },
                  { n: '2. Same standard', d: 'Write down what a good answer needs before you look at any results: the tone, the length, the facts. Score both against that list, not against each other.' },
                  { n: '3. Several runs', d: 'Run each prompt three or four times. The one that stays good across all of them wins. A single strong answer does not settle it.' },
                ].map(item => (
                  <div key={item.n} className="p-5 rounded-xl border border-[color:var(--color-rule)]">
                    <h3 className="font-bold text-[color:var(--color-paper)] mb-2">{item.n}</h3>
                    <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Consistency counts too</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                When you compare, do not only ask which prompt gave the best single answer. Ask which
                one gave good answers every time. A prompt that scores 8 out of 10 on every run is
                usually better to rely on than one that swings between a 10 and a 4.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Steady and good beats occasionally brilliant, especially for anything you plan to
                reuse.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A quick worked comparison</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Say you want a prompt that writes product descriptions, and you have two versions. Here
                is the whole process in one pass.
              </p>
              <div className="p-6 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">
                  Pick one product and feed it to both prompts. Before you read anything, write your
                  standard: under 50 words, one clear benefit, no buzzwords. Run each prompt four
                  times. Prompt A gives one great description and three flat ones. Prompt B gives four
                  solid, on-standard descriptions every time. Prompt B wins, even though A produced the
                  single best line. Steady and good beats occasionally brilliant, because you can rely
                  on it.
                </p>
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                That is the value of running each prompt several times. A single comparison would have
                told you A was best, and you would have been wrong.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Common ways a comparison goes wrong</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                A few habits quietly ruin a comparison and lead you to the wrong winner.
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Different inputs. If each prompt gets a different example, you are testing the examples, not the prompts.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> One run each. A single answer can be luck. You need a few runs to see the real pattern.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Moving the goalposts. Deciding what counts as good after you see the results lets you pick the prompt you already liked.</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Judging the prompt, not the answers. A nicer-looking prompt can still produce worse output. Look at what comes out.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Keep the winner, note why</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                Once one prompt wins, write down what made it better. Maybe it was a clearer format
                line, or a tighter constraint. That note is worth more than the prompt itself,
                because it tells you what to do next time you write one from scratch.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Score both prompts fairly</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario gives each prompt a score on the same standard, so the comparison is not just a hunch. Free, no account needed.</p>
            <Link href="/playground" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Improve my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/how-to-test-a-prompt" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to test a prompt: a simple method →
              </Link>
              <Link href="/blog/how-to-optimize-a-prompt" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to optimize a prompt, step by step →
              </Link>
              <Link href="/blog/prompt-length-vs-response-quality" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Prompt length vs response quality →
              </Link>
            </div>
          </div>
          <PostFooter slug="how-to-compare-ai-prompts" />
        </main>
      </div>
    </>
  )
}
