import Link from 'next/link'
import Image from 'next/image'
import { NavAuthButton } from './NavAuthButton'
import { MarketingMobileMenu } from './MarketingMobileMenu'

/**
 * Shared marketing nav used across every public-facing surface
 * (homepage, /playground, /faq, /detector, /extension, /prompts, /blog,
 * blog posts).
 *
 * Keeps the link set in one place so a content page never drifts from
 * the homepage. Pass `current` to subtly highlight the active link.
 *
 * Anchors that target the homepage are scoped as `/#anchor` so they
 * also work from non-home pages (Next router handles the scroll on
 * arrival).
 */

// Exported so MarketingMobileMenu shares this exact union. It used to keep
// its own copy, which meant adding a nav link broke the build in a file that
// had not changed.
export type NavKey =
  | 'home'
  | 'check'
  | 'playground'
  | 'detector'
  | 'prompts'
  | 'extension'
  | 'pricing'
  | 'faq'
  | 'blog'

/**
 * The prompt improver is FROZEN and off the nav. It still lives and works at
 * /playground, which is deliberate: 48 links across 42 files point there,
 * including one inside an email already sitting in people's inboxes
 * (lib/email/templates.ts). Moving or redirecting the route breaks those and
 * gains nothing. Taking it off the nav is the whole demotion.
 *
 * The 'playground' NavKey stays in the union below so `current="playground"`
 * still type-checks on the page itself.
 */
const LINKS: { key: NavKey; href: string; label: string }[] = [
  // Check is first because it is the product now.
  //
  // Extension and Prompts came out of here and moved to the footer. Both point
  // at the frozen prompt improver, and a frozen product sitting beside the live
  // one in the same nav tells a visitor they are equals. The routes are
  // untouched: every existing link still resolves, which is the same rule that
  // kept /playground where it is.
  // The tool IS the homepage now. /check 301s here, so pointing the nav at
  // the old URL would send every visitor through a redirect for nothing.
  { key: 'check', href: '/', label: 'Check' },
  { key: 'detector', href: '/detector', label: 'Detector' },
  { key: 'pricing', href: '/pricing', label: 'Pricing' },
  { key: 'faq', href: '/faq', label: 'FAQ' },
  { key: 'blog', href: '/blog', label: 'Blog' },
]

interface MarketingNavProps {
  current?: NavKey
}

export function MarketingNav({ current }: MarketingNavProps = {}) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md"
      style={{
        background: 'rgba(241, 240, 234, 0.82)',
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
        {/* CONTRAST. --ink-soft measures 5.07:1 on the paper ground, which
            passes AA at 14px. The old `opacity-80` on inactive links dropped
            that to an effective #868176 and 3.40:1, which fails. Opacity is a
            contrast decision wearing a costume, so state is carried by colour
            and weight instead and every item stays measurably legible. */}
        <nav className="hidden md:flex items-center gap-7 text-sm">
          {LINKS.map(link => {
            const isCurrent = current === link.key
            return (
              <Link
                key={link.key}
                href={link.href}
                className="transition-colors hover:text-[var(--ink)]"
                style={{
                  color: isCurrent ? 'var(--ink)' : 'var(--ink-soft)',
                  fontWeight: isCurrent ? 500 : 400,
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
        {/* Desktop auth CTA lives inline; the mobile menu carries its own
            copy of the CTA inside the sheet. */}
        <div className="hidden md:flex items-center gap-2">
          <NavAuthButton />
        </div>

        {/* Mobile: hamburger → full-screen sheet with the same link set. */}
        <MarketingMobileMenu links={LINKS} current={current} />
      </div>
    </header>
  )
}
