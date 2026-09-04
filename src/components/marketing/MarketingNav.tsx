import Link from 'next/link'
import Image from 'next/image'
import { NavAuthButton } from './NavAuthButton'
import { MarketingMobileMenu } from './MarketingMobileMenu'
import { NavToolsMenu, type ToolItem } from './NavToolsMenu'

/**
 * Shared marketing nav used across every public-facing surface
 * (homepage, /prompt-improver, /faq, /detector, /extension, /prompts, /blog,
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
  | 'improver'
  | 'detector'
  | 'prompts'
  | 'extension'
  | 'pricing'
  | 'faq'
  | 'blog'

/**
 * The prompt improver is FROZEN, and so is the detector.
 *
 * Neither is deleted. /prompt-improver works, 48 links across 42 files point at it
 * including one inside an email already in people's inboxes, and moving the
 * route breaks those for nothing.
 *
 * They now share one slot under `Tools`. Before this the detector had a
 * top-level slot and the improver had none, which promoted one dead tool and
 * hid the other for no reason anybody chose. Measured: zero `text_detected`
 * rows exist, so nobody signed in has ever run a detection.
 *
 * Check stays first and alone. It is the product, and a first-time visitor
 * should see one thing rather than three.
 */
const TOOL_KEYS: NavKey[] = ['detector', 'improver']

const LINKS: { key: NavKey; href: string; label: string }[] = [
  // The tool IS the homepage now. /check 301s here, so pointing the nav at
  // the old URL would send every visitor through a redirect for nothing.
  { key: 'check', href: '/', label: 'Check' },
  { key: 'detector', href: '/detector', label: 'AI text detector' },
  { key: 'improver', href: '/prompt-improver', label: 'Prompt improver' },
  { key: 'pricing', href: '/pricing', label: 'Pricing' },
  { key: 'faq', href: '/faq', label: 'FAQ' },
  { key: 'blog', href: '/blog', label: 'Blog' },
]

/** The flat row, in order, with the tools lifted out into their own menu. */
const TOP_LEVEL = LINKS.filter(l => !TOOL_KEYS.includes(l.key))

/**
 * One line each, because a bare label makes a reader guess.
 *
 * "AI text detector" and "Prompt improver" are both nouns nobody has met
 * before, and a dropdown that lists two of them is asking somebody to click
 * to find out what they are. Lower case, no full stop: a caption, not a
 * sentence.
 */
const BLURBS: Record<string, string> = {
  detector: 'See if text was written by AI',
  improver: 'Rewrite a rough prompt',
}

const TOOLS: ToolItem[] = TOOL_KEYS.map(k => {
  const link = LINKS.find(l => l.key === k)!
  return { ...link, blurb: BLURBS[k] ?? '' }
})

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
          {TOP_LEVEL.map((link, i) => {
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
          }).flatMap((el, i) =>
            // Tools sits directly after Check, so the product is first and
            // everything secondary is behind one word.
            i === 0 ? [el, <NavToolsMenu key="tools" items={TOOLS} current={current} />] : [el]
          )}
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
