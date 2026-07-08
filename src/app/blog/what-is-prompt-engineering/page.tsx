import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'What is Prompt Engineering? A Complete Guide for Beginners',
  description: 'Prompt engineering is the practice of writing structured instructions for AI models to get better, more reliable results. Learn the fundamentals, key techniques, and how to get started.',
  alternates: { canonical: 'https://deepclario.com/blog/what-is-prompt-engineering' },
  openGraph: {
    title: 'What is Prompt Engineering? A Complete Guide',
    description: 'Learn prompt engineering fundamentals - what it is, why it matters, and how to write prompts that consistently get great AI results.',
    url: 'https://deepclario.com/blog/what-is-prompt-engineering',
    type: 'article',
  },
}

const post = getBlogPost('what-is-prompt-engineering')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What is Prompt Engineering? A Complete Guide for Beginners',
  description: 'A comprehensive guide to prompt engineering - what it is, why it matters, and how to write better prompts for ChatGPT, Claude, and Gemini.',
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
      name: 'What is prompt engineering?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Prompt engineering is the practice of writing structured, precise instructions for AI language models to consistently get useful, accurate output. It involves techniques like role assignment, format specification, chain-of-thought reasoning, and constraint setting to guide model behavior.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to know coding to do prompt engineering?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Prompt engineering is a writing and communication skill, not a technical one. The core techniques can be learned and applied by anyone who uses ChatGPT, Claude, or Gemini - no programming knowledge required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is prompt engineering a real job?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Prompt engineering roles exist at AI companies, large enterprises, and agencies. However, more broadly, prompt engineering is a skill that makes any knowledge worker more effective - writers, marketers, analysts, developers, and managers all benefit from learning it.',
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
    { '@type': 'ListItem', position: 3, name: 'What is Prompt Engineering', item: 'https://deepclario.com/blog/what-is-prompt-engineering' },
  ],
}

export default function WhatIsPromptEngineeringPage() {
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
            <span className="text-xs text-[color:var(--color-paper)] font-semibold uppercase tracking-wider">Guide</span>
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 8 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            What is Prompt Engineering?
          </h1>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            Prompt engineering is the practice of writing structured, precise instructions for AI language models
            to get consistently useful output. It&apos;s the difference between asking a vague question and
            giving a well-briefed task.
          </p>

          <article className="max-w-none space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Why prompts matter more than you think</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                When people get bad results from ChatGPT or Claude, they often blame the AI. But most of the time,
                the problem is the prompt - not the model.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                AI language models are exceptionally powerful, but they can only work with the information you
                give them. A vague prompt produces a vague answer. A prompt missing context produces a generic
                answer. A well-engineered prompt consistently produces exactly what you need.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">The 5 dimensions of a good prompt</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-5">
                Research into prompt effectiveness points to five elements that separate high-quality prompts from
                poor ones. This is the same framework Deepclario uses to score every prompt:
              </p>
              <div className="space-y-4">
                {[
                  { n: '1. Goal clarity', d: 'The desired output must be unambiguous. "Write something" is a goal. "Write a 500-word explainer for a non-technical audience on how neural networks learn" is a goal with clarity.' },
                  { n: '2. Context', d: 'AI models don\'t know your situation. Who is the audience? What\'s the tone? What domain are you in? Providing this context removes guesswork.' },
                  { n: '3. Format specification', d: 'If you don\'t specify structure, the AI invents one. Tell it: bullet list, numbered steps, JSON, markdown table, paragraph form, max 300 words, etc.' },
                  { n: '4. Constraints', d: 'Constraints tell the AI what NOT to do. "Avoid jargon", "don\'t recommend paid tools", "assume the reader has no coding background" - these prevent common failure modes.' },
                  { n: '5. Examples', d: 'Showing the AI an example of what you want (few-shot prompting) dramatically improves accuracy. Even one example shifts output quality significantly.' },
                ].map(item => (
                  <div key={item.n} className="p-5 rounded-xl border border-[color:var(--color-rule)]">
                    <h3 className="font-bold text-[color:var(--color-paper)] mb-2">{item.n}</h3>
                    <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">A before and after example</h2>
              <div className="grid gap-4">
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[#C25E5E] font-semibold uppercase mb-2">Weak prompt</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)] italic">&ldquo;Summarize this article&rdquo;</p>
                  <p className="text-xs text-[color:var(--color-paper-mute)] mt-3">Score: ~12/100 - No audience, no format, no length, no purpose</p>
                </div>
                <div className="p-5 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                  <p className="text-xs text-[color:var(--color-paper)] font-semibold uppercase mb-2">Engineered prompt</p>
                  <p className="text-sm text-[color:var(--color-paper)]">&ldquo;Summarize the key findings of this research article in 3 bullet points for a non-technical executive audience. Each bullet should be one sentence. Focus on practical implications, not methodology.&rdquo;</p>
                  <p className="text-xs text-[color:var(--color-paper-mute)] mt-3">Score: ~89/100 - Audience ✓ Format ✓ Length ✓ Constraints ✓</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Common prompt engineering techniques</h2>
              <div className="space-y-3">
                {[
                  { t: 'Role assignment', d: 'Starting with "Act as a [role]" primes the AI to respond with appropriate expertise and tone.' },
                  { t: 'Chain-of-thought', d: 'Adding "Think step by step" or "Reason through this" improves accuracy on complex tasks.' },
                  { t: 'Few-shot examples', d: 'Providing 1–3 examples of input → output pairs before your actual request dramatically improves consistency.' },
                  { t: 'Output constraints', d: 'Specifying format, length, and what to avoid gives the AI clear guardrails.' },
                  { t: 'Iterative refinement', d: 'Follow-up prompts that correct or extend previous answers are often more efficient than one perfect prompt.' },
                ].map(item => (
                  <div key={item.t} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                    <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{item.t}</p>
                    <p className="text-xs text-[color:var(--color-paper-mute)]">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">Who needs prompt engineering?</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                Anyone who uses an AI tool more than a few times a week benefits from better prompts:
              </p>
              <ul className="space-y-2 text-sm text-[color:var(--color-paper-mute)]">
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Developers using Copilot, Cursor, or Claude for code generation</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Writers using AI for drafts, editing, or ideation</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Marketers generating copy, campaigns, or briefs</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Students using AI for research, summaries, or study plans</li>
                <li className="flex gap-2"><span className="text-[color:var(--color-paper)]">→</span> Founders and teams building AI-powered workflows</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[color:var(--color-paper)] mb-4">How to get started</h2>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
                The fastest way to improve your prompts is to get scored feedback on what you&apos;re already writing.
                Paste any prompt into Deepclario and see exactly which dimensions are weak - with a rewritten version
                that fixes them.
              </p>
              <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
                No theory required. Try it on a real prompt you&apos;re working on right now.
              </p>
            </section>
          </article>

          <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Practice with your own prompts</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Paste any prompt. See your score. Get the improved version. Free, no account needed.</p>
            <Link href="/playground" className="inline-block px-6 py-3 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all">
              Analyze my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/how-to-write-better-prompts" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                How to write better prompts for ChatGPT, Claude, and Gemini →
              </Link>
              <Link href="/tools/prompt-improver" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Free AI Prompt Improver →
              </Link>
              <Link href="/prompts/chatgpt-blog-post" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Free prompt: write a blog post with ChatGPT →
              </Link>
              <Link href="/prompts/chatgpt-explain-concept-simply" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Free prompt: explain any concept simply →
              </Link>
              <Link href="/prompts" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Browse all free prompts →
              </Link>
            </div>
          </div>
          <PostFooter slug="what-is-prompt-engineering" />
        </main>
      </div>
    </>
  )
}
