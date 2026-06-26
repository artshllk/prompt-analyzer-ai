'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DISMISS_KEY = 'dc_ext_promo_dismissed_v1'

/**
 * Persistent sidebar promo for the Chrome extension.
 *
 * Sits between the nav and the SidebarProfile. Hairline-bordered card
 * with an accent-blue edge so it reads as a *feature*, not just another
 * nav item. Dismissable - the user can hide it once they have installed
 * the extension. Stored in localStorage; survives across sessions.
 *
 * Hidden automatically when the user is on /extension or /extension/connect.
 */
export function SidebarExtensionPromo() {
  const pathname = usePathname()
  const [hydrated, setHydrated] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1')
    setHydrated(true)
  }, [])

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  // Don't render anything before hydration so the SSR/CSR HTML matches.
  if (!hydrated) return null

  // Hide if dismissed, or if the user is already on the extension flow.
  if (dismissed) return null
  if (pathname.startsWith('/extension')) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:block mx-4 mb-4 relative"
      >
        <div
          className="relative rounded-xl p-4 overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, var(--color-ink-card-elevated) 0%, var(--color-ink-card) 100%)',
            border: '1px solid var(--color-rule-strong)',
            boxShadow:
              '0 1px 0 rgba(245, 244, 241, 0.04) inset, 0 20px 40px -24px rgba(0, 0, 0, 0.65)',
          }}
        >
          {/* Soft accent glow in the top-right corner - gives the card
              a focal point without using a literal icon. */}
          <div
            aria-hidden="true"
            className="absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at center, var(--color-accent-glow), transparent 70%)',
              filter: 'blur(14px)',
            }}
          />

          <div className="flex items-start justify-between gap-2 mb-2 relative">
            <p
              className="text-[10px] font-medium tracking-[0.16em] uppercase"
              style={{ color: 'var(--color-accent-bright)' }}
            >
              Chrome extension
            </p>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="btn-icon -mt-0.5 -mr-1 p-1 rounded"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3 3L9 9M9 3L3 9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <p
            className="text-[13px] leading-snug mb-3 relative"
            style={{ color: 'var(--color-paper)' }}
          >
            Improve prompts right inside ChatGPT, Claude, and Gemini.
          </p>

          <Link
            href="/extension"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-opacity hover:opacity-80 relative"
            style={{ color: 'var(--color-accent-bright)' }}
          >
            Install free
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7H12M12 7L7 2M12 7L7 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
