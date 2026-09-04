'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { NavAuthButton } from './NavAuthButton'
import type { NavKey } from './MarketingNav'

// Motion-wrapped Link so nav rows can carry a `whileTap` pressed state
// while keeping Next's prefetch + anchor semantics.
const MotionLink = motion.create(Link)

interface NavLink {
  key: NavKey
  href: string
  label: string
}

interface MarketingMobileMenuProps {
  links: NavLink[]
  current?: NavKey
}

// Editorial easing used across the app (see globals.css / AppShell).
const EASE = [0.16, 1, 0.3, 1] as const

// Hamburger that morphs into an X. `open` drives the two outer bars to the
// center + rotate while the middle bar fades out. Shared by the top-bar
// trigger and the in-drawer close control so the icon animates in place.
function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-4 w-5.5" aria-hidden>
      <motion.span
        className="absolute left-0 block h-[1.5px] w-full rounded-full"
        style={{ background: 'var(--color-paper)', top: '3px' }}
        animate={open ? { top: '7.25px', rotate: 45 } : { top: '3px', rotate: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      />
      <motion.span
        className="absolute left-0 top-1/2 block h-[1.5px] w-full -translate-y-1/2 rounded-full"
        style={{ background: 'var(--color-paper)' }}
        animate={open ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.2, ease: EASE }}
      />
      <motion.span
        className="absolute left-0 block h-[1.5px] w-full rounded-full"
        style={{ background: 'var(--color-paper)', bottom: '3px' }}
        animate={open ? { bottom: '7.25px', rotate: -45 } : { bottom: '3px', rotate: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
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

export function MarketingMobileMenu({ links, current }: MarketingMobileMenuProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
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

  // Portals need `document`, which only exists after mount on the client.
  useEffect(() => {
    setMounted(true)
  }, [])

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

  const renderGroup = (label: string, items: NavLink[]) => (
    <div>
      <p
        className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em]"
        style={{ color: 'var(--ink-soft)' }}
      >
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((link) => {
          const isCurrent = current === link.key
          return (
            <li key={link.key}>
              <MotionLink
                href={link.href}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(link.href, isCurrent)
                }}
                aria-current={isCurrent ? 'page' : undefined}
                whileTap={{ scale: 0.97, opacity: 0.7 }}
                transition={{ duration: 0.12, ease: EASE }}
                className="relative flex items-center rounded-lg py-2.5 pl-3 pr-3 text-[17px] transition-colors"
                style={{
                  color: isCurrent ? 'var(--color-paper)' : 'var(--color-paper-mute)',
                  fontWeight: isCurrent ? 500 : 400,
                  // Active rows get a faint surface tint so the left bar reads
                  // as a highlighted item, not a stray accent mark.
                  background: isCurrent ? 'rgba(245, 244, 241, 0.04)' : 'transparent',
                }}
              >
                {/* Left active bar: a deliberate, SaaS-style current-page
                    indicator in place of the previous bullet. */}
                {isCurrent && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-full"
                    style={{ background: 'var(--color-accent)' }}
                  />
                )}
                <span>{link.label}</span>
              </MotionLink>
            </li>
          )
        })}
      </ul>
    </div>
  )

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="marketing-mobile-drawer"
        className="btn-icon flex h-11 w-11 -mr-2 items-center justify-center"
      >
        <MenuIcon open={false} />
      </button>

      {/* Portal to <body> so the drawer escapes the header's
          `backdrop-filter`, which would otherwise become the containing
          block for `position: fixed` and trap the panel inside the bar. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Site navigation">
                {/* Backdrop: dims the page that stays visible beside the
                    drawer, and closes on tap. */}
                <motion.div
                  className="absolute inset-0"
                  style={{ background: 'rgba(21,19,15,0.45)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.24, ease: EASE }}
                  onClick={() => setOpen(false)}
                />

                {/* Drawer: slides in from the right at ~82% width. */}
                <motion.aside
                  id="marketing-mobile-drawer"
                  className="absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col"
                  style={{
                    background: 'var(--color-ink)',
                    borderLeft: '1px solid var(--color-rule)',
                    paddingTop: 'env(safe-area-inset-top)',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                  }}
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ duration: 0.32, ease: EASE }}
                >
                  {/* Brand header: logo + product tagline on the left, the
                      animated close (hamburger → X) on the right, aligned to
                      where the trigger sits in the top bar. */}
                  <div
                    className="flex items-start justify-between gap-3 px-5 pb-5 pt-4"
                    style={{ borderBottom: '1px solid var(--color-rule)' }}
                  >
                    <Link href="/" onClick={() => setOpen(false)} className="flex items-start gap-3 pl-1">
                      <Image src="/logo.png" alt="Deepclario" width={34} height={34} className="mt-0.5" />
                      <span className="flex flex-col leading-tight">
                        <span
                          className="text-[16px] tracking-tight"
                          style={{ color: 'var(--color-paper)', fontWeight: 500 }}
                        >
                          Deepclario
                        </span>
                        <span
                          className="text-[12px]"
                          style={{ color: 'var(--color-paper-mute)' }}
                        >
                          AI Prompt Optimization
                        </span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close menu"
                      className="btn-icon -mr-1 flex h-11 w-11 shrink-0 items-center justify-center"
                    >
                      <MenuIcon open />
                    </button>
                  </div>

                  {/* Grouped navigation. Content is top-aligned so Tools is
                      visible immediately on open; groups flow top-down with
                      even rhythm and divider rules. Any spare height falls
                      below the Account block. */}
                  <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-7 pt-5">
                    {renderGroup('Tools', tools)}

                    <div style={{ borderTop: '1px solid var(--color-rule)' }} className="pt-6">
                      {renderGroup('Company', company)}
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-rule)' }} className="pt-6">
                      <p
                        className="px-3 pb-3 text-[11px] font-medium uppercase tracking-[0.14em]"
                        style={{ color: 'var(--ink-soft)' }}
                      >
                        Account
                      </p>
                      <div className="px-1 [&>a]:w-full [&>a]:justify-center [&>a]:py-3 [&>a]:text-[15px]">
                        <NavAuthButton />
                      </div>
                    </div>
                  </nav>
                </motion.aside>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
