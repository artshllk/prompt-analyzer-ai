'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { NavKey } from './MarketingNav'
import type { NavLink } from './MarketingMobileDrawer'

/**
 * THE DRAWER IS LOADED ON FIRST OPEN, NOT WITH THE PAGE. It is the only
 * framer-motion importer on a blog post, and MarketingNav renders on all 56 of
 * them. Shipping ~150K of animation library to every reader arriving from
 * search, to animate a menu most never open, is the wrong trade. `ssr: false`
 * because it portals into document.body and so cannot render on the server
 * anyway.
 */
const MarketingMobileDrawer = dynamic(
  () => import('./MarketingMobileDrawer').then((m) => m.MarketingMobileDrawer),
  { ssr: false },
)

interface MarketingMobileMenuProps {
  links: NavLink[]
  current?: NavKey
}

/**
 * The trigger's icon, in its closed state only.
 *
 * Plain CSS, not framer. The trigger never animates: it always rendered the
 * icon closed, and the morph to an X happens on the drawer's own close button,
 * which lives in the lazily loaded module. Keeping this static is what lets a
 * blog post ship no animation library at all.
 */
function MenuIcon() {
  return (
    <span className="relative block h-4 w-5.5" aria-hidden>
      <span
        className="absolute left-0 block h-[1.5px] w-full rounded-full"
        style={{ background: 'var(--color-paper)', top: '3px' }}
      />
      <span
        className="absolute left-0 top-1/2 block h-[1.5px] w-full -translate-y-1/2 rounded-full"
        style={{ background: 'var(--color-paper)' }}
      />
      <span
        className="absolute left-0 block h-[1.5px] w-full rounded-full"
        style={{ background: 'var(--color-paper)', bottom: '3px' }}
      />
    </span>
  )
}

// Explicit navigation groups, matching the desktop nav rather than inventing
// a second information architecture. Order within each group is fixed here
// (independent of the flat `links` prop) so the hierarchy stays deliberate.
//
// "Tools" is the same word and the same two items as the desktop dropdown.
// Prompts and Extension came out because they are footer-only now, and a key
// that is not in `links` silently resolves to nothing, which is how this list
// quietly rotted before.
const TOOL_KEYS: NavKey[] = ['detector', 'improver']
const COMPANY_KEYS: NavKey[] = ['pricing', 'blog', 'faq']

// `md` breakpoint in px. Below this the mobile drawer is active; at or above
// it the component renders nothing so the mobile system - state, effects,
// portal, animations - never mounts or runs on desktop.
const MOBILE_MAX_WIDTH = 767.98

function useIsMobile() {
  // Stays `undefined` on the server AND the first client render so hydration
  // matches exactly (no mismatch). The effect then measures the viewport and
  // flips it. Because the drawer trigger is server-rendered inside the
  // `md:hidden` wrapper, mobile shows it immediately (the effect confirming
  // `true` changes nothing visible) and desktop only ever sees it hidden by
  // CSS before the effect unmounts it - so neither device flickers.
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  return isMobile
}

/**
 * Mobile-only navigation for the marketing surface.
 *
 * The desktop MarketingNav hides its link row below `md`. This renders a
 * hamburger that opens a right-side drawer (~82% of the viewport, so the
 * page stays partly visible behind a backdrop). Links are grouped into
 * Product and Company sections with a distinct Account section for the
 * auth CTA. The active page is highlighted.
 *
 * Only rendered `md:hidden` by the parent, so it never competes with the
 * inline desktop nav.
 */
export function MarketingMobileMenu({ links, current }: MarketingMobileMenuProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  // Once the drawer has been opened it stays mounted, so its exit animation
  // can play instead of being unmounted mid-flight.
  const [everOpened, setEverOpened] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Close the drawer first, then navigate once the exit animation has had
  // a moment to play - so tapping a link feels like a deliberate transition
  // rather than an instant hard swap. Same-page taps just close.
  const navigate = (href: string, isCurrent: boolean) => {
    setOpen(false)
    if (isCurrent) return
    window.setTimeout(() => router.push(href), 180)
  }

  // Close on route change so a tap that navigates also dismisses the drawer.
  // (Matches the sidebar drawer convention in AppShell.)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll + allow Escape to close while the drawer is open.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // All hooks have run above (Rules of Hooks). Below this point nothing
  // renders on desktop: once measured as desktop (`isMobile === false`) the
  // mobile drawer, its portal, and its animations never enter the tree, so
  // there is no shared logic with the static desktop nav. When `isMobile`
  // is `undefined` (server + first client paint) we DO render the wrapper -
  // it is `md:hidden`, so CSS hides it on desktop and the client hydration
  // matches the server on both mobile and desktop (no mismatch, no flash).
  if (isMobile === false) return null

  // Resolve group keys against the links the parent passes so hrefs/labels
  // stay in one place, while the grouping + order live here.
  const byKey = new Map(links.map((l) => [l.key, l]))
  const tools = TOOL_KEYS.map((k) => byKey.get(k)).filter(Boolean) as NavLink[]
  const company = COMPANY_KEYS.map((k) => byKey.get(k)).filter(Boolean) as NavLink[]

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => {
          setEverOpened(true)
          setOpen(true)
        }}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="marketing-mobile-drawer"
        className="btn-icon flex h-11 w-11 -mr-2 items-center justify-center"
      >
        <MenuIcon />
      </button>

      {everOpened && (
        <MarketingMobileDrawer
          open={open}
          onClose={() => setOpen(false)}
          onNavigate={navigate}
          tools={tools}
          company={company}
          current={current}
        />
      )}
    </div>
  )
}
