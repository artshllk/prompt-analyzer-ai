import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { DetectorClient } from './detector-client'

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

export default function DetectorPage() {
  return (
    <div
      className="editorial grain min-h-screen relative"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      {/* Nav (mirrors the marketing page so signed-out visitors keep
          context). The detector is a co-headline feature so we
          highlight it here too. */}
      <header
        className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md"
        style={{
          background: 'rgba(14,14,16,0.72)',
          borderBottom: '1px solid var(--color-rule)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Deepclario" width={28} height={28} priority />
            <span
              className="text-[15px] tracking-tight"
              style={{ color: 'var(--color-paper)', fontWeight: 500 }}
            >
              Deepclario
            </span>
          </Link>
          <nav
            className="hidden md:flex items-center gap-7 text-sm"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            <Link href="/playground" className="hover:opacity-100 transition-opacity opacity-80">
              Playground
            </Link>
            <Link
              href="/detector"
              className="opacity-100"
              style={{ color: 'var(--color-paper)' }}
            >
              Detector
            </Link>
            <Link href="/prompts" className="hover:opacity-100 transition-opacity opacity-80">
              Prompts
            </Link>
            <Link href="/extension" className="hover:opacity-100 transition-opacity opacity-80">
              Extension
            </Link>
            <Link href="/blog" className="hover:opacity-100 transition-opacity opacity-80">
              Blog
            </Link>
          </nav>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-sm hover:opacity-100 transition-opacity opacity-80"
              style={{ color: 'var(--color-paper)' }}
            >
              Sign in
            </Link>
            <Link
              href="/playground"
              className="px-4 py-2 rounded-full text-sm transition-all btn-paper"
              style={{
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                fontWeight: 500,
              }}
            >
              Try free
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-28 md:pt-36 pb-20 md:pb-24 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-6">AI Text Detector</p>
          <h1
            className="display text-4xl md:text-[3.75rem] leading-[1.05] tracking-tight"
            style={{ color: 'var(--color-paper)' }}
          >
            Paste text. See <span className="accent">every signal</span>{' '}
            we used to decide.
          </h1>
          <p
            className="mt-6 md:mt-7 text-lg leading-relaxed max-w-2xl"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            Most AI detectors give you a percentage and a vibe. This one shows you the actual measurements - burstiness, vocabulary diversity, AI-cliché density, transition-word patterns - and tells you what each one means. No invented certainty.
          </p>

          <div className="mt-10 md:mt-12">
            <DetectorClient />
          </div>

          {/* About AI detection - the honest block */}
          <section
            className="mt-20 md:mt-24 pt-10 md:pt-12"
            style={{ borderTop: '1px solid var(--color-rule)' }}
          >
            <p className="eyebrow mb-5">About this detector</p>
            <h2
              className="font-serif text-2xl md:text-3xl mb-5 leading-tight"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              AI detection is not a solved problem. We treat it that way.
            </h2>
            <div
              className="space-y-4 text-base md:text-lg leading-relaxed"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              <p>
                Every paid detector on the market - GPTZero, Originality, Copyleaks - has a 5–20% false positive rate on human text. Stanford research has shown that detectors flag writing by non-native English speakers as AI roughly half the time. OpenAI shut down their own detector for being too inaccurate to ship.
              </p>
              <p>
                Our approach is different: we never tell you &ldquo;87% AI&rdquo;. We show you three bands - likely human, mixed, likely AI - and the raw signal values that put the text in that band. You see the math, not a black box.
              </p>
              <p>
                Use this as one input among many. A creative writing teacher with thirty years of experience is still better than any detector. So is reading the text yourself.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer - minimal */}
      <footer
        className="px-6 md:px-10 py-10"
        style={{ borderTop: '1px solid var(--color-rule)' }}
      >
        <div
          className="max-w-3xl mx-auto text-xs flex flex-wrap gap-x-4 gap-y-2"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          <span>© 2026 Deepclario</span>
          <Link
            href="/"
            className="underline underline-offset-4"
            style={{ color: 'var(--color-paper)' }}
          >
            deepclario.com
          </Link>
          <Link
            href="/privacy"
            className="underline underline-offset-4"
            style={{ color: 'var(--color-paper)' }}
          >
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  )
}
