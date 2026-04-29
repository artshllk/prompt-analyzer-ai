import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: '10 ChatGPT Prompt Tips That Actually Work',
  description: 'Most ChatGPT users get mediocre results because their prompts are too vague. These 10 practical tips will immediately improve what you get back — with real before and after examples.',
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
    good: 'Write a tweet about our new feature. Style example: "We just shipped something we\'ve been building for 3 months. It\'s small. It will save you an hour a week. Check it out →" — match that casual, direct tone.',
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
    good: '"The tone is right but the second paragraph is too long — cut it in half and add a concrete example where it ends."',
    why: 'Most people abandon a good response instead of refining it. A surgical follow-up prompt is almost always better than starting over.',
  },
  {
    n: '10. Test your prompt on a real task',
    bad: 'Assume the first response is good enough',
    good: 'Run the same prompt 3 times and compare. If the outputs vary wildly, your prompt is under-specified. If they\'re all mediocre, one of the dimensions — role, context, format — is missing.',
    why: 'Consistency is the signal. A well-structured prompt produces reliably good output, not occasionally good output.',
  },
]

export default function ChatGPTPromptTipsPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#f0f4ff]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 border-b border-[#1e2d4a]/60 glass">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Deepclario" width={28} height={28} className="rounded-md" />
          <span className="font-bold text-[#f0f4ff] tracking-tight">Deepclario</span>
        </Link>
        <Link href="/playground" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all">
          Try free
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10">
          <Link href="/blog/how-to-write-better-prompts" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            ← More prompt guides
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-4 leading-tight">
            10 ChatGPT Prompt Tips That Actually Work
          </h1>
          <p className="text-[#8b9cc8] leading-relaxed">
            Most ChatGPT users get mediocre results not because the model is bad — but because the prompt is
            too vague. These 10 techniques cover the most common gaps. Each one has a before/after example
            you can use immediately.
          </p>
        </div>

        <div className="space-y-12">
          {TIPS.map((tip) => (
            <div key={tip.n}>
              <h2 className="text-xl font-bold text-[#f0f4ff] mb-4">{tip.n}</h2>

              <div className="grid md:grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Before</p>
                  <p className="text-sm text-[#8b9cc8] italic">&ldquo;{tip.bad}&rdquo;</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">After</p>
                  <p className="text-sm text-[#f0f4ff] leading-relaxed">{tip.good}</p>
                </div>
              </div>

              <p className="text-sm text-[#8b9cc8] leading-relaxed border-l-2 border-violet-500/40 pl-4">
                {tip.why}
              </p>
            </div>
          ))}
        </div>

        {/* Internal links */}
        <div className="mt-16 pt-8 border-t border-[#1e2d4a] space-y-4">
          <h2 className="text-lg font-bold text-[#f0f4ff]">Test these tips on your own prompts</h2>
          <p className="text-sm text-[#8b9cc8]">
            Paste any prompt into Deepclario and get a score across all 5 dimensions — goal clarity, context,
            format, constraints, and examples. See exactly which of these tips applies to your prompt, and get
            a rewritten version that scores higher.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/playground"
              className="inline-block px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all glow-violet"
            >
              Analyze my prompt →
            </Link>
            <Link
              href="/blog/how-to-write-better-prompts"
              className="inline-block px-5 py-2.5 rounded-xl border border-[#2d4070] text-[#8b9cc8] hover:text-[#f0f4ff] hover:border-[#4a5a80] text-sm font-medium transition-all"
            >
              7 more prompt techniques →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
