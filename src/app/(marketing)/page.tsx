import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FeatureCards } from '@/components/marketing/FeatureCards'
import { PricingSection } from '@/components/marketing/PricingSection'
import { PromptDemo } from '@/components/marketing/PromptDemo'
import { FAQSection } from '@/components/marketing/FAQSection'

export const metadata: Metadata = {
  title: 'Deepclario — AI Prompt Improver & Analyzer',
  description: 'Deepclario analyzes your AI prompts, scores them across 5 dimensions, asks the right clarifying questions, and rewrites them to get dramatically better results from ChatGPT, Claude, and Gemini.',
  alternates: { canonical: 'https://deepclario.com' },
  openGraph: {
    title: 'Deepclario — AI Prompt Improver',
    description: 'Stop getting mediocre AI results. Deepclario scores your prompt, asks what\'s missing, then rewrites it to get 3x better output.',
    url: 'https://deepclario.com',
    type: 'website',
    images: [{ url: 'https://deepclario.com/logo.png', width: 512, height: 512, alt: 'Deepclario' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deepclario — AI Prompt Improver',
    description: 'Score, analyze, and improve your AI prompts. Get better results from ChatGPT, Claude, and Gemini.',
    images: ['https://deepclario.com/logo.png'],
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Deepclario',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Web',
      url: 'https://deepclario.com',
      description: 'AI-powered prompt analysis and improvement platform. Score your prompts, identify gaps, and get rewrites that deliver better AI results.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier with 25 analyses per month',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is prompt engineering?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Prompt engineering is the practice of crafting clear, structured inputs for AI models to get consistently better outputs. A well-engineered prompt specifies role, context, format, and constraints — reducing ambiguity and improving response quality.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does Deepclario improve my prompts?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Deepclario scores your prompt across 5 dimensions (goal clarity, context, format, constraints, examples), identifies gaps, asks targeted clarifying questions when needed, then rewrites your prompt using the CRAFT framework to maximize AI response quality.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Deepclario free to use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The free plan includes 25 prompt analyses per month with full AI improvement. The Pro plan ($5/month) adds unlimited analyses, full history, and weekly insight reports.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why not just ask ChatGPT to improve my prompt?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "ChatGPT doesn't know what a good prompt looks like for your specific use case. It won't score your prompt, identify which dimension is weakest, ask the right clarifying questions, or track whether you're getting better over time. Deepclario does all of that.",
          },
        },
      ],
    },
    {
      '@type': 'HowTo',
      name: 'How to improve your AI prompts with Deepclario',
      step: [
        { '@type': 'HowToStep', name: 'Enter your prompt', text: 'Paste any prompt — rough ideas work fine.' },
        { '@type': 'HowToStep', name: 'Get your clarity score', text: 'Deepclario scores it across 5 dimensions and identifies what\'s missing.' },
        { '@type': 'HowToStep', name: 'Answer clarifying questions', text: 'If confidence is below 80%, Deepclario asks up to 3 targeted questions.' },
        { '@type': 'HowToStep', name: 'Receive the improved prompt', text: 'Get a rewritten prompt using the CRAFT framework with a full explanation of every change.' },
      ],
    },
  ],
}

const WHY_BAD = [
  { label: 'No context', desc: 'The AI doesn\'t know your audience, domain, or goal — so it guesses.' },
  { label: 'No role', desc: 'Without "Act as a...", responses lack expertise and perspective.' },
  { label: 'No format', desc: 'No length or structure specified means inconsistent, unusable output.' },
  { label: 'No constraints', desc: 'Missing limits lead to bloated, off-topic answers.' },
  { label: 'Too vague', desc: '"Write a blog post" could mean 10,000 different things to an AI.' },
]

const WHO_FOR = [
  { icon: '💻', role: 'Developers', use: 'Write precise coding prompts for Copilot, Cursor, and Claude.' },
  { icon: '✍️', role: 'Writers', use: 'Get consistent, on-brand AI writing that actually matches your voice.' },
  { icon: '📊', role: 'Marketers', use: 'Generate better ad copy, email drafts, and strategy documents.' },
  { icon: '🎓', role: 'Students', use: 'Use AI more effectively for research, essays, and study plans.' },
  { icon: '🔬', role: 'Researchers', use: 'Extract precise, structured summaries from complex sources.' },
  { icon: '🏢', role: 'Founders', use: 'Move faster with AI — better briefs, docs, and decision support.' },
]

const BEFORE_AFTER = [
  {
    label: 'Writing',
    before: 'Write me a blog post about AI',
    after: 'Write a 1,200-word blog post for B2B marketers explaining how AI writing tools differ from human writers. Include 3 concrete examples of tasks where each excels. Use a conversational but professional tone. End with a practical recommendation.',
    scoreBefore: 18,
    scoreAfter: 91,
    tags: ['+Role', '+Format', '+Context', '+Constraints'],
  },
  {
    label: 'Coding',
    before: 'Help me fix this bug',
    after: 'Act as a senior TypeScript engineer. I have a React hook that causes infinite re-renders when the dependency array includes an object. Explain why this happens, then show me the corrected code with a brief comment explaining the fix.',
    scoreBefore: 12,
    scoreAfter: 88,
    tags: ['+Role', '+Context', '+Format', '+Examples'],
  },
  {
    label: 'Research',
    before: 'Summarize this paper',
    after: 'Summarize the key findings of this research paper in 3 sections: (1) the core hypothesis in one sentence, (2) the methodology in 2-3 sentences, (3) the most important conclusion and its practical implications. Target audience: non-technical executives.',
    scoreBefore: 9,
    scoreAfter: 94,
    tags: ['+Structure', '+Audience', '+Format', '+Depth'],
  },
]

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-[#0a0e1a] text-[#f0f4ff]">
        {/* Nav */}
        <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 border-b border-[#1e2d4a]/60 glass">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Deepclario" width={28} height={28} className="rounded-md" />
            <span className="font-bold text-[#f0f4ff] tracking-tight">Deepclario</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[#8b9cc8]">
            <Link href="#how-it-works" className="hover:text-[#f0f4ff] transition-colors">How it works</Link>
            <Link href="#examples" className="hover:text-[#f0f4ff] transition-colors">Examples</Link>
            <Link href="#pricing" className="hover:text-[#f0f4ff] transition-colors">Pricing</Link>
            <Link href="/blog/what-is-prompt-engineering" className="hover:text-[#f0f4ff] transition-colors">Learn</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#8b9cc8] hover:text-[#f0f4ff] transition-colors">
              Sign in
            </Link>
            <Link
              href="/playground"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
            >
              Try free
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="relative pt-32 pb-16 px-6 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-violet-600/6 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-3xl" />
          </div>

          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-xs font-medium text-violet-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Free prompt analyzer — no account required
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-5">
              Your AI prompts are the problem.{' '}
              <span className="gradient-text">We fix them.</span>
            </h1>

            <p className="text-lg text-[#8b9cc8] leading-relaxed max-w-2xl mx-auto mb-8">
              Paste any prompt. Deepclario scores it across 5 dimensions, asks what&apos;s missing,
              and rewrites it — so ChatGPT, Claude, and Gemini give you dramatically better answers.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <Link
                href="/playground"
                className="px-7 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all glow-violet text-base"
              >
                Analyze my prompt free →
              </Link>
              <Link
                href="#demo"
                className="px-7 py-3.5 rounded-2xl border border-[#2d4070] text-[#8b9cc8] hover:border-[#4a5a80] hover:text-[#f0f4ff] font-semibold transition-all text-base"
              >
                See it in action
              </Link>
            </div>

            <p className="text-xs text-[#4a5a80]">
              No account needed to try · Free tier: 25 analyses/month · No credit card ever
            </p>
          </div>
        </section>

        {/* Live Demo */}
        <section id="demo" className="py-16 px-6 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[#f0f4ff] mb-3">
              Watch a prompt transform in real time
            </h2>
            <p className="text-[#8b9cc8]">This is exactly what happens when you paste a prompt into Deepclario.</p>
          </div>
          <PromptDemo />
        </section>

        {/* Why AI gives bad answers */}
        <section className="py-20 px-6 bg-[#080c18]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-[#f0f4ff] mb-3">
                Why AI gives you bad answers
              </h2>
              <p className="text-[#8b9cc8] max-w-xl mx-auto">
                It&apos;s almost never the AI&apos;s fault. The problem is almost always in the prompt.
                These are the 5 most common reasons — and Deepclario catches every one.
              </p>
            </div>
            <div className="grid md:grid-cols-5 gap-4">
              {WHY_BAD.map((item, i) => (
                <div key={item.label} className="glass rounded-2xl border border-[#1e2d4a] p-5 text-center">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3 text-red-400 font-bold text-xs">
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-bold text-[#f0f4ff] mb-2">{item.label}</h3>
                  <p className="text-xs text-[#8b9cc8] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#f0f4ff] mb-3">
              Not a rewriter. A coach.
            </h2>
            <p className="text-[#8b9cc8] max-w-xl mx-auto">
              Most AI tools blindly rewrite your prompt. Deepclario acts like a senior engineer reviewing
              requirements — it asks until it&apos;s confident, then improves.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Paste your prompt',
                desc: 'Any prompt — rough drafts, one-liners, or complex instructions. Deepclario handles all of it.',
                color: 'border-violet-500/20 bg-violet-500/5',
                dot: 'bg-violet-500',
              },
              {
                step: '2',
                title: 'AI scores and clarifies',
                desc: 'Your prompt is scored across 5 dimensions. If confidence is below 80%, Deepclario asks up to 3 targeted questions.',
                color: 'border-cyan-500/20 bg-cyan-500/5',
                dot: 'bg-cyan-500',
              },
              {
                step: '3',
                title: 'Get the improved version',
                desc: 'Receive the rewritten prompt, a full explanation, and your score improvement — ready to paste into any AI tool.',
                color: 'border-emerald-500/20 bg-emerald-500/5',
                dot: 'bg-emerald-500',
              },
            ].map((item) => (
              <div key={item.step} className={`rounded-2xl border ${item.color} p-6`}>
                <div className={`w-8 h-8 rounded-xl ${item.dot} flex items-center justify-center text-white font-bold text-sm mb-4`}>
                  {item.step}
                </div>
                <h3 className="font-bold text-[#f0f4ff] mb-2">{item.title}</h3>
                <p className="text-sm text-[#8b9cc8] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Before / After Examples */}
        <section id="examples" className="py-20 px-6 bg-[#080c18]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-[#f0f4ff] mb-3">
                Real before &amp; after examples
              </h2>
              <p className="text-[#8b9cc8]">
                These are real transformations. The weak prompt is what most people type. The improved version is what Deepclario produces.
              </p>
            </div>

            <div className="space-y-6">
              {BEFORE_AFTER.map((ex) => (
                <div key={ex.label} className="glass rounded-2xl border border-[#1e2d4a] overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#1e2d4a] flex items-center justify-between">
                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">{ex.label}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-red-400 font-bold">{ex.scoreBefore}/100</span>
                      <span className="text-[#2d4070]">→</span>
                      <span className="text-emerald-400 font-bold">{ex.scoreAfter}/100</span>
                      <span className="text-[#4a5a80]">clarity score</span>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1e2d4a]">
                    <div className="p-5">
                      <p className="text-xs text-red-400 uppercase tracking-wider font-semibold mb-3">Before</p>
                      <p className="text-sm text-[#8b9cc8] leading-relaxed italic">&ldquo;{ex.before}&rdquo;</p>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold mb-3">After</p>
                      <p className="text-sm text-[#f0f4ff] leading-relaxed">{ex.after}</p>
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {ex.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/playground"
                className="inline-block px-7 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all glow-violet"
              >
                Improve my prompt now →
              </Link>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#f0f4ff] mb-3">Built for anyone who uses AI seriously</h2>
            <p className="text-[#8b9cc8]">If you use ChatGPT, Claude, or Gemini more than once a week — Deepclario makes every session better.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {WHO_FOR.map((w) => (
              <div key={w.role} className="glass rounded-2xl border border-[#1e2d4a] p-5">
                <span className="text-2xl mb-3 block">{w.icon}</span>
                <h3 className="font-bold text-[#f0f4ff] mb-1.5">{w.role}</h3>
                <p className="text-sm text-[#8b9cc8] leading-relaxed">{w.use}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why not ChatGPT */}
        <section className="py-20 px-6 bg-[#080c18]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-[#f0f4ff] mb-3">
                &ldquo;Can&apos;t I just ask ChatGPT to improve my prompt?&rdquo;
              </h2>
              <p className="text-[#8b9cc8]">Yes. Here&apos;s what you get vs. what you don&apos;t.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl border border-[#1e2d4a] p-6">
                <p className="text-sm font-semibold text-[#8b9cc8] mb-4">ChatGPT / Claude / Gemini</p>
                <ul className="space-y-3">
                  {[
                    'Rewrites your prompt without asking what you actually need',
                    'No score — you don\'t know if the new version is actually better',
                    'Doesn\'t track your patterns or common mistakes over time',
                    'Can\'t tell you which of the 5 dimensions is your weakest',
                    'Won\'t help you get better at writing prompts yourself',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#8b9cc8]">
                      <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6">
                <p className="text-sm font-semibold text-violet-400 mb-4">Deepclario</p>
                <ul className="space-y-3">
                  {[
                    'Asks targeted clarifying questions before rewriting',
                    'Scores every prompt 0–100 with dimension-by-dimension breakdown',
                    'Shows your improvement trend over weeks and months',
                    'Identifies your most common prompt gaps by category',
                    'Makes you better at prompting — not dependent on a tool',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#f0f4ff]">
                      <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#f0f4ff] mb-3">Everything you need to master prompts</h2>
            <p className="text-[#8b9cc8]">Built for engineers, researchers, writers, and anyone who uses AI seriously.</p>
          </div>
          <FeatureCards />
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-6 bg-[#080c18]">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#f0f4ff] mb-3">Simple, honest pricing</h2>
            <p className="text-[#8b9cc8]">Start free. No credit card. Upgrade only when you need more.</p>
          </div>
          <PricingSection />
        </section>

        {/* FAQ */}
        <section className="py-20 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#f0f4ff] mb-3">Frequently asked questions</h2>
          </div>
          <FAQSection />
        </section>

        {/* CTA */}
        <section className="py-20 px-6 text-center bg-[#080c18]">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[#f0f4ff] mb-4">
              Ready to write prompts that <span className="gradient-text">actually work?</span>
            </h2>
            <p className="text-[#8b9cc8] mb-8 max-w-lg mx-auto">
              Paste your first prompt and see your score in under 30 seconds. No account needed to try.
            </p>
            <Link
              href="/playground"
              className="inline-block px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-lg font-bold transition-all glow-violet"
            >
              Score my prompt free →
            </Link>
            <p className="text-xs text-[#4a5a80] mt-4">No signup required · Free tier: 25 analyses/month</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-6 border-t border-[#1e2d4a]">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Image src="/logo.png" alt="Deepclario" width={24} height={24} className="rounded" />
                  <span className="font-bold text-[#f0f4ff] text-sm">Deepclario</span>
                </div>
                <p className="text-xs text-[#4a5a80] leading-relaxed">AI prompt analysis and improvement platform. Get better results from every AI tool you use.</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#8b9cc8] uppercase tracking-wider mb-3">Product</p>
                <ul className="space-y-2 text-xs text-[#4a5a80]">
                  <li><Link href="/playground" className="hover:text-[#8b9cc8] transition-colors">Prompt Playground</Link></li>
                  <li><Link href="/tools/prompt-improver" className="hover:text-[#8b9cc8] transition-colors">Prompt Improver</Link></li>
                  <li><Link href="/tools/prompt-analyzer" className="hover:text-[#8b9cc8] transition-colors">Prompt Analyzer</Link></li>
                  <li><Link href="#pricing" className="hover:text-[#8b9cc8] transition-colors">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#8b9cc8] uppercase tracking-wider mb-3">Learn</p>
                <ul className="space-y-2 text-xs text-[#4a5a80]">
                  <li><Link href="/blog/what-is-prompt-engineering" className="hover:text-[#8b9cc8] transition-colors">What is Prompt Engineering?</Link></li>
                  <li><Link href="/blog/how-to-write-better-prompts" className="hover:text-[#8b9cc8] transition-colors">How to Write Better Prompts</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#8b9cc8] uppercase tracking-wider mb-3">Legal</p>
                <ul className="space-y-2 text-xs text-[#4a5a80]">
                  <li><Link href="/privacy" className="hover:text-[#8b9cc8] transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-[#8b9cc8] transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-[#1e2d4a] pt-6 text-center text-xs text-[#4a5a80]">
              © 2026 Deepclario. Built for the serious AI user.
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
