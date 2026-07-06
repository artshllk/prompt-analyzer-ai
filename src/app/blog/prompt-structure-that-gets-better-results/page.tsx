import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'Prompt Structure That Gets Better Results',
  description: 'The order you put things in a prompt changes the answer. Here is a simple prompt structure, in five parts, that gets clearer results from any AI model.',
  alternates: { canonical: 'https://deepclario.com/blog/prompt-structure-that-gets-better-results' },
  openGraph: {
    title: 'Prompt Structure That Gets Better Results',
    description: 'The order you put things in a prompt changes the answer. Here is a simple five-part prompt structure that works with any AI model.',
    url: 'https://deepclario.com/blog/prompt-structure-that-gets-better-results',
    type: 'article',
  },
}

const post = getBlogPost('prompt-structure-that-gets-better-results')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Prompt Structure That Gets Better Results',
  description: 'A simple five-part prompt structure, in the right order, that produces clearer and more reliable answers from AI models.',
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
      name: 'how should i structure a prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A reliable order is role, task, context, format, then constraints. Tell the model who to be, what to do, what it needs to know, how to lay out the answer, and what to avoid. Keeping that order makes prompts easier to write and easier to fix.',
      },
    },
    {
      '@type': 'Question',
      name: 'does the order of a prompt matter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Putting the task and context before the format helps the model understand the job before it worries about layout. A jumbled prompt still works, but a clear order gives more consistent results and is easier to edit.',
      },
    },
    {
      '@type': 'Question',
      name: 'what are the parts of a good prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Role, task, context, format, and constraints. Not every prompt needs all five, but naming the ones that apply removes the guesswork that leads to weak answers.',
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
    { '@type': 'ListItem', position: 3, name: 'Prompt Structure', item: 'https://deepclario.com/blog/prompt-structure-that-gets-better-results' },
  ],
}

export default function PromptStructurePage() {
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
            Prompt Structure That Gets Better Results
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            Most people write a prompt as one run-on sentence and hope for the best. A little
            structure fixes that. Put the same information in a clear order and the model gets the
            job faster, and you get a better answer. Here is an order that works.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Five parts, in this order</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-5">
                You do not need all five every time. But when a prompt is not working, one of these
                is usually missing. Walk down the list and you will find the gap.
              </p>
              <div className="space-y-4">
                {[
                  { n: '1. Role', d: 'Who should the model be? "Act as a copy editor." This sets tone and focus. Skip it for simple tasks.' },
                  { n: '2. Task', d: 'What do you want done, in plain words? This is the one part you can never leave out.' },
                  { n: '3. Context', d: 'What does the model need to know that it cannot see? The audience, the goal, the background.' },
                  { n: '4. Format', d: 'How should the answer look? A list, a table, three bullets, under 200 words.' },
                  { n: '5. Constraints', d: 'What should it avoid? "No jargon." "Do not invent facts." "Keep it friendly."' },
                ].map(item => (
                  <div key={item.n} className="p-5 rounded-xl border border-[color:var(--color-rule)]">
                    <h3 className="font-bold text-[color:var(--color-paper)] mb-2">{item.n}</h3>
                    <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The five parts put together</h2>
              <div className="p-6 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper)] leading-relaxed">
                  &ldquo;Act as a friendly onboarding writer. Write a welcome email for people who
                  just signed up for a budgeting app. They are nervous about money and new to
                  budgeting. Keep it to 120 words, warm and plain. Do not use finance jargon, and do
                  not oversell.&rdquo;
                </p>
                <p className="text-xs text-[color:var(--color-paper-mute)] mt-4">
                  Role, task, context, format, constraints. Each part answers a question the model
                  would otherwise guess at.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why the order helps</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The order is not magic, but it is practical. Role and task first tell the model what
                it is doing before it worries about anything else. Context comes next so the task
                makes sense. Format and constraints come last, because they only matter once the
                model knows the job.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                The bigger win is for you. A structured prompt is easy to fix. If the answer is off,
                you can look at each part and see which one you left thin, instead of rewriting the
                whole thing from scratch.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">See which part your prompt is missing</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Deepclario scores your prompt part by part and rewrites the weak ones. Free, no account needed.</p>
            <Link href="/playground" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Analyze my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/what-is-a-good-prompt" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What makes a good AI prompt? →
              </Link>
              <Link href="/blog/why-most-prompts-fail" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Why most AI prompts fail →
              </Link>
              <Link href="/blog/role-prompting-examples" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Role prompting examples →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
