'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { NavAuthButton } from './NavAuthButton'
import type { NavKey } from './MarketingNav'

/**
 * The animated half of the mobile menu, split out so framer-motion is not in
 * the marketing bundle.
 *
 * WHY THIS IS ITS OWN FILE. MarketingNav renders on every marketing page,
 * including all 56 blog posts, and this drawer was the only thing on a blog
 * page importing framer-motion. That put roughly 150K of animation library in
 * front of every reader arriving from search, to animate a menu most of them
 * never open. MarketingMobileMenu now loads this lazily on first open.
 *
 * The trigger button stayed behind: it only ever renders the icon in its
 * closed state, so it needs no animation and is plain CSS there.
 */

export interface NavLink {
  key: NavKey
  href: string
  label: string
}

// Editorial easing used across the app (see globals.css / AppShell).
const EASE = [0.16, 1, 0.3, 1] as const

// Motion-wrapped Link so nav rows can carry a `whileTap` pressed state
// while keeping Next's prefetch + anchor semantics.
const MotionLink = motion.create(Link)

// The close control inside the drawer: hamburger morphed into an X.
function CloseIcon() {
  return (
    <span className="relative block h-4 w-5.5" aria-hidden>
      <motion.span
        className="absolute left-0 block h-[1.5px] w-full rounded-full"
        style={{ background: 'var(--color-paper)', top: '3px' }}
        animate={{ top: '7.25px', rotate: 45 }}
        transition={{ duration: 0.3, ease: EASE }}
      />
      <motion.span
        className="absolute left-0 top-1/2 block h-[1.5px] w-full -translate-y-1/2 rounded-full"
        style={{ background: 'var(--color-paper)' }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE }}
      />
      <motion.span
        className="absolute left-0 block h-[1.5px] w-full rounded-full"
        style={{ background: 'var(--color-paper)', bottom: '3px' }}
        animate={{ bottom: '7.25px', rotate: -45 }}
        transition={{ duration: 0.3, ease: EASE }}
      />
    </span>
  )
}

export function MarketingMobileDrawer({
  open,
  onClose,
  onNavigate,
  tools,
  company,
  current,
}: {
  open: boolean
  onClose: () => void
  onNavigate: (href: string, isCurrent: boolean) => void
  tools: NavLink[]
  company: NavLink[]
  current?: NavKey
}) {
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
                  onNavigate(link.href, isCurrent)
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

  /* Portal to <body> so the drawer escapes the header's `backdrop-filter`,
     which would otherwise become the containing block for `position: fixed`
     and trap the panel inside the bar. */
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Site navigation">
          {/* Backdrop: dims the page that stays visible beside the drawer,
              and closes on tap. */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(21,19,15,0.45)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: EASE }}
            onClick={onClose}
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
            {/* Brand header: logo + product tagline on the left, the animated
                close (hamburger → X) on the right, aligned to where the
                trigger sits in the top bar. */}
            <div
              className="flex items-start justify-between gap-3 px-5 pb-5 pt-4"
              style={{ borderBottom: '1px solid var(--color-rule)' }}
            >
              <Link href="/" onClick={onClose} className="flex items-start gap-3 pl-1">
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
                    Source checker
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="btn-icon -mr-1 flex h-11 w-11 shrink-0 items-center justify-center"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Grouped navigation. Content is top-aligned so Tools is visible
                immediately on open; groups flow top-down with even rhythm and
                divider rules. Any spare height falls below the Account
                block. */}
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
  )
}
