import type { Metadata } from 'next'
import Link from 'next/link'
import { DetectorClient } from './detector-client'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { AppShell } from '@/components/ui/AppShell'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'AI Text Detector - Honest, transparent AI-content detection',
  description:
    'Paste any text and see whether it leans human or AI-generated. We show every signal we measured, explain what each one means, and never invent a percentage we cannot defend.',
  alternates: { canonical: 'https://deepclario.com/detector' },
  openGraph: {
    title: 'AI Text Detector - Deepclario',
    description:
      'Honest, transparent AI-content detection. Burstiness, vocabulary diversity, AI-cliché density, and more - every signal shown openly.',
    url: 'https://deepclario.com/detector',
    type: 'website',
  },
}

export default async function DetectorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const header = user ? (
    // Signed-in: compact, app-like header (lives inside the sidebar shell).
    <div>
      <p className="eyebrow mb-2">AI Text Detector</p>
      <h1
        className="font-serif text-2xl md:text-3xl tracking-tight"
        style={{ color: 'var(--color-paper)', fontWeight: 400 }}
      >
        Paste text, see the verdict.
      </h1>
    </div>
  ) : (
    // Anonymous: marketing hero for the public landing surface.
    <div>
      <p className="eyebrow mb-6">AI Text Detector</p>
      <h1
        className="display text-4xl md:text-[3.75rem] leading-[1.05] tracking-tight"
        style={{ color: 'var(--color-paper)' }}
      >
        Paste text. See <span className="accent">every signal</span>{' '}
        we used to decide.
      </h1>
    </div>
  )

  const mainContent = (
    <main className={user ? 'pt-8 md:pt-10 pb-16 px-6 md:px-10' : 'pt-28 md:pt-36 pb-16 px-6 md:px-10'}>
      <div className="max-w-3xl mx-auto">
        {header}

        <div className={user ? 'mt-6 md:mt-8' : 'mt-10 md:mt-12'}>
          <DetectorClient />
        </div>

        {/* Slim honesty note - narrow footer, not a section. */}
        <p
          className="mt-14 pt-5 text-xs leading-relaxed"
          style={{ borderTop: '1px solid var(--color-rule)', color: 'var(--color-paper-mute)' }}
        >
          AI detection is not solved. Paid detectors run 5–20% false positives and often flag non-native English as AI, so we never invent a percentage - just three honest bands and the signals behind them. Use it as one input, not a verdict.
        </p>
      </div>
    </main>
  )

  if (user) {
    return (
      <div className="editorial grain min-h-screen" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
        <AppShell>{mainContent}</AppShell>
      </div>
    )
  }

  return (
    <div
      className="editorial grain min-h-screen relative"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      <MarketingNav current="detector" />
      {mainContent}
      <footer
        className="px-6 md:px-10 py-10"
        style={{ borderTop: '1px solid var(--color-rule)' }}
      >
        <div
          className="max-w-3xl mx-auto text-xs flex flex-wrap gap-x-4 gap-y-2"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          <span>© 2026 Deepclario</span>
          <Link href="/" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>
            deepclario.com
          </Link>
          <Link href="/privacy" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  )
}
