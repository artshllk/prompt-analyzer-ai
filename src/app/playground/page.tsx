import type { Metadata } from 'next'
import Link from 'next/link'
import { DemoChat } from '@/components/marketing/DemoChat'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { defaultOGImage } from '@/lib/og-image'

/**
 * /playground - the tool on a page of its own.
 *
 * This route was deleted during the extension-first pivot and redirected to
 * /extension, on the reasoning that nobody writes a prompt on one site to run
 * it on another. That reasoning held for the product story and not for the
 * link graph: thirty-six files still pointed here, almost all of them blog
 * posts sending a reader who just finished an article to "go try it". Every
 * one of those readers landed on an install page for a browser extension
 * instead of on the thing they were promised.
 *
 * So the tool comes back as a page. It runs `DemoChat`, the same component
 * the homepage hero uses, against `/api/anon/analyze` with no account and no
 * install. The blog keeps a real destination, and the extension keeps being
 * the thing you use once you are convinced.
 */

export const metadata: Metadata = {
  title: 'Try the prompt improver',
  description:
    'Paste a rough prompt and see it rewritten. Deepclario shows you what it added and what it guessed, so you can take back anything you did not ask for. No account needed.',
  alternates: { canonical: 'https://deepclario.com/playground' },
  openGraph: {
    title: 'Try the prompt improver - Deepclario',
    description:
      'Paste a rough prompt and see it rewritten, with every added constraint labelled. No account needed.',
    url: 'https://deepclario.com/playground',
    type: 'website',
    // Pages with their own openGraph object need an explicit image - see
    // defaultOGImage() for why the file-convention fallback doesn't apply.
    images: defaultOGImage('Try the prompt improver'),
  },
}

export default function PlaygroundPage() {
  return (
    <div
      className="editorial grain min-h-screen relative flex flex-col"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      <MarketingNav current="playground" />

      <main className="flex-1 pt-28 md:pt-36 pb-20 md:pb-28 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="eyebrow mb-6">Try it</p>
          <h1
            className="display text-4xl md:text-[3.5rem] leading-[1.05] tracking-tight mb-4"
            style={{ color: 'var(--color-paper)' }}
          >
            Paste a rough prompt.
          </h1>
          <p
            className="text-lg leading-relaxed max-w-2xl mb-10 md:mb-14"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            Deepclario reads it, asks one question if two readings would give
            you different answers, and rewrites it. No account, no install.
          </p>

          <DemoChat />

          <p
            className="mt-10 text-sm"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            Your prompts are private. We do not train on them.{' '}
            <Link
              href="/privacy"
              className="underline underline-offset-4"
              style={{ color: 'var(--color-paper)' }}
            >
              How we handle your data
            </Link>
          </p>
        </div>
      </main>

      <footer
        className="px-6 md:px-10 py-10"
        style={{ borderTop: '1px solid var(--color-rule)' }}
      >
        <div
          className="max-w-4xl mx-auto text-xs flex flex-wrap gap-x-4 gap-y-2"
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
            href="/extension"
            className="underline underline-offset-4"
            style={{ color: 'var(--color-paper)' }}
          >
            Get the extension
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
