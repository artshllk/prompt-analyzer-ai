import type { Metadata } from 'next'
import Link from 'next/link'
import { DemoChat } from '@/components/marketing/DemoChat'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { AppFrame } from '@/components/ui/AppFrame'
import { createClient } from '@/lib/supabase/server'
import { defaultOGImage } from '@/lib/og-image'

/**
 * /prompt-improver - the tool on a page of its own.
 *
 * RENAMED FROM /playground. "Playground" is a word nobody searches; "prompt
 * improver" is what people type. The old URL 301s here permanently, and no
 * /tools/ prefix: it was never a real directory, both /tools/* URLs have
 * always 404'd, and a segment nobody searches for adds nothing to a path.
 *
 * Checked before renaming: /playground was the ONLY live URL for this tool.
 * /tools/prompt-improver and /tools/prompt-analyzer both returned 404, so
 * there was no ranking split to fix and no duplicate content.
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

/**
 * Written for what people type, not for what we call it internally.
 *
 * The title used to open with "Try the", which spends the most valuable
 * position in a search result on a verb. The keyword leads now, and the
 * description says what happens and what it costs, because those are the two
 * things somebody scanning results is deciding between.
 */
export const metadata: Metadata = {
  title: 'Free Prompt Improver - Rewrite Any AI Prompt',
  description:
    'Paste a bad prompt and get a clearer one back. Every change is labelled, so you can see what was added and take back anything you did not ask for. Free, no account needed.',
  alternates: { canonical: 'https://deepclario.com/prompt-improver' },
  openGraph: {
    title: 'Free Prompt Improver - Deepclario',
    description:
      'Paste a bad prompt and get a clearer one back, with every change labelled. Free, no account needed.',
    url: 'https://deepclario.com/prompt-improver',
    type: 'website',
    // Pages with their own openGraph object need an explicit image - see
    // defaultOGImage() for why the file-convention fallback doesn't apply.
    images: defaultOGImage('Free Prompt Improver'),
  },
}

/**
 * Two shells, one page.
 *
 * A signed-in visitor gets the app sidebar; everybody else gets the marketing
 * nav. This is not decoration: the improver is now a sidebar destination
 * because Pro is charged for it, and CLAUDE.md's rule is that every sidebar
 * destination must render the app shell. A sidebar item pointing at a
 * marketing-layout route silently drops the user out of their own account,
 * and app-shell.test.ts fails on exactly that. /detector solved this the same
 * way and this follows it rather than inventing a second pattern.
 */
export default async function PromptImproverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = (
    <div className="max-w-4xl mx-auto">
      <p className="eyebrow mb-6">Try it</p>
      <h1
        className="display text-4xl md:text-[3.5rem] leading-[1.05] tracking-tight mb-4"
        style={{ color: 'var(--ink)' }}
      >
        Paste a bad prompt.
      </h1>
      <p className="text-lg leading-relaxed max-w-2xl mb-10" style={{ color: 'var(--ink-soft)' }}>
        Deepclario reads it, asks one question if two readings would give you
        different answers, and rewrites it.
      </p>
      <DemoChat />
    </div>
  )

  if (user) {
    return (
      <AppFrame>
        <main className="pt-8 md:pt-10 pb-16 px-6 md:px-10">{body}</main>
      </AppFrame>
    )
  }

  return (
    <div
      className="editorial grain min-h-screen relative flex flex-col"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      <MarketingNav current="improver" />

      <main className="flex-1 pt-28 md:pt-36 pb-20 md:pb-28 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="eyebrow mb-6">Try it</p>
          <h1
            className="display text-4xl md:text-[3.5rem] leading-[1.05] tracking-tight mb-4"
            style={{ color: 'var(--color-paper)' }}
          >
            Paste a bad prompt.
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
