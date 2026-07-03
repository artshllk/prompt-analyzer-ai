import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { defaultOGImage } from '@/lib/og-image'

export const metadata: Metadata = {
  title: 'AI Prompt Analyzer - Score and Improve Your Prompts',
  description: 'Analyze any AI prompt and get a detailed clarity score across 5 dimensions. See exactly what is weak and why - then get a rewritten version that performs better.',
  alternates: { canonical: 'https://deepclario.com/tools/prompt-analyzer' },
  openGraph: {
    title: 'Free AI Prompt Analyzer',
    description: 'Score any prompt across 5 dimensions. Identify exactly what\'s weak and why.',
    url: 'https://deepclario.com/tools/prompt-analyzer',
    // Pages with their own openGraph object need an explicit image - see
    // defaultOGImage() for why the file-convention fallback doesn't apply.
    images: defaultOGImage('Free AI Prompt Analyzer - Deepclario'),
  },
}

const SCORE_RANGES = [
  { range: '0–30', label: 'Weak', color: 'text-[#C25E5E]', bg: 'bg-red-500/10 border-[color:var(--color-rule-strong)]', desc: 'Missing most critical elements. AI will guess and produce generic output.' },
  { range: '31–60', label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', desc: 'Some elements present, but key gaps remain. Results will be inconsistent.' },
  { range: '61–80', label: 'Good', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', desc: 'Solid foundation with minor gaps. Improvement will push results to excellent.' },
  { range: '81–100', label: 'Excellent', color: 'text-[color:var(--color-paper)]', bg: 'bg-emerald-500/10 border-[color:var(--color-rule-strong)]', desc: 'All key elements present. AI has everything it needs for high-quality output.' },
]

export default function PromptAnalyzerPage() {
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
          AI Prompt Analyzer
        </h1>

        <p className="text-lg text-[color:var(--color-paper-mute)] mb-8 leading-relaxed">
          Most people have no idea why their AI prompts fail. Our free prompt analyzer gives you a
          precise <strong className="text-[color:var(--color-paper)]">clarity score from 0–100</strong> with a
          dimension-by-dimension breakdown - so you know exactly what to fix.
        </p>

        <Link
          href="/playground"
          className="inline-block px-7 py-3.5 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all mb-4"
        >
          Analyze my prompt free →
        </Link>
        <div className="mb-16" />

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-3">What does the prompt analyzer measure?</h2>
          <p className="text-[color:var(--color-paper-mute)] mb-6">
            The analyzer scores five dimensions of prompt quality. Each is worth 20 points for a maximum of 100.
            Most untrained prompts score between 10 and 40.
          </p>
          <div className="space-y-3">
            {[
              { name: 'Goal clarity (0–20)', desc: 'How unambiguous is the desired output? Vague goals produce vague answers.' },
              { name: 'Context sufficiency (0–20)', desc: 'Does the AI have the background it needs? Missing context forces the AI to assume.' },
              { name: 'Format specification (0–20)', desc: 'Is the output format, length, or structure defined? Without this, you get inconsistent results.' },
              { name: 'Constraint definition (0–20)', desc: 'Are limits, requirements, or exclusions stated? Constraints prevent off-topic or excessive output.' },
              { name: 'Examples presence (0–20)', desc: 'Are sample inputs or reference points included? Examples dramatically reduce AI ambiguity.' },
            ].map((d, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl border border-[color:var(--color-rule)]">
                <div className="w-7 h-7 rounded-lg bg-[color:var(--color-ink-card)] border border-[color:var(--color-rule-strong)] flex items-center justify-center text-[color:var(--color-paper)] font-bold text-xs shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold text-[color:var(--color-paper)] text-sm mb-1">{d.name}</p>
                  <p className="text-xs text-[color:var(--color-paper-mute)]">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Understanding your score</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {SCORE_RANGES.map(s => (
              <div key={s.range} className={`p-5 rounded-2xl border ${s.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-2xl font-bold ${s.color}`}>{s.range}</span>
                  <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
                </div>
                <p className="text-xs text-[color:var(--color-paper-mute)] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-3">Prompt analyzer vs. prompt improver</h2>
          <p className="text-[color:var(--color-paper-mute)] leading-relaxed mb-4">
            The <strong className="text-[color:var(--color-paper)]">prompt analyzer</strong> tells you what&apos;s wrong and gives you a score.
            The <strong className="text-[color:var(--color-paper)]">prompt improver</strong> fixes it - rewriting the prompt using the CRAFT framework.
          </p>
          <p className="text-[color:var(--color-paper-mute)] leading-relaxed">
            Deepclario does both in a single workflow. You get the analysis <em>and</em> the improved version,
            with a full explanation of every change.
          </p>
          <div className="mt-4">
            <Link href="/tools/prompt-improver" className="text-[color:var(--color-paper)] hover:opacity-70 text-sm transition-colors">
              Learn about the prompt improver →
            </Link>
          </div>
        </section>

        <div className="rounded-2xl border border-[color:var(--color-rule-strong)] bg-[color:var(--color-ink-card)] p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Analyze your prompt now</h2>
          <p className="text-[color:var(--color-paper-mute)] mb-6">Free, instant, and no account required.</p>
          <Link
            href="/playground"
            className="inline-block px-7 py-3.5 rounded-2xl btn-paper bg-[color:var(--color-paper)] text-[color:var(--color-ink)] font-semibold transition-all"
          >
            Analyze my prompt →
          </Link>
        </div>
      </main>
    </div>
  )
}
