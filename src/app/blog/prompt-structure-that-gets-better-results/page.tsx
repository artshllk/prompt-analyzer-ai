import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

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
    {
      '@type': 'Question',
      name: 'is there a prompt template i can reuse?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. A simple one is: "Act as [role]. [The task in one sentence.] Context: [who it is for and the goal]. Format: [length, structure, tone]. Avoid: [what should not happen]." You do not have to fill every line every time; treat it as a checklist that stops you from forgetting the part that would have made the answer good.',
      },
    },
    {
      '@type': 'Question',
      name: 'does a structured prompt have to be long?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Structure is about what you include, not how many words you use. A one-line request can carry the role, task, audience, format, and a limit in a single natural sentence, such as "As an editor, tighten this paragraph for a general reader, under 60 words, no jargon."',
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
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A template you can reuse</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Once the order is a habit, you can keep a simple fill-in-the-blank template and reach
                for it any time a first answer is not good enough.
              </p>
              <div className="p-6 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">
                  Act as <span className="text-[color:var(--color-paper)]">[role]</span>.<br />
                  <span className="text-[color:var(--color-paper)]">[The task, in one plain sentence.]</span><br />
                  Context: <span className="text-[color:var(--color-paper)]">[who it is for, the goal, anything the model cannot see]</span>.<br />
                  Format: <span className="text-[color:var(--color-paper)]">[length, structure, tone]</span>.<br />
                  Avoid: <span className="text-[color:var(--color-paper)]">[what should not happen]</span>.
                </p>
              </div>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mt-4">
                You will not fill in every line every time, and that is fine. The template is a
                checklist, not a form. Its job is to stop you from forgetting the part that would have
                made the answer good.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">This works for short prompts too</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Structure does not mean long. A one-line request can still carry all five parts in a
                tight, natural sentence. You do not have to write a form.
              </p>
              <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                <p className="text-sm text-[color:var(--color-paper)]">&ldquo;As an editor, tighten this paragraph for a general reader, under 60 words, no jargon.&rdquo;</p>
                <p className="text-xs text-[color:var(--color-paper-mute)] mt-2">Role, task, audience, format, and a limit, all in one line. Structure is about what you include, not how many words you use.</p>
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
            <Link href="/prompt-improver" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
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
          <PostFooter slug="prompt-structure-that-gets-better-results" />
        </main>
      </div>
    </>
  )
}
