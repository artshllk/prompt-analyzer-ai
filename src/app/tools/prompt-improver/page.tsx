import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'AI Prompt Improver - Rewrite Any Prompt for Better Results',
  description: 'Paste any AI prompt and get an improved version in seconds. Deepclario scores it across 5 dimensions and rewrites it using the CRAFT framework. Works with ChatGPT, Claude, and Gemini.',
  alternates: { canonical: 'https://deepclario.com/tools/prompt-improver' },
  openGraph: {
    title: 'Free AI Prompt Improver',
    description: 'Improve any AI prompt in seconds. Works with ChatGPT, Claude, and Gemini.',
    url: 'https://deepclario.com/tools/prompt-improver',
  },
}

const HOW_IT_WORKS = [
  { step: '1', title: 'Paste your prompt', desc: 'Any prompt - rough, half-formed, or specific. Deepclario handles all of it.' },
  { step: '2', title: 'Get scored and clarified', desc: 'Your prompt is scored 0–100. If key elements are missing, Deepclario asks up to 3 targeted questions.' },
  { step: '3', title: 'Receive the improved version', desc: 'A rewritten prompt using the CRAFT framework, ready to paste into any AI tool.' },
]

const DIMENSIONS = [
  { name: 'Goal clarity', desc: 'Is the desired output unambiguous?' },
  { name: 'Context', desc: 'Does it provide enough background for the AI?' },
  { name: 'Format', desc: 'Is the output structure specified?' },
  { name: 'Constraints', desc: 'Are limits and requirements explicit?' },
  { name: 'Examples', desc: 'Are reference points or examples provided?' },
]

export default function PromptImproverPage() {
  return (
    <div className="editorial grain min-h-screen">
      <header className="border-b border-[color:var(--color-rule)] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Deepclario" width={24} height={24} className="rounded" />
          <span className="font-bold text-sm">Deepclario</span>
        </Link>
        <Link href="/playground" className="px-4 py-2 rounded-xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] text-sm font-semibold transition-all">
          Try free →
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-4">
          <span className="text-xs text-[color:var(--color-paper)] font-semibold uppercase tracking-wider">Free Tool</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
          AI Prompt Improver
        </h1>

        <p className="text-lg text-[color:var(--color-paper-mute)] mb-8 leading-relaxed">
          Paste any prompt and get a smarter, more specific version in under 30 seconds.
          Our AI prompt improver analyzes your input, identifies what&apos;s missing, and rewrites it
          using the <strong className="text-[color:var(--color-paper)]">CRAFT framework</strong> - the same method used
          by professional prompt engineers.
        </p>

        <Link
          href="/playground"
          className="inline-block px-7 py-3.5 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all mb-4"
        >
          Improve my prompt free →
        </Link>
        <p className="text-xs text-[color:var(--color-paper-mute)] mb-16">No account needed · 2 free analyses · Takes 30 seconds</p>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">How the prompt improver works</h2>
          <div className="space-y-4">
            {HOW_IT_WORKS.map(item => (
              <div key={item.step} className="flex gap-4 p-5 rounded-2xl border border-[color:var(--color-rule)]">
                <div className="w-8 h-8 rounded-xl bg-[color:var(--color-paper)] flex items-center justify-center text-[color:var(--color-ink)] font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-[color:var(--color-paper)] mb-1">{item.title}</h3>
                  <p className="text-sm text-[color:var(--color-paper-mute)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-3">What gets scored</h2>
          <p className="text-[color:var(--color-paper-mute)] mb-6">
            Every prompt is evaluated across 5 dimensions (20 points each). The total score is 0–100.
            Most people score between 15–45 before improvement.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {DIMENSIONS.map(d => (
              <div key={d.name} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{d.name}</p>
                <p className="text-xs text-[color:var(--color-paper-mute)]">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-3">What is the CRAFT framework?</h2>
          <p className="text-[color:var(--color-paper-mute)] mb-4 leading-relaxed">
            CRAFT is a structured approach to prompt writing used by professional prompt engineers.
            Every improved prompt from Deepclario follows this framework:
          </p>
          <dl className="space-y-3">
            {[
              { term: 'C - Context', def: 'Relevant background information the AI needs to understand the task.' },
              { term: 'R - Role', def: 'Assign a specific role to the AI: "Act as a senior developer..."' },
              { term: 'A - Action', def: 'A clear, verb-explicit instruction for what to produce.' },
              { term: 'F - Format', def: 'Specify output structure, length, sections, or style.' },
              { term: 'T - Tone & Constraints', def: 'Define tone, limits, and what to avoid.' },
            ].map(item => (
              <div key={item.term} className="p-4 rounded-xl border border-[color:var(--color-rule)]">
                <dt className="font-bold text-[color:var(--color-paper)] text-sm mb-1">{item.term}</dt>
                <dd className="text-sm text-[color:var(--color-paper-mute)]">{item.def}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-3">Which AI tools does this work with?</h2>
          <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
            The improved prompt works with any AI model - <strong className="text-[color:var(--color-paper)]">ChatGPT</strong>,{' '}
            <strong className="text-[color:var(--color-paper)]">Claude</strong>,{' '}
            <strong className="text-[color:var(--color-paper)]">Gemini</strong>,{' '}
            <strong className="text-[color:var(--color-paper)]">Grok</strong>,{' '}
            <strong className="text-[color:var(--color-paper)]">Microsoft Copilot</strong>, or any other LLM.
            Deepclario improves the input - what you do with the output is up to you.
          </p>
        </section>

        <div className="rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to improve your first prompt?</h2>
          <p className="text-[color:var(--color-paper-mute)] mb-6">No account needed. See your clarity score in under 30 seconds.</p>
          <Link
            href="/playground"
            className="inline-block px-7 py-3.5 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all"
          >
            Improve my prompt free →
          </Link>
        </div>
      </main>
    </div>
  )
}
