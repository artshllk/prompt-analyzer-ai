import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'AI Prompt Best Practices - What Actually Works in 2026',
  description: 'The most effective AI prompt best practices based on real use across ChatGPT, Claude, and Gemini. Covers structure, context, format, iteration, and common mistakes.',
  alternates: { canonical: 'https://deepclario.com/blog/ai-prompt-best-practices' },
  openGraph: {
    title: 'AI Prompt Best Practices',
    description: 'What actually works when prompting ChatGPT, Claude, and Gemini. Practical best practices with examples.',
    url: 'https://deepclario.com/blog/ai-prompt-best-practices',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'AI Prompt Best Practices',
  description: 'The most effective AI prompt best practices for ChatGPT, Claude, and Gemini.',
  author: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  publisher: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  datePublished: '2026-05-01',
  dateModified: '2026-05-25',
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What are the best practices for writing AI prompts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The core best practices are: assign a role, specify the output format, provide enough context, add constraints (what to avoid), and iterate on the first draft. Being specific on all five dimensions produces dramatically better output than a one-sentence prompt. The more the AI has to guess, the more generic the output.',
      },
    },
    {
      '@type': 'Question',
      name: 'How specific should an AI prompt be?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'As specific as the task requires. For a simple task, 2-3 sentences may be enough. For complex tasks, a well-structured prompt of 8-15 lines consistently outperforms a short one. There is no penalty for being precise - the model does not get confused by more information. It gets confused by missing information.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are the most common AI prompting mistakes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The most common mistakes are: being too vague (no role, no format, no context), asking for too much at once, not specifying what you do not want, accepting the first output without iterating, and writing a prompt once and reusing it without refining. Treating the first output as a draft rather than a final answer fixes most of these.',
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
    { '@type': 'ListItem', position: 3, name: 'AI Prompt Best Practices', item: 'https://deepclario.com/blog/ai-prompt-best-practices' },
  ],
}

const PRACTICES = [
  {
    title: 'Assign a role before the task',
    body: 'Start every prompt with who the AI should be. "You are a senior product manager with 10 years of B2B experience" sets vocabulary, detail level, and assumptions before the task even begins. Without a role, the model defaults to a generic assistant voice that suits nobody in particular.',
  },
  {
    title: 'Be explicit about output format',
    body: 'State the format you want before asking the question. "Return a bulleted list of 5 items, each under 20 words" is not over-specifying - it is removing ambiguity that would otherwise produce an output you have to reformat. Specify: list vs. prose, headers vs. no headers, length, and structure.',
  },
  {
    title: 'Front-load the most important information',
    body: 'AI models pay more attention to content at the beginning and end of a prompt than the middle. Put the task and the most important constraints first. Instructions buried in the middle of a long prompt are more likely to be missed or given less weight.',
  },
  {
    title: 'Use negative constraints liberally',
    body: '"Do not use bullet points", "Do not start with a question", "Do not hedge with phrases like it is worth noting" - these negative instructions are extremely effective. They short-circuit the model\'s most common filler patterns and force more deliberate choices.',
  },
  {
    title: 'Provide the context the model cannot infer',
    body: 'Who is the audience? What decision will this output inform? What has already been tried? What tone is appropriate for this situation? Anything the AI cannot know without being told should be in the prompt. Every piece of context you omit gets replaced by a guess.',
  },
  {
    title: 'Separate instructions from content with clear markers',
    body: 'When you are pasting content (a document, data, an email) into a prompt with instructions, separate them clearly. Use labels like "INSTRUCTIONS:", "CONTENT:", "MY DATA:", "EXAMPLE OUTPUT:". This prevents the model from treating your instructions as part of the content to process.',
  },
  {
    title: 'Iterate rather than restart',
    body: 'The first output is a starting point. Follow up with specific refinements: "The tone is too formal - rewrite the second paragraph", "This is 200 words too long - cut without losing the main argument", "The third point is vague - be more specific." Each iteration teaches the model more about what you need.',
  },
  {
    title: 'Ask for alternatives, not just one answer',
    body: 'For writing, subject lines, headlines, and any output where taste matters: ask for 3-5 variations. You will almost always prefer one, or find the best elements split across two. "Give me 5 versions of this headline" costs nothing and dramatically improves your chances of getting something you can use.',
  },
]

export default function AIPromptBestPracticesPage() {
  return (
    <div className="editorial grain min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <MarketingNav current="blog" />

      <main className="max-w-2xl mx-auto px-6 pt-28 md:pt-36 pb-16">
        <nav className="mb-8 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
          <Link href="/blog" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>Blog</Link>
          <span className="mx-2">/</span>
          <span>AI prompt best practices</span>
        </nav>

        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-paper)' }}>Best Practices</span>
          <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>· 7 min read</span>
        </div>

        <h1 className="text-4xl font-bold mb-5 leading-tight" style={{ color: 'var(--color-paper)' }}>
          AI prompt best practices
        </h1>
        <p className="text-lg leading-relaxed mb-12" style={{ color: 'var(--color-paper-mute)' }}>
          These are the practices that consistently produce better output across ChatGPT, Claude, and Gemini.
          Not theory - actual techniques that change results.
        </p>

        <ol className="space-y-px">
          <li className="rule-strong" />
          {PRACTICES.map((p, i) => (
            <li key={i}>
              <div className="grid grid-cols-12 gap-4 py-7">
                <span className="col-span-1 font-serif text-xl tabular-nums" style={{ color: 'var(--color-paper-mute)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="col-span-11">
                  <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-paper)' }}>{p.title}</h2>
                  <p className="leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>{p.body}</p>
                </div>
              </div>
              <div className="rule" />
            </li>
          ))}
        </ol>

        <div className="mt-16 rounded-2xl p-7" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
          <h2 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Check which best practices your prompt is missing
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-paper-mute)' }}>
            Deepclario scores your prompt across five dimensions, tells you exactly what is missing, and rewrites it. Free.
          </p>
          <Link href="/playground" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] btn-paper transition-all" style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}>
            Analyze my prompt free
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
          <p className="text-xs mb-3" style={{ color: 'var(--color-paper-mute)' }}>Related reading</p>
          <div className="flex flex-col gap-2">
            <Link href="/blog/what-is-a-good-prompt" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>What makes a good AI prompt? →</Link>
            <Link href="/blog/how-to-write-better-prompts" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>How to write better AI prompts - 7 techniques →</Link>
            <Link href="/blog/how-to-get-better-results-from-chatgpt" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>How to get better results from ChatGPT →</Link>
            <Link href="/prompts" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>Browse all free prompt templates →</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
