import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: '10 ChatGPT Prompt Tips That Actually Work',
  description: 'Most ChatGPT users get mediocre results because their prompts are too vague. These 10 practical tips will immediately improve what you get back - with real before and after examples.',
  alternates: { canonical: 'https://deepclario.com/blog/chatgpt-prompt-tips' },
  openGraph: {
    title: '10 ChatGPT Prompt Tips That Actually Work',
    description: 'Practical prompt techniques for ChatGPT with real before and after examples.',
    url: 'https://deepclario.com/blog/chatgpt-prompt-tips',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '10 ChatGPT Prompt Tips That Actually Work',
  description: 'Practical tips for writing better ChatGPT prompts with real examples.',
  author: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  publisher: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  datePublished: '2026-04-01',
  dateModified: '2026-04-29',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://deepclario.com/blog/chatgpt-prompt-tips' },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What makes a good ChatGPT prompt?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A good ChatGPT prompt includes a role (who the AI should be), a specific task with clear constraints, the desired output format, and enough context for the AI to understand the situation. Vague one-liners consistently produce generic output.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why does ChatGPT give bad answers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most bad ChatGPT answers are caused by a bad prompt, not a bad model. The AI can only work with what you give it. Missing context, no format instructions, and no assigned role are the three most common causes of poor output.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I get ChatGPT to stop giving generic answers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Add specificity: assign a role ("act as a senior copywriter"), define the audience, specify the format (bullet list, table, paragraph), and give constraints (word count, tone, things to avoid). The more precise the prompt, the less generic the output.',
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
    { '@type': 'ListItem', position: 3, name: '10 ChatGPT Prompt Tips', item: 'https://deepclario.com/blog/chatgpt-prompt-tips' },
  ],
}

const TIPS = [
  {
    n: '1. Give ChatGPT a role',
    bad: 'Explain machine learning',
    good: 'Act as a data scientist explaining machine learning to a product manager with no technical background. Use plain language and one concrete analogy.',
    why: 'A role anchors the response. Without one, ChatGPT defaults to a generic encyclopedic tone that rarely matches what you need.',
  },
  {
    n: '2. Specify the output format',
    bad: 'List ways to improve our onboarding',
    good: 'List 5 ways to improve our SaaS onboarding. Format as: [Problem] → [Fix] → [Expected result]. Keep each row under 30 words.',
    why: 'If you don\'t specify format, you get prose. Prose is hard to act on. A structured format forces the model to be specific.',
  },
  {
    n: '3. Set a word or length limit',
    bad: 'Write a summary of this article',
    good: 'Summarize this article in exactly 3 sentences. Each sentence should cover: (1) what the study measured, (2) what it found, (3) what it means for practitioners.',
    why: 'Unbounded prompts get padding. A hard limit forces prioritization and cuts fluff.',
  },
  {
    n: '4. Provide context about your audience',
    bad: 'Write a product description for our software',
    good: 'Write a product description for our project management software. The audience is solo freelancers aged 25–40 who are overwhelmed by client work. Tone: calm, direct, no corporate speak.',
    why: 'ChatGPT writes for a ghost audience unless you specify one. Define who will read the output.',
  },
  {
    n: '5. Show an example of what you want',
    bad: 'Write a tweet about our new feature',
    good: 'Write a tweet about our new feature. Style example: "We just shipped something we\'ve been building for 3 months. It\'s small. It will save you an hour a week. Check it out →" - match that casual, direct tone.',
    why: 'One example is worth a thousand adjectives. It removes ambiguity about tone, length, and style instantly.',
  },
  {
    n: '6. Tell it what to avoid',
    bad: 'Write an email asking for a meeting',
    good: 'Write a short email requesting a 20-minute call with a potential investor. Do not use phrases like "I hope this finds you well", "synergy", or "quick call". Keep it under 100 words.',
    why: 'Exclusions are as powerful as inclusions. If there\'s a cliché or format you hate, ban it explicitly.',
  },
  {
    n: '7. Ask it to think step by step',
    bad: 'Should I raise prices for my SaaS?',
    good: 'Think step by step: what are the key factors I should consider before raising prices for a B2B SaaS with 200 paying customers? After the analysis, give me a clear recommendation.',
    why: 'Chain-of-thought prompting significantly improves reasoning quality on complex decisions. It forces the model to surface its logic before concluding.',
  },
  {
    n: '8. Separate the task from the constraints',
    bad: 'Write a blog intro about remote work that is engaging and not too long and mentions productivity',
    good: 'Task: Write an opening paragraph for a blog post about remote work.\nConstraints: Under 80 words. Lead with a surprising statistic. Mention productivity in the second sentence. No clichés.',
    why: 'Mixing task and constraints in one sentence creates confusion. Split them and you get cleaner, more predictable output.',
  },
  {
    n: '9. Iterate, don\'t restart',
    bad: '[Writes a whole new prompt from scratch]',
    good: '"The tone is right but the second paragraph is too long - cut it in half and add a concrete example where it ends."',
    why: 'Most people abandon a good response instead of refining it. A surgical follow-up prompt is almost always better than starting over.',
  },
  {
    n: '10. Test your prompt on a real task',
    bad: 'Assume the first response is good enough',
    good: 'Run the same prompt 3 times and compare. If the outputs vary wildly, your prompt is under-specified. If they\'re all mediocre, one of the dimensions - role, context, format - is missing.',
    why: 'Consistency is the signal. A well-structured prompt produces reliably good output, not occasionally good output.',
  },
]

export default function ChatGPTPromptTipsPage() {
  return (
    <div className="editorial grain min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Nav */}
      <MarketingNav current="blog" />

      <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10">
          <Link href="/blog/how-to-write-better-prompts" className="text-xs text-[color:var(--color-paper)] hover:opacity-70 transition-colors">
            ← More prompt guides
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-4 leading-tight">
            10 ChatGPT Prompt Tips That Actually Work
          </h1>
          <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
            Most ChatGPT users get mediocre results not because the model is bad - but because the prompt is
            too vague. These 10 techniques cover the most common gaps. Each one has a before/after example
            you can use immediately.
          </p>
        </div>

        <div className="space-y-12">
          {TIPS.map((tip) => (
            <div key={tip.n}>
              <h2 className="text-xl font-bold text-[color:var(--color-paper)] mb-4">{tip.n}</h2>

              <div className="grid md:grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-[color:var(--color-rule-strong)] bg-red-500/5 p-4">
                  <p className="text-xs font-semibold text-[#C25E5E] uppercase tracking-wider mb-2">Before</p>
                  <p className="text-sm text-[color:var(--color-paper-mute)] italic">&ldquo;{tip.bad}&rdquo;</p>
                </div>
                <div className="rounded-xl border border-[color:var(--color-rule-strong)] bg-emerald-500/5 p-4">
                  <p className="text-xs font-semibold text-[color:var(--color-paper)] uppercase tracking-wider mb-2">After</p>
                  <p className="text-sm text-[color:var(--color-paper)] leading-relaxed">{tip.good}</p>
                </div>
              </div>

              <p className="text-sm text-[color:var(--color-paper-mute)] leading-relaxed border-l-2 border-[color:var(--color-rule-strong)] pl-4">
                {tip.why}
              </p>
            </div>
          ))}
        </div>

        {/* Internal links */}
        <div className="mt-16 pt-8 border-t border-[color:var(--color-rule)] space-y-4">
          <h2 className="text-lg font-bold text-[color:var(--color-paper)]">Test these tips on your own prompts</h2>
          <p className="text-sm text-[color:var(--color-paper-mute)]">
            Paste any prompt into Deepclario and get a score across all 5 dimensions - goal clarity, context,
            format, constraints, and examples. See exactly which of these tips applies to your prompt, and get
            a rewritten version that scores higher.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/playground"
              className="inline-block px-5 py-2.5 rounded-xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] text-sm font-semibold transition-all"
            >
              Analyze my prompt →
            </Link>
            <Link
              href="/blog/how-to-write-better-prompts"
              className="inline-block px-5 py-2.5 rounded-xl border border-[color:var(--color-rule-strong)] text-[color:var(--color-paper-mute)] hover:text-[color:var(--color-paper)] hover:border-[#4a5a80] text-sm font-medium transition-all"
            >
              7 more prompt techniques →
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
          <p className="text-xs text-[color:var(--color-paper-mute)] mb-3">Free ready-to-use prompts</p>
          <div className="flex flex-col gap-2">
            <Link href="/prompts/chatgpt-email-writing" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Free prompt: write any email with ChatGPT →</Link>
            <Link href="/prompts/chatgpt-blog-post" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Free prompt: write a blog post →</Link>
            <Link href="/prompts/chatgpt-social-media-post" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Free prompt: write a social media post →</Link>
            <Link href="/prompts" className="text-sm text-[color:var(--color-paper)] hover:opacity-70 transition-colors">Browse all free prompts →</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
