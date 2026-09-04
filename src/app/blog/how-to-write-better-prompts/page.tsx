import type { Metadata } from 'next'
import { getBlogPost } from '@/lib/blog-posts'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { PostFooter } from '@/components/blog/PostFooter'

export const metadata: Metadata = {
  title: 'How to Write Better AI Prompts - 7 Proven Techniques',
  description: 'Learn 7 practical techniques to write better prompts for ChatGPT, Claude, and Gemini. Includes real before/after examples and a free prompt analyzer to test your prompts.',
  alternates: { canonical: 'https://deepclario.com/blog/how-to-write-better-prompts' },
  openGraph: {
    title: 'How to Write Better AI Prompts - 7 Proven Techniques',
    description: '7 practical techniques to write prompts that get better results from any AI tool. Real examples included.',
    url: 'https://deepclario.com/blog/how-to-write-better-prompts',
    type: 'article',
  },
}

const post = getBlogPost('how-to-write-better-prompts')

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Write Better AI Prompts - 7 Proven Techniques',
  description: '7 practical, proven techniques to write better prompts for ChatGPT, Claude, and Gemini.',
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
      name: 'How do I write better AI prompts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Write better AI prompts by assigning a role, specifying the output format, providing context about your situation, adding constraints (word count, tone, what to avoid), and giving an example of good output when possible. Each of these elements removes ambiguity the AI would otherwise fill in with generic defaults.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between a good and bad AI prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A bad prompt is a one-liner with no context, no role, and no format instruction. A good prompt specifies who the AI should be, what exactly you need, what format the output should take, and what the output will be used for. The difference in output quality is dramatic.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does prompt quality matter more than which AI model you use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, in most cases. A well-written prompt in ChatGPT 4o will outperform a vague prompt in any model. The model sets the ceiling; your prompt determines how close to that ceiling you get.',
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
    { '@type': 'ListItem', position: 3, name: 'How to Write Better AI Prompts', item: 'https://deepclario.com/blog/how-to-write-better-prompts' },
  ],
}

const TIPS = [
  {
    n: '1. Assign a role first',
    bad: 'Explain neural networks',
    good: 'Act as a computer science professor teaching first-year students. Explain how neural networks learn using a simple analogy, then give one real-world application.',
    why: 'Role assignment activates relevant knowledge and sets the right expertise level. Without it, the AI uses a default, generic voice.',
  },
  {
    n: '2. Specify the format',
    bad: 'List the pros and cons of remote work',
    good: 'List the top 5 pros and top 5 cons of remote work in a markdown table. Each point should be one sentence. Target audience: HR managers.',
    why: 'Without format instructions, AI decides for you - and its choice rarely matches your actual use case.',
  },
  {
    n: '3. Define your audience',
    bad: 'Explain blockchain',
    good: 'Explain blockchain to a 60-year-old small business owner with no technical background. Use simple language, one real analogy, and avoid all jargon.',
    why: 'The same topic needs to be explained differently to different audiences. Specifying it eliminates the AI\'s most common failure: wrong level of complexity.',
  },
  {
    n: '4. Give an example of what you want',
    bad: 'Write a product description for my software',
    good: 'Write a product description for my project management software. Example of the style I want: "Notion brings your notes, tasks, and docs into one connected workspace - so your team always knows what\'s happening." Match that tone and length.',
    why: 'One well-chosen example is worth a paragraph of instructions. It shows rather than tells.',
  },
  {
    n: '5. Add explicit constraints',
    bad: 'Write a tweet about our product launch',
    good: 'Write 3 tweet options for our product launch. Max 240 characters each. No hashtags. Tone: confident but not salesy. Focus on the time-saving benefit, not features.',
    why: 'Constraints prevent the most common failure modes: too long, wrong tone, wrong focus, or inappropriate style.',
  },
  {
    n: '6. State what NOT to do',
    bad: 'Give me advice on investing',
    good: 'Give me 5 evidence-based personal finance principles for someone in their 30s. Do not recommend specific stocks or funds. Do not give legal or tax advice. Do not use financial jargon without explaining it.',
    why: 'Negative constraints are often more powerful than positive ones - they rule out the most common wrong answers.',
  },
  {
    n: '7. Break complex tasks into steps',
    bad: 'Write a marketing strategy for my app',
    good: 'Step 1: Identify the top 3 target user segments for a productivity app targeting remote workers. Step 2: For each segment, suggest one acquisition channel and one message angle. Step 3: Recommend the single highest-priority channel to start with and explain why.',
    why: 'Multi-step tasks overwhelm a single prompt. Breaking them into steps keeps each output focused and useful.',
  },
]

export default function HowToWriteBetterPromptsPage() {
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
            <span className="text-xs text-[color:var(--color-paper-mute)]">· 10 min read</span>
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight">
            How to Write Better AI Prompts
          </h1>
          <p className="text-xs text-[color:var(--color-paper-mute)] mb-6">Works with ChatGPT, Claude, Gemini, and any other LLM</p>

          <p className="text-lg text-[color:var(--color-paper-mute)] mb-10 leading-relaxed">
            Most people write prompts the way they send text messages - casual, short, and vague.
            That works for humans who can ask follow-up questions. AI can&apos;t. These 7 techniques
            will immediately make your prompts more effective across any AI tool.
          </p>

          <div className="space-y-10">
            {TIPS.map((tip) => (
              <section key={tip.n}>
                <h2 className="text-xl font-bold text-[color:var(--color-paper)] mb-4">{tip.n}</h2>
                <div className="grid gap-3 mb-4">
                  <div className="p-4 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                    <p className="text-[10px] text-[#C25E5E] font-semibold uppercase tracking-wider mb-2">Before</p>
                    <p className="text-sm text-[color:var(--color-paper-mute)] italic">&ldquo;{tip.bad}&rdquo;</p>
                  </div>
                  <div className="p-4 bg-[color:var(--color-ink-card)] rounded-xl border border-[color:var(--color-rule-strong)]">
                    <p className="text-[10px] text-[color:var(--color-paper)] font-semibold uppercase tracking-wider mb-2">After</p>
                    <p className="text-sm text-[color:var(--color-paper)]">&ldquo;{tip.good}&rdquo;</p>
                  </div>
                </div>
                <div className="flex gap-2 p-3 rounded-lg bg-[color:var(--color-ink-card)] border border-[color:var(--color-rule-strong)]">
                  <span className="text-[color:var(--color-paper)] text-xs shrink-0 mt-0.5">Why it works:</span>
                  <p className="text-xs text-[color:var(--color-paper-mute)] leading-relaxed">{tip.why}</p>
                </div>
              </section>
            ))}
          </div>

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-4">The fastest way to improve: get scored</h2>
            <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
              Reading about prompt techniques is useful. Applying them to your actual prompts is better.
              Deepclario scores your prompt against all 5 quality dimensions and rewrites it for you - so
              you can see exactly what changed and why.
            </p>
            <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
              Try it on any prompt you&apos;re currently using. Free, no account required.
            </p>
          </section>

          <div className="mt-10 rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Test these techniques on your own prompt</h2>
            <p className="text-[color:var(--color-paper-mute)] text-sm mb-6">Paste any prompt and see exactly how to improve it. Free.</p>
            <Link href="/prompt-improver" className="inline-block px-6 py-3 rounded-2xl btn-brand font-semibold transition-all">
              Analyze my prompt →
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
            <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Related reading</p>
            <div className="flex flex-col gap-2">
              <Link href="/blog/what-is-prompt-engineering" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                What is prompt engineering? →
              </Link>
              <Link href="/prompt-improver" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Try the prompt improver →
              </Link>
              <Link href="/prompts/chatgpt-email-writing" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Free prompt: write any email with ChatGPT →
              </Link>
              <Link href="/prompts/chatgpt-marketing-copy" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Free prompt: write marketing copy →
              </Link>
              <Link href="/prompts" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
                Browse all free prompts →
              </Link>
            </div>
          </div>
          <PostFooter slug="how-to-write-better-prompts" />
        </main>
      </div>
    </>
  )
}
