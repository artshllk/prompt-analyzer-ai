'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Hard account-gate shown after an anonymous visitor uses their one free
 * run. No dismiss, no email capture, no feature list - just the account
 * ask, landing the moment they have seen the product work once.
 *
 * Copy is fixed by product spec and must not drift:
 *   headline  "You've seen what it can do."
 *   subline   "Create a free account to keep going."
 *   primary   "Create account"
 *   secondary "Sign in instead"
 */

interface AccountGateModalProps {
  open: boolean
}

export function AccountGateModal({ open }: AccountGateModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-gate-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-6"
      style={{ background: 'rgba(14,14,16,0.85)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="card-editorial w-full max-w-md p-8 md:p-10 text-center"
        style={{ background: 'var(--color-ink)' }}
      >
        <h2
          id="account-gate-title"
          className="font-serif text-3xl md:text-4xl leading-tight mb-3"
          style={{ color: 'var(--color-paper)', fontWeight: 400 }}
        >
          You&apos;ve seen what it can do.
        </h2>
        <p
          className="text-base md:text-lg leading-relaxed mb-8"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          Create a free account to keep going.
        </p>
        <Link
          href="/login?signup=1&redirectTo=/playground"
          className="inline-flex items-center justify-center px-7 py-3 rounded-full text-[15px] btn-paper transition-all"
          style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
        >
          Create account
        </Link>
        <div className="mt-5">
          <Link
            href="/login"
            className="text-xs underline underline-offset-4 transition-opacity hover:opacity-100 opacity-60"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  )
}
