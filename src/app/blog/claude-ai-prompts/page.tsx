import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Claude AI Prompts — How to Write Better Prompts for Claude',
  description: 'How to write prompts specifically for Claude (Anthropic). Covers where Claude differs from ChatGPT, what Claude is uniquely good at, and ready-to-use prompt examples.',
  alternates: { canonical: 'https://deepclario.com/blog/claude-ai-prompts' },
  openGraph: {
    title: 'Claude AI Prompts — How to Write Better Prompts for Claude',
    description: 'What makes a good Claude prompt different from a ChatGPT prompt, and how to get the best results from Anthropic\'s model.',
    url: 'https://deepclario.com/blog/claude-ai-prompts',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Claude AI Prompts — How to Write Better Prompts for Claude',
  description: 'How to write better prompts for Claude (Anthropic) with real examples.',
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
      name: 'How do I write a good prompt for Claude?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Claude responds well to detailed, clearly structured prompts. It handles long context windows better than most models, so pasting in full documents or detailed instructions works well. Claude is also more likely than other models to push back or ask for clarification when a prompt is ambiguous, which is a feature rather than a bug — it means giving you more accurate output.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Claude better than ChatGPT?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Neither model is universally better. Claude (especially Claude 3.5 Sonnet and Claude 4) tends to excel at nuanced writing, careful reasoning, and following complex instructions. ChatGPT (GPT-4o) tends to be faster and has more integrations. For most writing and analysis tasks, a well-written prompt in either model produces comparable results.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do the same prompt techniques work for Claude and ChatGPT?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Mostly yes. Role assignment, format specification, context provision, and constraints work well in both. Claude tends to follow nuanced instructions more precisely and is less likely to pad output with filler. It also tends to be more honest about uncertainty, which makes its outputs more trustworthy for research and analysis.',
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
    { '@type': 'ListItem', position: 3, name: 'Claude AI Prompts', item: 'https://deepclario.com/blog/claude-ai-prompts' },
  ],
}

export default function ClaudeAIPromptsPage() {
  return (
    <div className="editorial grain min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <header className="border-b border-[color:var(--color-rule)] px-6 md:px-10 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Deepclario" width={28} height={28} priority />
          <span className="text-[15px] tracking-tight font-medium" style={{ color: 'var(--color-paper)' }}>Deepclario</span>
        </Link>
        <Link href="/playground" className="px-4 py-2 rounded-full text-sm btn-paper font-medium transition-all" style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}>
          Improve a prompt free
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <nav className="mb-8 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
          <Link href="/blog" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>Blog</Link>
          <span className="mx-2">/</span>
          <span>Claude AI prompts</span>
        </nav>

        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-paper)' }}>Guide</span>
          <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>· 7 min read</span>
        </div>

        <h1 className="text-4xl font-bold mb-5 leading-tight" style={{ color: 'var(--color-paper)' }}>
          Claude AI prompts: how to get the best results from Claude
        </h1>
        <p className="text-lg leading-relaxed mb-10" style={{ color: 'var(--color-paper-mute)' }}>
          Claude and ChatGPT respond to prompts differently. Understanding those differences helps you write
          prompts that play to Claude's strengths. This guide covers what makes Claude distinctive,
          where it excels, and how to structure prompts to get the most from it.
        </p>

        <div className="space-y-10" style={{ color: 'var(--color-paper-mute)' }}>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-paper)' }}>How Claude handles prompts differently</h2>
            <p className="leading-relaxed mb-4">
              Claude is trained to be more precise and less prone to confident-sounding hallucination. When it
              does not know something or a prompt is ambiguous, it is more likely to say so or ask a clarifying
              question rather than generating a plausible-sounding wrong answer.
            </p>
            <p className="leading-relaxed mb-4">
              Claude also has a larger effective context window and handles long documents better. If you are
              working with a contract, a research paper, or a codebase, pasting the full text rather than a
              summary tends to produce better results than in most other models.
            </p>
            <p className="leading-relaxed">
              Finally, Claude follows nuanced style instructions more precisely. If you say "no bullet points,
              no headers, conversational prose under 300 words," it tends to actually follow all four constraints,
              not just some of them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-paper)' }}>What Claude is uniquely good at</h2>
            <ul className="space-y-3">
              {[
                { label: 'Nuanced writing', desc: 'Claude produces prose that sounds less mechanical. It is particularly good at writing that requires a specific voice, tone, or emotional register.' },
                { label: 'Complex instruction following', desc: 'If your prompt has 8 specific requirements, Claude is more likely to honor all 8 than most other models.' },
                { label: 'Long document analysis', desc: 'Paste in a 50-page contract or a full codebase. Claude can reason over the entire thing without losing context.' },
                { label: 'Honest uncertainty', desc: 'Claude is more likely to tell you when it is not sure rather than confidently generating a wrong answer. This makes it more useful for research and fact-checking.' },
                { label: 'Structured reasoning', desc: 'For complex problems, Claude tends to reason through steps more systematically when asked to think carefully.' },
              ].map((item, i) => (
                <li key={i} className="flex gap-3 leading-relaxed">
                  <span style={{ color: 'var(--color-paper)' }}>—</span>
                  <span><strong style={{ color: 'var(--color-paper)' }}>{item.label}:</strong> {item.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-paper)' }}>Prompt examples optimized for Claude</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-paper)' }}>Long document analysis</h3>
                <pre className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)', color: 'var(--color-paper)', fontFamily: 'ui-monospace, monospace' }}>{`Read the following [contract / research paper / document] carefully.

[PASTE FULL DOCUMENT HERE]

Then answer these questions:
1. What are the 3 most important things I need to know?
2. Are there any unusual clauses, risks, or red flags I should pay attention to?
3. What is unclear or ambiguous and would benefit from clarification?

Be specific. Reference the exact section when relevant.`}</pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-paper)' }}>High-quality writing with voice</h3>
                <pre className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)', color: 'var(--color-paper)', fontFamily: 'ui-monospace, monospace' }}>{`You are a senior editor at a respected technology publication.

Write [ARTICLE TYPE] about [TOPIC] for [AUDIENCE].

Voice: intelligent but accessible. No jargon unless explained.
Short sentences where possible. No padding, no filler conclusions.
Do not start with "In today's world" or any similar cliché.
Do not use bullet points — prose only.
Length: [WORD COUNT].

The piece should leave the reader with one clear, specific idea they did not have before they started reading.`}</pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-paper)' }}>Careful reasoning on a complex decision</h3>
                <pre className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)', color: 'var(--color-paper)', fontFamily: 'ui-monospace, monospace' }}>{`I need to decide [DECISION]. Here is the full context:

[DESCRIBE THE SITUATION IN DETAIL]

Constraints I am working within:
- [CONSTRAINT 1]
- [CONSTRAINT 2]

Think through this step by step. Consider the most important tradeoffs.
Then give me your recommendation and the 2-3 strongest reasons for it.
If there are important things I have not considered, tell me those too.
Be direct — I want your actual recommendation, not a list of options.`}</pre>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-paper)' }}>The same prompt techniques work across all models</h2>
            <p className="leading-relaxed mb-4">
              Role assignment, format specification, context, and constraints improve output in Claude, ChatGPT,
              and Gemini. The core principles of good prompting are model-agnostic. Claude handles them with
              more precision, but a well-structured prompt will outperform a vague one in any model.
            </p>
            <p className="leading-relaxed">
              Deepclario works with prompts for all three. Whether you are writing for Claude, ChatGPT, or
              Gemini, it will score your prompt, identify what is missing, and produce a rewritten version
              that any of them can run.
            </p>
          </section>

        </div>

        <div className="mt-16 rounded-2xl p-7" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
          <h2 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Improve a Claude prompt right now
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-paper-mute)' }}>
            Paste your prompt into Deepclario. It works with Claude, ChatGPT, and Gemini — scores it, asks what is missing, and rewrites it. Free.
          </p>
          <Link href="/playground" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] btn-paper transition-all" style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}>
            Try Deepclario free
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
          <p className="text-xs mb-3" style={{ color: 'var(--color-paper-mute)' }}>Related reading</p>
          <div className="flex flex-col gap-2">
            <Link href="/blog/how-to-get-better-results-from-chatgpt" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>How to get better results from ChatGPT →</Link>
            <Link href="/blog/prompt-engineering-examples" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>Prompt engineering examples with before and after →</Link>
            <Link href="/blog/what-is-prompt-engineering" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>What is prompt engineering? →</Link>
            <Link href="/prompts" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>Browse all free prompt templates →</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
