import Link from 'next/link'
import { FeatureCards } from '@/components/marketing/FeatureCards'
import { PricingSection } from '@/components/marketing/PricingSection'
import { HeroOrbDynamic } from '@/components/3d/HeroOrbDynamic'

const STATS = [
  { value: '12,847', label: 'prompts improved' },
  { value: '94', label: 'avg score lift' },
  { value: '3x', label: 'better results' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#f0f4ff]">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 border-b border-[#1e2d4a]/60 glass">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 8L5 4L7.5 6L10 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-[#f0f4ff] tracking-tight">PromptCraft</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#8b9cc8] hover:text-[#f0f4ff] transition-colors">
            Sign in
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
          >
            Get started free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/6 blur-3xl" />
        </div>

        <div className="relative w-full max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center py-20">
          {/* Left: Copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-xs font-medium text-violet-400">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              AI Prompt Engineering Platform
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Engineer your
              <br />
              <span className="gradient-text">thoughts.</span>
              <br />
              Master AI.
            </h1>

            <p className="text-lg text-[#8b9cc8] leading-relaxed max-w-md">
              Stop getting mediocre AI results. PromptCraft coaches you to write significantly better prompts — through a feedback loop that actually teaches you.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all glow-violet"
              >
                Start for free →
              </Link>
              <Link
                href="#how-it-works"
                className="px-6 py-3.5 rounded-2xl border border-[#2d4070] text-[#8b9cc8] hover:border-[#4a5a80] hover:text-[#f0f4ff] font-semibold transition-all"
              >
                See how it works
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 pt-2">
              {STATS.map(stat => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-[#f0f4ff]">{stat.value}</p>
                  <p className="text-xs text-[#4a5a80]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

           {/* Right: 3D Orb */}
           <div className="relative h-[500px] lg:h-[600px]">
             <HeroOrbDynamic />
           </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#f0f4ff] mb-3">Not a rewriter. A coach.</h2>
          <p className="text-[#8b9cc8] max-w-xl mx-auto">
            Most AI tools blindly rewrite your prompt. PromptCraft acts like a senior engineer reviewing requirements — it asks until it&apos;s confident, then improves.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            { step: '01', title: 'Enter your prompt', desc: 'Type whatever you have — even rough ideas work.' },
            { step: '02', title: 'AI evaluates clarity', desc: 'Scores your prompt across 5 dimensions. If confidence < 80%, it asks targeted questions.' },
            { step: '03', title: 'Answer clarifications', desc: 'Up to 3 focused questions. Each answer increases confidence toward the 80% threshold.' },
            { step: '04', title: 'Receive the improved prompt', desc: 'Gets rewritten using the CRAFT framework. You see the before/after, score improvement, and why it works.' },
            { step: '05', title: 'Track your progress', desc: 'Weekly reports show your common gaps and improvement trajectory over time.' },
          ].map((item, i) => (
            <div key={item.step} className="flex gap-5 items-start p-5 glass rounded-2xl border border-[#1e2d4a]">
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center shrink-0 text-violet-400 font-bold text-sm">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-[#f0f4ff] mb-1">{item.title}</h3>
                <p className="text-sm text-[#8b9cc8]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#f0f4ff] mb-3">Everything you need to master prompts</h2>
          <p className="text-[#8b9cc8]">Built for engineers, researchers, writers, and anyone who uses AI seriously.</p>
        </div>
        <FeatureCards />
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#f0f4ff] mb-3">Simple pricing</h2>
          <p className="text-[#8b9cc8]">Start free. Upgrade when you&apos;re ready.</p>
        </div>
        <PricingSection />
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-[#f0f4ff] mb-4">
            Ready to write prompts that <span className="gradient-text">actually work</span>?
          </h2>
          <p className="text-[#8b9cc8] mb-8">
            Join thousands of engineers improving their AI communication. Free to start, no credit card required.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-lg font-bold transition-all glow-violet"
          >
            Start for free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#1e2d4a] text-center text-sm text-[#4a5a80]">
        <p>© 2025 PromptCraft. Built for the serious AI user.</p>
      </footer>
    </div>
  )
}
