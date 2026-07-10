import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'Prompt Quality Checklist: 9 Things to Check Before You Hit Send',
  description: 'A quick checklist to run your prompt through before sending it: goal, audience, format, limits, and a few things people forget. Bookmark it and check any prompt in under a minute.',
  alternates: { canonical: 'https://deepclario.com/blog/prompt-quality-checklist' },
  openGraph: {
    title: 'Prompt Quality Checklist: 9 Things to Check Before You Hit Send',
    description: 'A quick checklist to run your prompt through before sending it, so you catch the common gaps in under a minute.',
    url: 'https://deepclario.com/blog/prompt-quality-checklist',
    type: 'article',
  },
}

const post = getBlogPost('prompt-quality-checklist')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Prompt Quality Checklist: 9 Things to Check Before You Hit Send',
  description: 'A scannable checklist covering the nine most common gaps in AI prompts, meant to be run through quickly before sending anything that matters.',
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
      name: 'what should i check before sending a prompt to ai?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Check that the goal is stated plainly, the audience is named, the format is specified, any limits are set, and you have not buried the actual request under extra detail. These five catch most weak prompts before you send them.',
      },
    },
    {
      '@type': 'Question',
      name: 'is there a simple checklist for writing good ai prompts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. A short one: state the goal clearly, say who it is for, name the format, set any limits, add an example if the task is unusual, keep it to one main task, cut filler words, avoid contradicting yourself, and read it back as if you knew nothing else.',
      },
    },
    {
      '@type': 'Question',
      name: 'how long should checking a prompt take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Under a minute for most prompts. The checklist is meant to be quick: a fast read-through looking for the common gaps, not a deep edit. Save more time for prompts you will reuse or that matter for work.',
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
    { '@type': 'ListItem', position: 3, name: 'Prompt Quality Checklist', item: 'https://deepclario.com/blog/prompt-quality-checklist' },
  ],
}

const CHECKLIST = [
  { n: '1', t: 'The goal is stated plainly', d: 'Could a stranger read your prompt and know exactly what you want, without guessing? If not, say it more directly.' },
  { n: '2', t: 'You named who it’s for', d: 'A beginner and an expert need different answers to the same question. If you didn’t say, the model is guessing.' },
  { n: '3', t: 'You said what shape the answer should take', d: 'Length, structure, tone. A list, a few sentences, a table. Leave this out and you get whatever the model defaults to.' },
  { n: '4', t: 'You set any limits', d: '"No jargon," "keep it under 100 words," "don’t recommend a paid tool." Limits stop the model from wandering.' },
  { n: '5', t: 'You gave an example, if the task is unusual', d: 'For anything with a specific style or structure, one example does more than a paragraph of instructions.' },
  { n: '6', t: 'It’s one task, not three stacked together', d: 'A prompt asking for three different things at once usually does all three worse than asking separately would.' },
  { n: '7', t: 'You cut the filler', d: '"I was wondering if you could maybe help me with..." adds nothing. Say what you want directly.' },
  { n: '8', t: 'Nothing contradicts itself', d: 'Asking for "a detailed explanation" and "keep it very short" in the same prompt confuses the model. Pick one.' },
  { n: '9', t: 'You read it back cold', d: 'Read your prompt as if you knew nothing else about the situation. Anywhere you’d have to guess is a gap worth closing.' },
]

export default function PromptQualityChecklistPage() {
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
            Prompt Quality Checklist
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            This is meant to be quick. Not a lesson, just a list you run down before sending a prompt
            that matters. Most weak prompts are missing one or two of these, not all of them, so a
            fast scan usually finds the problem right away.
          </p>

          <article className="max-w-none space-y-8">
            <section>
              <div className="space-y-3">
                {CHECKLIST.map(item => (
                  <div key={item.n} className="p-4 rounded-xl border border-[color:var(--color-rule)] flex gap-4">
                    <span className="text-sm font-semibold text-[color:var(--color-paper-mute)] shrink-0">{item.n}</span>
                    <div>
                      <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                      <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">You don&apos;t need all nine every time</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Nobody runs through a nine-point list for a quick question. This is for the prompts
                that are worth thirty extra seconds: something you&apos;ll reuse, something going to
                a client, or a request you&apos;ve already asked twice without getting what you
                wanted.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                For everyday use, just keep the list in the back of your mind. Most people find the
                same one or two items keep tripping them up, usually the audience or the format. Once
                you notice your own pattern, you stop needing the full list at all.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Skip the manual check</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario runs this kind of check automatically and shows you exactly what to fix. Free, no account needed.</p>
            <Link href="/tools/prompt-analyzer" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Check my prompt →
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
              <Link href="/blog/why-most-prompts-fail" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Why most AI prompts fail →
              </Link>
            </div>
          </div>
          <PostFooter slug="prompt-quality-checklist" />
        </main>
      </div>
    </>
  )
}
