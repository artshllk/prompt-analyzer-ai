import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { AppShell } from '@/components/ui/AppShell'
import { createClient } from '@/lib/supabase/server'
import { CHROME_STORE_URL } from '@/lib/constants'
import { ExtensionHeroVisual } from '@/components/extension/ExtensionHeroVisual'
import { defaultOGImage } from '@/lib/og-image'
import { Hotkey } from '@/components/shared/Hotkey'

/**
 * The extension page.
 *
 * The old copy sold a product that no longer exists: an "Improve button" you
 * click, and a web playground as the no-install fallback. There is no button
 * (it is a keystroke and a small chip), and the playground is deleted - so the
 * fallback was both a broken promise and an own goal, since it told people
 * they did not need to install anything.
 *
 * What actually makes this worth installing is not "it rewrites your prompt".
 * Everyone says that, and ChatGPT will do it if you ask. It is the three
 * things nothing else does:
 *
 *   1. It asks before it rewrites, when your prompt could mean two things.
 *   2. It remembers your answers, so it never asks you the same thing twice.
 *   3. Your words are never lost - one click takes them back.
 *
 * So that is what the page says, in plain words, in that order.
 */

export const metadata: Metadata = {
  title: 'Deepclario extension - better prompts inside ChatGPT',
  description:
    'Press one key and your prompt gets improved right in the box, inside ChatGPT, Claude, or Gemini. It asks first when your prompt could mean two things, and it remembers your answers. No copy-paste, no new tab.',
  alternates: { canonical: 'https://deepclario.com/extension' },
  openGraph: {
    title: 'Deepclario - browser extension',
    description:
      'One key. Your prompt gets improved right where you type, inside ChatGPT, Claude, and Gemini.',
    url: 'https://deepclario.com/extension',
    type: 'website',
    images: defaultOGImage('Deepclario - browser extension'),
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

  const mainContent = (
    <main className={`max-w-6xl mx-auto px-6 md:px-10 pb-16 md:pb-24 ${user ? 'pt-8 md:pt-10' : 'pt-28 md:pt-36'}`}>
      {/* HERO */}
      <section className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-6">
          <p className="eyebrow mb-6">Browser extension</p>
          <h1
            className="display text-4xl md:text-6xl leading-[1.05] tracking-tight"
            style={{ color: 'var(--color-paper)' }}
          >
            Press one key.{' '}
            <span className="accent">Get a better prompt.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed max-w-md" style={{ color: 'var(--color-paper-mute)' }}>
            Type your prompt in ChatGPT, Claude, or Gemini. Press <Hotkey />.
            It gets improved right there in the box. You never leave the chat.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <AddToChrome />
            <span className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
              Free. No account needed to try it.
            </span>
          </div>
        </div>

        <div className="lg:col-span-6">
          <ExtensionHeroVisual />
        </div>
      </section>

      {/* WHY IT IS DIFFERENT - the three things nothing else does. */}
      <section className="mt-24 md:mt-32">
        <p className="eyebrow mb-3">Why it is different</p>
        <h2
          className="font-serif text-3xl md:text-[2.5rem] leading-tight tracking-tight max-w-2xl mb-12"
          style={{ color: 'var(--color-paper)', fontWeight: 400 }}
        >
          Any AI can reword your prompt. None of them ask what you actually meant.
        </h2>

        <div className="space-y-px">
          {DIFFERENCES.map((d, i) => (
            <div key={d.title}>
              <div className="rule-strong" />
              <div className="grid md:grid-cols-12 gap-4 md:gap-10 py-8">
                <div className="md:col-span-1">
                  <span
                    className="font-serif text-2xl tabular-nums"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {i + 1}
                  </span>
                </div>
                <div className="md:col-span-4">
                  <h3
                    className="text-lg md:text-xl"
                    style={{ color: 'var(--color-paper)', fontWeight: 600 }}
                  >
                    {d.title}
                  </h3>
                </div>
                <div className="md:col-span-7">
                  <p
                    className="text-base md:text-lg leading-[1.6]"
                    style={{ color: 'var(--color-paper-mute)' }}
                  >
                    {d.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div className="rule-strong" />
        </div>
      </section>

      {/* HOW - three steps, no ceremony. */}
      <section className="mt-24 md:mt-32">
        <p className="eyebrow mb-8 text-center">Set up in under a minute</p>
        <div className="grid sm:grid-cols-3 gap-8 sm:gap-6 max-w-3xl mx-auto">
          {[
            { title: <>Add it to Chrome</>, sub: 'One click from the store.' },
            { title: <>Open ChatGPT</>, sub: 'Or Claude, or Gemini.' },
            { title: <>Press <Hotkey /></>, sub: 'Your prompt gets improved in the box.' },
          ].map(({ title, sub }, i) => (
            <div key={i}>
              <p
                className="font-serif text-xl mb-2 tabular-nums"
                style={{ color: 'var(--color-accent)' }}
              >
                {i + 1}
              </p>
              <p className="text-base mb-1" style={{ color: 'var(--color-paper)', fontWeight: 600 }}>
                {title}
              </p>
              <p className="text-sm leading-[1.55]" style={{ color: 'var(--color-paper-mute)' }}>
                {sub}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <AddToChrome size="sm" />
        </div>
      </section>

      {/* PRIVACY - honest, not a marketing claim. */}
      <section
        className="mt-24 md:mt-32 pt-12"
        style={{ borderTop: '1px solid var(--color-rule)' }}
      >
        <div className="grid md:grid-cols-12 gap-6 md:gap-12">
          <div className="md:col-span-4">
            <p className="eyebrow">Your prompts</p>
          </div>
          <div className="md:col-span-8">
            <p
              className="font-serif text-xl md:text-2xl leading-snug mb-4"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              Nothing runs on its own. We only see a prompt when you press the key.
            </p>
            <p className="text-base leading-[1.6] mb-4" style={{ color: 'var(--color-paper-mute)' }}>
              We do not read your chats, your browsing, or anything else on the
              page. If you make an account, we keep your prompt history so you
              can look back at it, and we remember your answers so we do not ask
              you the same thing twice. You can see all of it, and delete any of
              it, in your settings.
            </p>
            <Link
              href="/privacy"
              className="text-sm underline underline-offset-4 transition-opacity hover:opacity-80"
              style={{ color: 'var(--color-paper)' }}
            >
              Read the privacy policy
            </Link>
          </div>
        </div>
      </section>
    </main>
  )

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

/**
 * The three things nothing else does. Not "it rewrites your prompt" - everyone
 * says that, and ChatGPT will do it if you ask nicely. These are the reasons
 * to install something.
 */
const DIFFERENCES = [
  {
    title: 'It asks before it rewrites',
    body:
      '"Help me write a song" could mean a love song, a sad song, or something fun. Instead of guessing, it asks you one short question and gives you the answers to tap. Then it rewrites, once, for what you actually meant.',
  },
  {
    title: 'It remembers your answers',
    body:
      'Tell it once that you write for engineering leads, and it stops asking. Next time it offers your usual answer first. It offers, it never assumes, and you can make it forget anything at any time.',
  },
  {
    title: 'Your words are never lost',
    body:
      'The chat box only holds one version at a time. Press Escape to undo, or open Compare to see your original beside the new one and take yours back with one click.',
  },
]
