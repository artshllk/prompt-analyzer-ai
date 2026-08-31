import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'

/**
 * There was no not-found.tsx at all, so every 404 on the site rendered the
 * unstyled Next.js default: black text on white, in the middle of a dark
 * editorial site. It looked like the deploy was broken rather than like the
 * page was missing.
 *
 * A 404 is also the last thing a reader sees before they leave, so it gets
 * the three destinations that are actually useful: the tool, the blog, and
 * the home page.
 */

export default function NotFound() {
  return (
    <div
      className="editorial grain min-h-screen relative flex flex-col"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      <MarketingNav />

      <main className="flex-1 flex items-center px-6 md:px-10 pt-28 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <p className="eyebrow mb-6">404</p>
          <h1
            className="display text-4xl md:text-6xl leading-[1.05] tracking-tight mb-5"
            style={{ color: 'var(--color-paper)' }}
          >
            That page is not here.
          </h1>
          <p
            className="text-lg leading-relaxed mb-10"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            It may have moved, or the link may be wrong. Here is where most
            people are heading.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/playground"
              className="inline-flex items-center px-7 py-3.5 rounded-full text-[15px] transition-all btn-paper"
              style={{
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                fontWeight: 500,
              }}
            >
              Try the prompt improver
            </Link>
            <Link
              href="/blog"
              className="text-sm underline underline-offset-4 opacity-80 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-paper)' }}
            >
              Read the blog
            </Link>
            <Link
              href="/"
              className="text-sm underline underline-offset-4 opacity-80 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-paper)' }}
            >
              Go home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
