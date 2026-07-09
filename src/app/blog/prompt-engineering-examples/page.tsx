import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'Prompt Engineering Examples - Real Before and After Prompts',
  description: 'Real prompt engineering examples across writing, coding, research, and marketing. See how a weak prompt becomes a strong one - and what score each version gets.',
  alternates: { canonical: 'https://deepclario.com/blog/prompt-engineering-examples' },
  openGraph: {
    title: 'Prompt Engineering Examples - Real Before and After Prompts',
    description: 'Real before and after prompt examples across writing, coding, research, and marketing.',
    url: 'https://deepclario.com/blog/prompt-engineering-examples',
  },
}

const post = getBlogPost('prompt-engineering-examples')

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Prompt Engineering Examples - Real Before and After Prompts',
  description: 'Real prompt engineering examples with before and after comparisons across multiple use cases.',
  author: { '@type': 'Person', name: 'Art Shllaku', url: 'https://deepclario.com' },
  publisher: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  datePublished: post.datePublished,
  dateModified: post.dateModified,
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://deepclario.com/blog/prompt-engineering-examples' },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a prompt engineering example?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A prompt engineering example shows the difference between a vague prompt and a well-structured one for the same task. For instance, instead of "write an email", a strong prompt specifies the recipient, the goal, the tone, and the desired length. The improved version consistently produces output that requires little or no editing.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are the most important prompt engineering techniques?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The most impactful techniques are: role prompting (assigning the AI an expert identity), few-shot examples (showing the format you want), chain-of-thought (asking the AI to reason step by step), and constraint setting (specifying word count, tone, and what to avoid). These four account for most of the improvement you can get from better prompts.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can prompt engineering work for non-technical users?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Prompt engineering does not require coding or technical knowledge. The core techniques are patterns any writer or professional can learn in under an hour. Assigning a role, specifying a format, and adding context are skills, not technical abilities.',
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
    { '@type': 'ListItem', position: 3, name: 'Prompt Engineering Examples', item: 'https://deepclario.com/blog/prompt-engineering-examples' },
  ],
}

const EXAMPLES = [
  {
    category: 'Writing',
    before: { prompt: 'Write a product description', score: 14 },
    after: {
      prompt: 'Write a product description for a $49/month project management tool aimed at freelance designers. The key benefit: it replaces 4 separate apps. Tone: confident and concise. Length: 3 sentences max. Avoid corporate jargon.',
      score: 92,
      tags: ['+Role/Audience', '+Context', '+Constraints', '+Format'],
    },
    lesson: 'The original prompt has no audience, no product details, no tone guidance, and no length limit. Every one of those gaps gives the AI room to guess wrong.',
  },
  {
    category: 'Coding',
    before: { prompt: 'Write a login function', score: 11 },
    after: {
      prompt: 'Act as a senior Node.js developer. Write a login function using Express and bcrypt that: (1) accepts email and password, (2) checks against a PostgreSQL users table, (3) returns a signed JWT on success, (4) returns a 401 with a generic error message on failure to avoid user enumeration. Add inline comments explaining the security decisions.',
      score: 96,
      tags: ['+Role', '+Stack', '+Requirements', '+Security context'],
    },
    lesson: 'Coding prompts fail when they lack the stack, the security requirements, and the output format. A junior developer\'s prompt and a senior developer\'s prompt look completely different.',
  },
  {
    category: 'Research',
    before: { prompt: 'Summarize this paper for me', score: 9 },
    after: {
      prompt: 'Summarize this research paper in 3 clearly labeled sections: (1) Core hypothesis in one sentence, (2) Methodology in 2–3 sentences - what they measured and how, (3) Key finding and its practical implication for clinicians. Target reader: a hospital administrator with no research background.',
      score: 91,
      tags: ['+Structure', '+Audience', '+Format', '+Depth'],
    },
    lesson: 'A summary without a target audience is summaries for no one. Defining who will read it changes what gets included and what gets cut.',
  },
  {
    category: 'Marketing',
    before: { prompt: 'Write a cold email', score: 16 },
    after: {
      prompt: 'Write a cold outreach email to a VP of Engineering at a 50–200 person SaaS company. Goal: get a 20-minute call to demo our code review tool. Their pain point: PRs are taking 3+ days to get reviewed. Keep the email under 100 words. No "I hope this finds you well." End with one specific question, not a generic CTA.',
      score: 89,
      tags: ['+Role/Target', '+Context', '+Pain point', '+Constraints'],
    },
    lesson: '"Cold email" means nothing to an AI. Define the recipient, the goal, the pain point, the length limit, and what to avoid - and the output is actually usable.',
  },
  {
    category: 'Analysis',
    before: { prompt: 'Analyze my business idea', score: 8 },
    after: {
      prompt: 'Act as a venture capitalist who has evaluated 500+ B2B SaaS companies. Analyze this business idea: [idea]. Structure your response as: (1) Market size estimate, (2) Top 3 risks, (3) Who the likely first 100 customers are, (4) One question you would ask before investing. Be direct and critical - don\'t soften feedback.',
      score: 94,
      tags: ['+Role', '+Structure', '+Tone', '+Specificity'],
    },
    lesson: 'Open-ended analysis prompts produce open-ended answers. A structured output format with a critical role forces the model to take a position.',
  },
  {
    category: 'Education',
    before: { prompt: 'Explain quantum computing', score: 12 },
    after: {
      prompt: 'Explain quantum computing to a 16-year-old who understands basic algebra but has never studied physics. Use one analogy involving everyday objects. Limit the explanation to 4 paragraphs. End with one question that would help them think deeper about the topic.',
      score: 88,
      tags: ['+Audience', '+Analogy instruction', '+Format', '+Engagement'],
    },
    lesson: '"Explain X" is one of the most common prompts and one of the least effective. It produces textbook-level output. Specifying the audience and asking for an analogy transforms the response.',
  },
]

export default function PromptEngineeringExamplesPage() {
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
            Prompt Engineering Examples - Real Before and After Prompts
          </h1>
          <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-3">
            The fastest way to learn prompt engineering is to see exactly what changes between a weak prompt
            and a strong one. Below are 6 real examples across different use cases - each with a clarity score,
            the specific improvements made, and the reasoning behind them.
          </p>
          <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
            Scores are generated by <Link href="/tools/prompt-analyzer" className="text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Deepclario&apos;s prompt analyzer</Link> - rated
            across goal clarity, context, format, constraints, and examples.
          </p>
        </div>

        <div className="space-y-14">
          {EXAMPLES.map((ex) => (
            <div key={ex.category}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-bold text-[color:var(--color-paper)] uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[color:var(--color-ink-card)] border border-[color:var(--color-rule-strong)]">
                  {ex.category}
                </span>
                <div className="flex items-center gap-2 text-xs text-[color:var(--color-paper-mute)]">
                  <span className="text-[#C25E5E] font-bold">{ex.before.score}/100</span>
                  <span>→</span>
                  <span className="text-[color:var(--color-paper)] font-bold">{ex.after.score}/100</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="rounded-xl border border-[color:var(--color-rule-strong)] bg-red-500/5 p-4">
                  <p className="text-xs font-semibold text-[#C25E5E] uppercase tracking-wider mb-2">Weak prompt</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)] italic">&ldquo;{ex.before.prompt}&rdquo;</p>
                </div>
                <div className="rounded-xl border border-[color:var(--color-rule-strong)] bg-emerald-500/5 p-4">
                  <p className="text-xs font-semibold text-[color:var(--color-paper)] uppercase tracking-wider mb-2">Strong prompt</p>
                  <p className="text-sm text-[color:var(--color-paper)] leading-relaxed">{ex.after.prompt}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {ex.after.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-[color:var(--color-ink-card)] border border-[color:var(--color-rule-strong)] text-[color:var(--color-paper)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed border-l-2 border-[color:var(--color-rule-strong)] pl-4">
                {ex.lesson}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-[color:var(--color-rule)] space-y-4">
          <h2 className="text-lg font-bold text-[color:var(--color-paper)]">Analyze your own prompts</h2>
          <p className="text-sm text-[color:var(--color-paper-mute)]">
            Paste any prompt and see exactly which dimensions are weak - and get a rewritten version that
            scores higher. Free to try, no account needed.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/playground"
              className="inline-block px-5 py-2.5 rounded-xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] text-sm font-semibold transition-all"
            >
              Open the playground →
            </Link>
            <Link
              href="/blog/chatgpt-prompt-tips"
              className="inline-block px-5 py-2.5 rounded-xl border border-[color:var(--color-rule-strong)] text-[color:var(--color-paper-mute)] hover:text-[color:var(--color-paper)] hover:border-[#4a5a80] text-sm font-medium transition-all"
            >
              10 more ChatGPT tips →
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
          <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Free ready-to-use prompts</p>
          <div className="flex flex-col gap-2">
            <Link href="/prompts/chatgpt-summarize-article" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Free prompt: summarize any article →</Link>
            <Link href="/prompts/chatgpt-marketing-copy" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Free prompt: write marketing copy →</Link>
            <Link href="/prompts/chatgpt-swot-analysis" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Free prompt: run a SWOT analysis →</Link>
            <Link href="/prompts" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Browse all free prompts →</Link>
          </div>
        </div>
        <PostFooter slug="prompt-engineering-examples" />
      </main>
    </div>
  )
}
