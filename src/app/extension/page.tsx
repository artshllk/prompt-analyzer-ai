import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { AppShell } from '@/components/ui/AppShell'
import { createClient } from '@/lib/supabase/server'
import { CHROME_STORE_URL } from '@/lib/constants'
import { ExtensionHeroVisual } from '@/components/extension/ExtensionHeroVisual'
import {
  BenefitCard,
  StepChip,
  IconInPlace,
  IconOneClick,
  IconPrivate,
} from '@/components/extension/ExtensionBits'

export const metadata: Metadata = {
  title: 'Chrome extension - Deepclario inside ChatGPT, Claude & Gemini',
  description:
    'Install the Deepclario extension and an Improve button appears in your ChatGPT, Claude, or Gemini chat box. One click. Your prompt gets rewritten in place. No copy-paste, no new tab.',
  alternates: { canonical: 'https://deepclario.com/extension' },
  openGraph: {
    title: 'Deepclario - Chrome extension',
    description:
      'An Improve button right in your ChatGPT, Claude, and Gemini chat box. One click, in place, no tab switching.',
    url: 'https://deepclario.com/extension',
    type: 'website',
  },
}

function AddToChrome({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const pad = size === 'lg' ? 'px-6 py-3.5 text-[15px]' : 'px-5 py-2.5 text-sm'
  return (
    <a
      href={CHROME_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full transition-all btn-paper ${pad}`}
      style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
    >
      Add to Chrome
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

export default async function ExtensionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Signed-in users see the app nav (AppShell), which already sits at the
  // top, so the page needs less top padding. Signed-out users get the
  // fixed MarketingNav, which the content must clear.
  const mainContent = (
    <main className={`max-w-6xl mx-auto px-6 md:px-10 pb-16 md:pb-24 ${user ? 'pt-8 md:pt-10' : 'pt-28 md:pt-36'}`}>
      {/* HERO - split: copy left, product visual right. */}
      <section className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-6">
          <p className="eyebrow mb-6">Browser extension</p>
          <h1
            className="display text-4xl md:text-6xl leading-[1.05] tracking-tight"
            style={{ color: 'var(--color-paper)' }}
          >
            One click. Better prompts.{' '}
            <span className="accent">Right inside ChatGPT.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed max-w-md" style={{ color: 'var(--color-paper-mute)' }}>
            An Improve button appears in your chat box. Click it, your prompt gets rewritten in place.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <AddToChrome />
            <span className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
              Free · Chrome, Brave, Edge, Arc
            </span>
          </div>
        </div>

        <div className="lg:col-span-6">
          <ExtensionHeroVisual />
        </div>
      </section>

      {/* BENEFITS - three scannable cards. */}
      <section className="mt-24 md:mt-32 grid sm:grid-cols-3 gap-5">
        <BenefitCard
          icon={IconInPlace}
          title="In place"
          body="Rewrites right where you type. No copy-paste, no new tab."
        />
        <BenefitCard
          icon={IconOneClick}
          title="One click"
          body="Paste a prompt, click Improve, send the better version."
        />
        <BenefitCard
          icon={IconPrivate}
          title="Private"
          body="Nothing stored. No account needed to start."
        />
      </section>

      {/* HOW - collapsed to a chip strip. */}
      <section className="mt-24 md:mt-32">
        <p className="eyebrow mb-8 text-center">Set up in under a minute</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-6 sm:gap-8">
          <StepChip n="1" label="Add to Chrome" />
          <Arrow />
          <StepChip n="2" label="Open a chat" />
          <Arrow />
          <StepChip n="3" label="Click Improve" />
        </div>
        <div className="mt-10 flex justify-center">
          <AddToChrome size="sm" />
        </div>
      </section>

      {/* FALLBACK - one line + outline button. */}
      <section
        className="mt-24 md:mt-32 pt-12 text-center"
        style={{ borderTop: '1px solid var(--color-rule)' }}
      >
        <p className="font-serif text-2xl md:text-3xl leading-tight mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
          Rather not install anything?
        </p>
        <p className="text-base md:text-lg mb-7" style={{ color: 'var(--color-paper-mute)' }}>
          The same engine runs on the web. Paste a prompt, get the same rewrite.
        </p>
        <Link
          href="/playground"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all btn-outline"
          style={{ border: '1px solid var(--color-rule-strong)', color: 'var(--color-paper)' }}
        >
          Open the playground
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </section>
    </main>
  )

  // Signed in: render inside the app shell (its own nav, no marketing
  // nav/footer). Signed out: marketing nav + footer.
  if (user) {
    return (
      <div className="editorial grain no-page-transition min-h-screen" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
        <AppShell>{mainContent}</AppShell>
      </div>
    )
  }

  return (
    <div className="editorial grain min-h-screen" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <MarketingNav current="extension" />
      {mainContent}
      <footer className="px-6 md:px-10 py-10" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <div className="max-w-6xl mx-auto text-xs" style={{ color: 'var(--color-paper-mute)' }}>
          © 2026 Deepclario{' '}
          <Link href="/" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>
            deepclario.com
          </Link>
        </div>
      </footer>
    </div>
  )
}

function Arrow() {
  return (
    <svg
      className="hidden sm:block shrink-0"
      width="20"
      height="14"
      viewBox="0 0 20 14"
      fill="none"
      aria-hidden
      style={{ color: 'var(--color-rule-strong)' }}
    >
      <path d="M2 7H18M18 7L13 2M18 7L13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
