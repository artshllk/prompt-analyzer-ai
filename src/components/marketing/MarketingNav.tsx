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
  { key: 'extension', href: '/extension', label: 'Extension' },
  { key: 'detector', href: '/detector', label: 'Detector' },
  { key: 'prompts', href: '/prompts', label: 'Prompts' },
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
        <nav
          className="hidden md:flex items-center gap-7 text-sm"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          {LINKS.map(link => {
            const isCurrent = current === link.key
            return (
              <Link
                key={link.key}
                href={link.href}
                className={
                  isCurrent
                    ? 'opacity-100'
                    : 'hover:opacity-100 transition-opacity opacity-80'
                }
                style={isCurrent ? { color: 'var(--color-paper)' } : undefined}
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
