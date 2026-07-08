/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'ChatGPT System Prompt Examples - What They Are and How to Use Them',
  description: 'What ChatGPT system prompts are, how they work, and real examples you can use to customize ChatGPT\'s behavior for writing, coding, analysis, and more.',
  alternates: { canonical: 'https://deepclario.com/blog/chatgpt-system-prompt-examples' },
  openGraph: {
    title: 'ChatGPT System Prompt Examples',
    description: 'Real ChatGPT system prompt examples for writing, coding, analysis, and customer support - plus how to set them up.',
    url: 'https://deepclario.com/blog/chatgpt-system-prompt-examples',
    type: 'article',
  },
}

const post = getBlogPost('chatgpt-system-prompt-examples')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'ChatGPT System Prompt Examples',
  description: 'What system prompts are, how they work, and real examples for common use cases.',
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
      name: 'What is a ChatGPT system prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A system prompt is a set of instructions that runs before the conversation starts, shaping how ChatGPT behaves throughout the session. It can define a persona, set behavioral rules, restrict topics, specify tone, and establish context. In the ChatGPT interface, this is the "Custom Instructions" feature. In the API, it is the system message in the messages array.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I add a system prompt in ChatGPT?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'In ChatGPT, go to Settings and find "Custom Instructions." This has two fields: one for background about yourself, and one for how you want ChatGPT to respond. The second field is effectively your system prompt. If you are using the OpenAI API, pass your system prompt as a message with role "system" before the user messages.',
      },
    },
    {
      '@type': 'Question',
      name: 'What should a good system prompt include?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A good system prompt includes: the role or persona to adopt, the audience or user to assume, the tone and voice to use, any topics or behaviors to avoid, and any persistent context that applies to all responses. The goal is to remove the things you would otherwise have to specify in every individual prompt.',
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
    { '@type': 'ListItem', position: 3, name: 'ChatGPT System Prompt Examples', item: 'https://deepclario.com/blog/chatgpt-system-prompt-examples' },
  ],
}

const EXAMPLES = [
  {
    title: 'Writing assistant with a specific voice',
    use: 'For anyone who uses ChatGPT regularly for writing and wants consistent output.',
    prompt: `You are a professional editor and writing coach with 15 years of experience in business and technology writing.

When helping with writing tasks:
- Prioritize clarity and specificity over length
- Use active voice. Flag passive voice when you see it.
- Avoid corporate clichés: "synergy", "leverage", "best-in-class", "thought leader"
- Do not use em dashes mid-sentence
- Suggest a concrete improvement rather than just identifying a problem
- If asked to rewrite something, produce the rewrite - do not describe what you would change

Always ask: does this serve the reader, or does it serve the writer's ego?`,
  },
  {
    title: 'Senior software engineer code reviewer',
    use: 'For developers who want consistent, opinionated code review.',
    prompt: `You are a senior software engineer with 12 years of experience across backend systems, APIs, and developer tooling.

When reviewing code:
- Be direct about problems. Do not soften feedback with "you might consider."
- Prioritize: security issues first, then correctness, then performance, then style
- Explain why something is a problem, not just that it is
- Suggest the fix, not just the problem
- If something is a matter of preference rather than quality, say so
- If the code is genuinely good, say that - do not invent issues

When writing code:
- Prefer simple over clever
- Add a comment only when the why is non-obvious
- Return types should always be explicit`,
  },
  {
    title: 'Research assistant with strict sourcing',
    use: 'For research tasks where accuracy matters more than speed.',
    prompt: `You are a careful research assistant. Your primary obligation is accuracy.

Rules you always follow:
- If you are not certain about a fact, say so explicitly before stating it
- Never present a plausible-sounding answer as fact if you are not confident
- Distinguish between things you know with high confidence and things you are inferring
- If a question requires up-to-date data you cannot verify, say so
- Do not pad responses with obvious or loosely related information
- Cite the type of source you are drawing from when relevant (e.g., "this is widely documented" vs. "I'm inferring from general principles")

Brevity is a virtue. A short, accurate answer is better than a long, uncertain one.`,
  },
  {
    title: 'Business strategist for decision support',
    use: 'For founders and managers who want a thinking partner for business decisions.',
    prompt: `You are an experienced business strategist and executive advisor.

When I bring you a business decision or problem:
- Ask clarifying questions if the situation is unclear before giving advice
- Identify the most important assumptions underlying my thinking
- Offer a recommendation, not just a list of options
- Tell me what you would do if you were in my position, and why
- Identify the biggest risk in my plan that I may not have considered
- Be direct. I do not need diplomatic softening - I need accurate analysis.

You are a trusted advisor, not a consultant trying to seem comprehensive.`,
  },
]

export default function ChatGPTSystemPromptExamplesPage() {
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
          <span>ChatGPT system prompt examples</span>
        </nav>

        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-paper)' }}>Guide</span>
          <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>· 7 min read</span>
        </div>

        <h1 className="text-4xl font-bold mb-5 leading-tight" style={{ color: 'var(--color-paper)' }}>
          ChatGPT system prompt examples
        </h1>
        <p className="text-lg leading-relaxed mb-6" style={{ color: 'var(--color-paper-mute)' }}>
          A system prompt runs before every conversation and shapes how ChatGPT behaves throughout the session.
          Think of it as a standing brief you give the AI once, so you do not have to repeat yourself in every prompt.
        </p>
        <p className="text-lg leading-relaxed mb-12" style={{ color: 'var(--color-paper-mute)' }}>
          Here are four system prompts you can use today - each built for a specific type of work, with an explanation of what each instruction does.
        </p>

        <div className="space-y-14">
          {EXAMPLES.map((ex, i) => (
            <section key={i}>
              <div className="flex items-start gap-3 mb-3">
                <span className="font-serif text-2xl tabular-nums pt-0.5" style={{ color: 'var(--color-paper-mute)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--color-paper)' }}>{ex.title}</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-paper-mute)' }}>{ex.use}</p>
                </div>
              </div>
              <pre className="rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)', color: 'var(--color-paper)', fontFamily: 'ui-monospace, monospace' }}>
                {ex.prompt}
              </pre>
            </section>
          ))}
        </div>

        <section className="mt-14 space-y-4" style={{ color: 'var(--color-paper-mute)' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-paper)' }}>How to set a system prompt in ChatGPT</h2>
          <p className="leading-relaxed">
            In ChatGPT, go to <strong style={{ color: 'var(--color-paper)' }}>Settings → Personalization → Custom Instructions</strong>.
            The "How would you like ChatGPT to respond?" field is your system prompt. Paste one of the examples above, edit it to match your needs, and save.
          </p>
          <p className="leading-relaxed">
            If you are using the API, pass it as the first message with <code className="text-sm px-1.5 py-0.5 rounded" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}>role: "system"</code> before your user messages.
          </p>
          <p className="leading-relaxed">
            System prompts are not magic - they are just persistent instructions. The same principles that make
            a good user prompt (role, format, constraints, context) make a good system prompt. The difference
            is that a system prompt applies to every message in the session.
          </p>
        </section>

        <div className="mt-16 rounded-2xl p-7" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
          <h2 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Want help writing your own system prompt?
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-paper-mute)' }}>
            Deepclario works on system prompts too. Paste yours in, and it will score what is missing and rewrite it to be more precise.
          </p>
          <Link href="/playground" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] btn-paper transition-all" style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}>
            Improve my prompt free
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
          <p className="text-xs mb-3" style={{ color: 'var(--color-paper-mute)' }}>Related reading</p>
          <div className="flex flex-col gap-2">
            <Link href="/blog/ai-prompt-best-practices" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>AI prompt best practices →</Link>
            <Link href="/blog/how-to-get-better-results-from-chatgpt" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>How to get better results from ChatGPT →</Link>
            <Link href="/blog/chatgpt-prompt-tips" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>10 ChatGPT prompt tips that actually work →</Link>
            <Link href="/prompts" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>Browse all free prompt templates →</Link>
          </div>
        </div>
        <PostFooter slug="chatgpt-system-prompt-examples" />
      </main>
    </div>
  )
}
