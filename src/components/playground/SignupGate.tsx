'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface SignupGateProps {
  used: number
  limit: number
  onEmailCaptured?: (extraAnalyses: number) => void
}

type View = 'gate' | 'email' | 'email_success' | 'auth'

/* Free-plan pitch shown in the gate. Must match src/lib/limits.ts
   (REWRITE_FREE_LIMIT per REWRITE_WINDOW_HOURS rolling window). */
const FREE_PLAN_PITCH = '5 rewrites every 48 hours plus history'

export function SignupGate({ used, limit, onEmailCaptured }: SignupGateProps) {
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
        setError(data.error === 'invalid_email' ? 'Please enter a valid email.' : 'Something went wrong. Try again.')
        return
      }
      setView('email_success')
      onEmailCaptured?.(data.extraAnalyses ?? 3)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="card-editorial relative overflow-hidden p-7"
    >
      <AnimatePresence mode="wait">
        {view === 'gate' && (
          <motion.div key="gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <p className="eyebrow mb-4">Free limit reached</p>
            <h3 className="font-serif text-2xl mb-2" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
              You&apos;ve used your {limit} free {limit === 1 ? 'rewrite' : 'rewrites'}
            </h3>
            <p className="text-sm max-w-sm mx-auto mb-6" style={{ color: 'var(--color-paper-mute)' }}>
              Get <strong style={{ color: 'var(--color-paper)' }}>3 more free rewrites</strong> instantly
              with your email, or create a free account for {FREE_PLAN_PITCH}.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <button
                onClick={() => setView('email')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-sm transition-all btn-paper"
                style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
              >
                Get 3 more free →
              </button>
              <button
                onClick={() => setView('auth')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-sm transition-all btn-outline"
                style={{ border: '1px solid var(--color-rule)', color: 'var(--color-paper)' }}
              >
                Sign in / Sign up
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>
              {used} of {limit} used · we won&apos;t spam you
            </p>
          </motion.div>
        )}

        {view === 'email' && (
          <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <h3 className="font-serif text-2xl mb-2" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
              Get 3 more free rewrites
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-paper-mute)' }}>
              Enter your email and we&apos;ll unlock 3 more rewrites right now.
            </p>
            <form onSubmit={submitEmail} className="max-w-sm mx-auto space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 rounded-full text-sm outline-none transition-colors"
                style={{
                  background: 'var(--color-ink)',
                  border: '1px solid var(--color-rule)',
                  color: 'var(--color-paper)',
                }}
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-full text-sm transition-all btn-paper disabled:opacity-60"
                style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
              >
                {loading ? 'Unlocking...' : 'Unlock 3 more rewrites →'}
              </button>
            </form>
            <button
              onClick={() => setView('gate')}
              className="mt-3 text-xs transition-opacity opacity-70 hover:opacity-100"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              ← Back
            </button>
          </motion.div>
        )}

        {view === 'email_success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--color-accent-soft)' }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 11L9 16L18 6" stroke="var(--color-accent-bright)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-serif text-2xl mb-2" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
              3 rewrites unlocked
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--color-paper-mute)' }}>
              You can keep going. A free account gets you {FREE_PLAN_PITCH}.
            </p>
            <Link
              href="/login?redirectTo=/playground"
              className="inline-block px-5 py-2.5 rounded-full text-sm transition-all btn-outline"
              style={{ border: '1px solid var(--color-rule)', color: 'var(--color-paper)' }}
            >
              Create a free account →
            </Link>
          </motion.div>
        )}

        {view === 'auth' && (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <h3 className="font-serif text-2xl mb-2" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
              Sign in to continue
            </h3>
            <p className="text-sm max-w-sm mx-auto mb-5" style={{ color: 'var(--color-paper-mute)' }}>
              A free account includes {FREE_PLAN_PITCH}.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <Link
                href="/login?redirectTo=/playground"
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-sm transition-all btn-paper"
                style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
              >
                Continue with Google
              </Link>
              <Link
                href="/login?redirectTo=/playground"
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-sm transition-all btn-outline"
                style={{ border: '1px solid var(--color-rule)', color: 'var(--color-paper)' }}
              >
                Sign in with email
              </Link>
            </div>
            <button
              onClick={() => setView('gate')}
              className="text-xs transition-opacity opacity-70 hover:opacity-100"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
