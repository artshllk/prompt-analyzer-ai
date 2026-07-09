'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Editorial-styled signup gate for the homepage LivePromptDemo.
 *
 * Triggered after a visitor uses the demo `limit` times (tracked in
 * localStorage on the demo component side). Funnels the visitor toward
 * either:
 *   - dropping their email for 3 more free runs (uses the existing
 *     /api/anon/capture-email endpoint shared with the playground), or
 *   - creating a free account (limits defined in src/lib/limits.ts).
 *
 * Visually quieter than the playground's SignupGate because the
 * homepage uses the editorial palette. Uses the accent blue for the
 * primary action and the paper/ink button system for the email submit.
 */

interface Props {
  used: number
  limit: number
  /** Called after the email is captured and the server returns the
   *  extra-analyses grant. The demo component then bumps its local
   *  counter so the user can continue. */
  onEmailCaptured?: (extraAnalyses: number) => void
}

type View = 'gate' | 'email' | 'success'

export function DemoSignupGate({ used, limit, onEmailCaptured }: Props) {
  const [view, setView] = useState<View>('gate')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/anon/capture-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(
          data.error === 'invalid_email'
            ? 'Please enter a valid email.'
            : 'Something went wrong. Try again.',
        )
        return
      }
      setView('success')
      onEmailCaptured?.(data.extraAnalyses ?? 3)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="card-editorial p-7 md:p-9"
    >
      <AnimatePresence mode="wait">
        {view === 'gate' && (
          <motion.div
            key="gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="eyebrow mb-4">Free demo limit</p>
            <h3
              className="font-serif text-2xl md:text-3xl mb-4 leading-tight"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              You have used your {limit} free demo runs.
            </h3>
            <p
              className="text-base md:text-lg leading-[1.6] mb-7 max-w-xl"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              Drop your email for three more right here, or create a free
              account for 5 rewrites every 48 hours plus history and the
              browser extension.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setView('email')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] transition-all btn-paper"
                style={{
                  background: 'var(--color-paper)',
                  color: 'var(--color-ink)',
                  fontWeight: 500,
                }}
              >
                Get 3 more with my email
              </button>
              <Link
                href="/login?signup=1&redirectTo=/playground"
                className="text-sm transition-opacity hover:opacity-100 opacity-80 underline underline-offset-4"
                style={{ color: 'var(--color-paper)' }}
              >
                Or create a free account
              </Link>
            </div>

            <p
              className="mt-6 text-xs"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              {used} of {limit} used. We will not spam you.
            </p>
          </motion.div>
        )}

        {view === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="eyebrow mb-4">Three more, on the house</p>
            <h3
              className="font-serif text-2xl md:text-3xl mb-4 leading-tight"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              Drop your email.
            </h3>
            <p
              className="text-base md:text-lg leading-[1.6] mb-6 max-w-xl"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              We will unlock three more runs right here. No newsletter
              spam, just the unlock.
            </p>

            <form onSubmit={submitEmail} className="max-w-md">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="flex-1 min-w-[220px] px-4 py-3 rounded-full text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--color-ink-card)',
                    color: 'var(--color-paper)',
                    border: '1px solid var(--color-rule-strong)',
                    fontFamily: 'var(--font-inter)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--color-rule-strong)'
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] btn-paper disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{
                    background: 'var(--color-paper)',
                    color: 'var(--color-ink)',
                    fontWeight: 500,
                  }}
                >
                  {loading ? 'Unlocking…' : 'Unlock 3 more'}
                </button>
              </div>
              {error && (
                <p className="mt-3 text-xs" style={{ color: '#E89A6B' }}>
                  {error}
                </p>
              )}
            </form>

            <button
              onClick={() => setView('gate')}
              className="mt-5 text-xs transition-opacity hover:opacity-100 opacity-70"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              ← Back
            </button>
          </motion.div>
        )}

        {view === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className="eyebrow mb-4"
              style={{ color: 'var(--color-accent-bright)' }}
            >
              Unlocked
            </p>
            <h3
              className="font-serif text-2xl md:text-3xl mb-4 leading-tight"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              Three more runs are yours.
            </h3>
            <p
              className="text-base md:text-lg leading-[1.6] mb-6 max-w-xl"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              Keep going below. When you want history and 5 rewrites every
              48 hours, a free account takes 10 seconds.
            </p>
            <Link
              href="/login?signup=1&redirectTo=/playground"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
              style={{
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                fontWeight: 500,
              }}
            >
              Create a free account
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7H12M12 7L7 2M12 7L7 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
