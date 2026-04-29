import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'AI Prompt Analyzer — Score and Improve Your Prompts',
  description: 'Analyze any AI prompt and get a detailed clarity score across 5 dimensions. See exactly what is weak and why — then get a rewritten version that performs better.',
  alternates: { canonical: 'https://deepclario.com/tools/prompt-analyzer' },
  openGraph: {
    title: 'Free AI Prompt Analyzer',
    description: 'Score any prompt across 5 dimensions. Identify exactly what\'s weak and why.',
    url: 'https://deepclario.com/tools/prompt-analyzer',
  },
}

const SCORE_RANGES = [
  { range: '0–30', label: 'Weak', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', desc: 'Missing most critical elements. AI will guess and produce generic output.' },
  { range: '31–60', label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', desc: 'Some elements present, but key gaps remain. Results will be inconsistent.' },
  { range: '61–80', label: 'Good', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', desc: 'Solid foundation with minor gaps. Improvement will push results to excellent.' },
  { range: '81–100', label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', desc: 'All key elements present. AI has everything it needs for high-quality output.' },
]

export default function PromptAnalyzerPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#f0f4ff]">
      <header className="border-b border-[#1e2d4a]/60 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Deepclario" width={24} height={24} className="rounded" />
          <span className="font-bold text-sm">Deepclario</span>
        </Link>
        <Link href="/playground" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all">
          Try free →
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-4">
          <span className="text-xs text-violet-400 font-semibold uppercase tracking-wider">Free Tool</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
          AI Prompt Analyzer
        </h1>

        <p className="text-lg text-[#8b9cc8] mb-8 leading-relaxed">
          Most people have no idea why their AI prompts fail. Our free prompt analyzer gives you a
          precise <strong className="text-[#f0f4ff]">clarity score from 0–100</strong> with a
          dimension-by-dimension breakdown — so you know exactly what to fix.
        </p>

        <Link
          href="/playground"
          className="inline-block px-7 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all glow-violet mb-4"
        >
          Analyze my prompt free →
        </Link>
        <p className="text-xs text-[#4a5a80] mb-16">No account needed · See results in seconds</p>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-3">What does the prompt analyzer measure?</h2>
          <p className="text-[#8b9cc8] mb-6">
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
              <div key={i} className="flex gap-4 p-4 glass rounded-xl border border-[#1e2d4a]">
                <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold text-[#f0f4ff] text-sm mb-1">{d.name}</p>
                  <p className="text-xs text-[#8b9cc8]">{d.desc}</p>
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
                <p className="text-xs text-[#8b9cc8] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-3">Prompt analyzer vs. prompt improver</h2>
          <p className="text-[#8b9cc8] leading-relaxed mb-4">
            The <strong className="text-[#f0f4ff]">prompt analyzer</strong> tells you what&apos;s wrong and gives you a score.
            The <strong className="text-[#f0f4ff]">prompt improver</strong> fixes it — rewriting the prompt using the CRAFT framework.
          </p>
          <p className="text-[#8b9cc8] leading-relaxed">
            Deepclario does both in a single workflow. You get the analysis <em>and</em> the improved version,
            with a full explanation of every change.
          </p>
          <div className="mt-4">
            <Link href="/tools/prompt-improver" className="text-violet-400 hover:text-violet-300 text-sm transition-colors">
              Learn about the prompt improver →
            </Link>
          </div>
        </section>

        <div className="rounded-2xl border border-violet-500/30 bg-violet-600/10 p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Analyze your prompt now</h2>
          <p className="text-[#8b9cc8] mb-6">Free, instant, and no account required.</p>
          <Link
            href="/playground"
            className="inline-block px-7 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all glow-violet"
          >
            Analyze my prompt →
          </Link>
        </div>
      </main>
    </div>
  )
}
