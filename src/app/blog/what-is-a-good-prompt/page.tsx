import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'What Makes a Good AI Prompt? 5 Things Every Strong Prompt Has',
  description: 'A good AI prompt has 5 things: a clear goal, enough context, a specified format, defined constraints, and ideally an example. Learn what each one means and how to add them.',
  alternates: { canonical: 'https://deepclario.com/blog/what-is-a-good-prompt' },
  openGraph: {
    title: 'What Makes a Good AI Prompt? 5 Things Every Strong Prompt Has',
    description: 'Learn the 5 elements every good AI prompt needs - with examples and a free tool to score yours.',
    url: 'https://deepclario.com/blog/what-is-a-good-prompt',
  },
}

const post = getBlogPost('what-is-a-good-prompt')

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What Makes a Good AI Prompt? 5 Things Every Strong Prompt Has',
  description: 'A good AI prompt has 5 elements: goal clarity, context, format, constraints, and examples.',
  author: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  publisher: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  datePublished: post.datePublished,
  dateModified: post.dateModified,
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://deepclario.com/blog/what-is-a-good-prompt' },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What makes a good AI prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A good AI prompt has five elements: a clear goal (what output do you want), sufficient context (who is the audience, what is the situation), a format specification (list, paragraph, table), constraints (word count, tone, what to avoid), and ideally an example of the style you want. Missing any of these forces the AI to guess, which produces generic output.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long should an AI prompt be?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A prompt should be as long as it needs to be to remove ambiguity. For simple tasks, 2-3 sentences is often enough. For complex tasks like writing, analysis, or code, 5-10 lines with explicit instructions typically produces much better output than a single sentence. There is no penalty for being specific.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the most common mistake people make with AI prompts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The most common mistake is being too vague. Writing "write me a blog post about marketing" gives the AI no information about your audience, tone, length, structure, or angle. The more you specify, the less the AI has to guess, and the less editing you have to do afterward.',
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
    { '@type': 'ListItem', position: 3, name: 'What Makes a Good AI Prompt', item: 'https://deepclario.com/blog/what-is-a-good-prompt' },
  ],
}

const DIMENSIONS = [
  {
    n: 1,
    title: 'Goal clarity',
    slug: 'goal-clarity',
    weight: '20 points',
    question: 'Does the AI know exactly what you want?',
    weak: 'Help me with my email',
    strong: 'Rewrite this email to be more direct and cut the length by half. Keep the main ask in the first sentence.',
    tip: 'The test: could 10 different people read your prompt and imagine 10 different outputs? If yes, your goal is not clear enough.',
  },
  {
    n: 2,
    title: 'Context',
    slug: 'context',
    weight: '20 points',
    question: 'Does the AI have the background it needs?',
    weak: 'Write a bio for my website',
    strong: 'Write a professional bio for my personal website. I\'m a freelance UX designer, 6 years of experience, focused on fintech clients. I want to come across as approachable and credible, not corporate.',
    tip: 'Context is the who, what, and why. Without it, the AI writes for a hypothetical person who probably isn\'t you.',
  },
  {
    n: 3,
    title: 'Format',
    slug: 'format',
    weight: '20 points',
    question: 'Have you specified what the output should look like?',
    weak: 'Give me ideas for blog posts',
    strong: 'Give me 5 blog post ideas for a developer tools company. Format as a numbered list with: title, target reader, and one sentence on what makes it interesting.',
    tip: 'Format means: how many items, what structure, what length. If you don\'t specify, you\'ll get whatever the model defaults to - which is usually too long.',
  },
  {
    n: 4,
    title: 'Constraints',
    slug: 'constraints',
    weight: '20 points',
    question: 'Have you told the AI what to avoid or stay within?',
    weak: 'Write a tagline for my product',
    strong: 'Write 5 tagline options for a password manager aimed at families. Max 8 words each. Avoid fear-based messaging. Don\'t use the words "secure", "safe", or "protect".',
    tip: 'Constraints are what separates a useful prompt from an open-ended one. Banning specific words, setting length limits, or ruling out tones gives the AI less room to go wrong.',
  },
  {
    n: 5,
    title: 'Examples',
    slug: 'examples',
    weight: '20 points',
    question: 'Have you shown the AI what good looks like?',
    weak: 'Write a product update email in a friendly tone',
    strong: 'Write a product update email in a friendly tone. Here\'s an example of the style I want: "We just shipped something small that will save you 20 minutes a week. Here\'s what changed and why." Match the casual directness - no corporate language, no jargon.',
    tip: 'An example is the highest-value thing you can add to a prompt. It removes all ambiguity about tone, voice, and length in a single sentence.',
  },
]

export default function WhatIsAGoodPromptPage() {
  return (
    <div className="editorial grain min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Nav */}
      <MarketingNav current="blog" />

      <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10">
          <Link href="/blog/what-is-prompt-engineering" className="text-xs text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
            ← What is prompt engineering?
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-4 leading-tight">
            What Makes a Good AI Prompt? 5 Things Every Strong Prompt Has
          </h1>
          <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-3">
            A good prompt isn&apos;t about using magic words or following a rigid template. It&apos;s about giving
            the AI enough information to do exactly what you need - no more guessing, no more generic output.
          </p>
          <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
            Every prompt Deepclario analyzes is scored across 5 dimensions, each worth 20 points. Here&apos;s
            what each one means, why it matters, and how to add it to your prompts.
          </p>
        </div>

        {/* Score breakdown */}
        <div className="rounded-2xl border border-[color:var(--color-rule)] p-5 mb-12">
          <p className="text-xs font-semibold text-[color:var(--color-paper-mute)] uppercase tracking-wider mb-3">How prompts are scored (0–100)</p>
          <div className="space-y-2">
            {DIMENSIONS.map(d => (
              <div key={d.n} className="flex items-center gap-3">
                <span className="text-xs text-[color:var(--color-paper-mute)] w-32 shrink-0">{d.title}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[#1e2d4a]">
                  <div className="h-full rounded-full bg-[color:var(--color-paper)]" style={{ width: '20%' }} />
                </div>
                <span className="text-xs text-[color:var(--color-paper-mute)] w-16 text-right shrink-0">{d.weight}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-14">
          {DIMENSIONS.map((d) => (
            <div key={d.n} id={d.slug}>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-7 rounded-lg bg-[color:var(--color-paper)] flex items-center justify-center text-[color:var(--color-ink)] font-bold text-sm shrink-0">
                  {d.n}
                </span>
                <h2 className="text-xl font-bold text-[color:var(--color-paper)]">{d.title}</h2>
              </div>

              <p className="text-sm text-[color:var(--color-paper)] mb-4 font-medium">{d.question}</p>

              <div className="grid md:grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-[color:var(--color-rule-strong)] bg-red-500/5 p-4">
                  <p className="text-xs font-semibold text-[#C25E5E] uppercase tracking-wider mb-2">Missing this</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)] italic">&ldquo;{d.weak}&rdquo;</p>
                </div>
                <div className="rounded-xl border border-[color:var(--color-rule-strong)] bg-emerald-500/5 p-4">
                  <p className="text-xs font-semibold text-[color:var(--color-paper)] uppercase tracking-wider mb-2">With it</p>
                  <p className="text-sm text-[color:var(--color-paper)] leading-relaxed">{d.strong}</p>
                </div>
              </div>

              <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed border-l-2 border-[color:var(--color-rule-strong)] pl-4">
                {d.tip}
              </p>
            </div>
          ))}
        </div>

        {/* The 100-point prompt */}
        <div className="mt-14 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-6">
          <h2 className="text-lg font-bold text-[color:var(--color-paper)] mb-3">What a 100-point prompt looks like</h2>
          <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
            A perfect score means all 5 dimensions are fully covered. In practice, most prompts score between
            60–80 after one round of improvement. Here&apos;s an example that hits all 5:
          </p>
          <div className="rounded-xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-4">
            <p className="text-sm text-[color:var(--color-paper)] leading-relaxed">
              Act as a senior copywriter with experience in B2B SaaS marketing. Write a 3-paragraph case study
              introduction for a company that reduced customer churn by 40% using our analytics tool. Target
              reader: a VP of Customer Success at a 100–500 person SaaS company. Paragraph 1: the problem they
              faced. Paragraph 2: what they tried before and why it didn&apos;t work. Paragraph 3: how they
              discovered our tool. Avoid superlatives. Use concrete numbers. Do not mention the product name
              in the first paragraph.
            </p>
          </div>
          <p className="text-xs text-[color:var(--color-paper-mute)] mt-3">
            Role ✓ · Context ✓ · Format ✓ · Constraints ✓ · Implied example style ✓
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-[color:var(--color-rule)] space-y-4">
          <h2 className="text-lg font-bold text-[color:var(--color-paper)]">Score your own prompt</h2>
          <p className="text-sm text-[color:var(--color-paper-mute)]">
            Paste any prompt into Deepclario and see which of these 5 dimensions are missing.
            You&apos;ll get a score, a breakdown, and a rewritten version.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools/prompt-analyzer"
              className="inline-block px-5 py-2.5 rounded-xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] text-sm font-semibold transition-all"
            >
              Analyze my prompt →
            </Link>
            <Link
              href="/blog/prompt-engineering-examples"
              className="inline-block px-5 py-2.5 rounded-xl border border-[color:var(--color-rule-strong)] text-[color:var(--color-paper-mute)] hover:text-[color:var(--color-paper)] hover:border-[#4a5a80] text-sm font-medium transition-all"
            >
              See real examples →
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
          <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Free ready-to-use prompts</p>
          <div className="flex flex-col gap-2">
            <Link href="/prompts/chatgpt-cover-letter" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Free prompt: write a cover letter →</Link>
            <Link href="/prompts/chatgpt-business-plan" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Free prompt: write a business plan →</Link>
            <Link href="/prompts/chatgpt-code-review" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Free prompt: code review with ChatGPT →</Link>
            <Link href="/prompts" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Browse all free prompts →</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
