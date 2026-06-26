import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'How to Get Better Results from ChatGPT - 8 Techniques',
  description: 'Getting better results from ChatGPT is mostly about how you prompt it. These 8 techniques fix the most common reasons people get mediocre output - with real examples.',
  alternates: { canonical: 'https://deepclario.com/blog/how-to-get-better-results-from-chatgpt' },
  openGraph: {
    title: 'How to Get Better Results from ChatGPT',
    description: '8 techniques that fix the most common reasons people get mediocre ChatGPT output.',
    url: 'https://deepclario.com/blog/how-to-get-better-results-from-chatgpt',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Get Better Results from ChatGPT',
  description: '8 techniques that fix the most common reasons people get mediocre ChatGPT output.',
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
      name: 'Why does ChatGPT keep giving me bad answers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'In most cases, the issue is the prompt rather than the model. The most common causes are: the prompt is too vague (no context, no format, no constraints), the task is too broad (asking for too much in one go), or key information is missing (the AI has to guess what you actually need). Fixing the prompt almost always fixes the output.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I make ChatGPT give more detailed answers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ask for detail explicitly. "Give me a detailed explanation" helps, but "explain each step in at least 3 sentences and include a concrete example for each" is better. You can also ask ChatGPT to expand a section after the fact: "Expand on point 3 with more specific detail."',
      },
    },
    {
      '@type': 'Question',
      name: 'Does GPT-4o give better results than ChatGPT free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'GPT-4o is more capable, especially for reasoning, nuanced writing, and complex tasks. But a well-written prompt in the free version will outperform a vague prompt in GPT-4o for most tasks. The prompt matters more than the model tier for most everyday use cases.',
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
    { '@type': 'ListItem', position: 3, name: 'How to Get Better Results from ChatGPT', item: 'https://deepclario.com/blog/how-to-get-better-results-from-chatgpt' },
  ],
}

const TECHNIQUES = [
  {
    title: 'Tell it who to be',
    body: 'Starting with "Act as a [role]" is not just a trick - it shifts the model\'s entire frame. "Act as a senior software engineer" produces different code explanations than no role. "Act as a skeptical editor" produces harsher, more useful feedback on your writing. The role sets the vocabulary, the level of detail, and the assumptions.',
    example: { bad: 'Review my code.', good: 'Act as a senior backend engineer doing a code review. Review the code below for security issues, performance problems, and readability. Be direct and specific about what needs to change and why.' },
  },
  {
    title: 'Specify the format before you ask',
    body: 'If you don\'t say what format you want, ChatGPT decides for you - and its default is often prose when you need bullets, or bullets when you need prose. State the format upfront: "Give me a numbered list", "Format as a table with columns X, Y, Z", "Write 3 short paragraphs, no headers."',
    example: { bad: 'What are the pros and cons of remote work?', good: 'List the top 5 pros and top 5 cons of remote work in a markdown table. Each cell should be one sentence. Target audience: a CEO deciding whether to go fully remote.' },
  },
  {
    title: 'Give it the context it cannot guess',
    body: 'ChatGPT knows nothing about your situation unless you tell it. Who is the audience? What has already been tried? What decision will this output inform? What constraints exist? Every piece of context you add removes a guess it has to make, and guesses are where generic output comes from.',
    example: { bad: 'Write a product description for my app.', good: 'Write a product description for Deepclario - an AI prompt analyzer. Target audience: marketing professionals who use ChatGPT daily but are frustrated with inconsistent results. Key differentiator: it asks clarifying questions before rewriting, so the output is tailored, not generic. Tone: confident and direct. Length: 80 words max.' },
  },
  {
    title: 'Add negative constraints',
    body: 'Telling ChatGPT what NOT to do is as powerful as telling it what to do. Common useful negatives: "No bullet points", "Don\'t use corporate jargon", "Don\'t hedge with phrases like \'it\'s worth noting\'", "Don\'t repeat the question back to me", "No more than 200 words."',
    example: { bad: 'Write an executive summary.', good: 'Write an executive summary of the report below. Max 150 words. No bullet points - prose only. Do not start with "This report..." Start with the most important finding.' },
  },
  {
    title: 'Ask for multiple variations',
    body: 'Instead of asking for one version and editing it to death, ask for 3-5 variations upfront. "Give me 5 subject line options for this email" or "Write 3 versions of this headline - one formal, one casual, one provocative." You will almost always find one that is close to what you want, or combine the best parts.',
    example: { bad: 'Write a subject line for my cold email.', good: 'Write 5 subject line options for a cold email selling a B2B SaaS tool to heads of marketing. The tool saves 3 hours per week on reporting. Vary the angle: curiosity, benefit, social proof, question, and directness - one of each.' },
  },
  {
    title: 'Use chain-of-thought for hard problems',
    body: 'For complex reasoning tasks, adding "think step by step" or "reason through this before giving your final answer" dramatically improves accuracy. It forces the model to work through the problem rather than pattern-matching to a surface-level answer.',
    example: { bad: 'Should I raise prices?', good: 'I run a SaaS with 200 customers paying $49/mo. My churn is 3%/mo. My main competitor charges $79/mo. Think step by step: what factors should I consider before raising prices, and what would you recommend, and why?' },
  },
  {
    title: 'Iterate instead of starting over',
    body: 'The first output is a draft, not a failure. Follow up with specific refinements: "The third paragraph is too long - cut it in half", "The tone is too formal - rewrite in a more conversational voice", "This is good but I need it to be more specific about X." Each follow-up teaches ChatGPT more about what you want.',
    example: { bad: '[starts a new chat and tries again]', good: '"This is good but the opening is too generic. Rewrite just the first paragraph to start with a specific, surprising fact about the problem instead."' },
  },
  {
    title: 'Show an example of what good looks like',
    body: 'If you have an example of output you like - a previous email, a competitor\'s copy, a paragraph you wrote - paste it in. "Write something like this:" followed by your example is one of the most powerful prompt techniques. The model will match the structure, rhythm, and tone far more accurately than any description.',
    example: { bad: 'Write a bio for my LinkedIn.', good: 'Write a LinkedIn bio for me in the style of this example: [paste in a bio you admire]. My details: [your actual details]. Match the tone and structure but make it specific to my background.' },
  },
]

export default function HowToGetBetterResultsFromChatGPTPage() {
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
          <span>How to get better results from ChatGPT</span>
        </nav>

        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-paper)' }}>Techniques</span>
          <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>· 8 min read</span>
        </div>

        <h1 className="text-4xl font-bold mb-5 leading-tight" style={{ color: 'var(--color-paper)' }}>
          How to get better results from ChatGPT
        </h1>
        <p className="text-lg leading-relaxed mb-12" style={{ color: 'var(--color-paper-mute)' }}>
          The model is not the problem. If you keep getting vague, generic, or wrong answers from ChatGPT,
          the fix is almost always in the prompt. These 8 techniques address the most common reasons
          prompts fail.
        </p>

        <ol className="space-y-px">
          <li className="rule-strong" />
          {TECHNIQUES.map((t, i) => (
            <li key={i}>
              <div className="grid grid-cols-12 gap-4 py-8">
                <span className="col-span-1 font-serif text-2xl tabular-nums" style={{ color: 'var(--color-paper-mute)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="col-span-11 space-y-4">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--color-paper)' }}>{t.title}</h2>
                  <p className="leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>{t.body}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.15)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,100,100,0.7)' }}>Weak</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>{t.example.bad}</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: 'rgba(50,200,100,0.06)', border: '1px solid rgba(50,200,100,0.15)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(50,200,100,0.7)' }}>Strong</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>{t.example.good}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rule" />
            </li>
          ))}
        </ol>

        <div className="mt-16 rounded-2xl p-7" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
          <h2 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            See exactly what your prompt is missing
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-paper-mute)' }}>
            Deepclario scores your prompt across five dimensions, tells you which of these techniques apply,
            and rewrites it for you. Free, no account needed.
          </p>
          <Link href="/playground" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] btn-paper transition-all" style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}>
            Analyze my prompt free
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
          <p className="text-xs mb-3" style={{ color: 'var(--color-paper-mute)' }}>Related reading</p>
          <div className="flex flex-col gap-2">
            <Link href="/blog/chatgpt-prompt-tips" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>10 ChatGPT prompt tips that actually work →</Link>
            <Link href="/blog/what-is-a-good-prompt" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>What makes a good AI prompt? →</Link>
            <Link href="/blog/how-to-use-chatgpt-for-writing" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>How to use ChatGPT for writing →</Link>
            <Link href="/prompts" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>Browse all free prompt templates →</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
