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
      className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600/10 via-violet-500/5 to-cyan-500/5 p-7"
    >
      <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />

      <AnimatePresence mode="wait">
        {view === 'gate' && (
          <motion.div key="gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L13.5 8H20L14.5 11.8L16.5 18L11 14.2L5.5 18L7.5 11.8L2 8H8.5L11 2Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#f0f4ff] mb-1.5">
              You&apos;ve used your {limit} free analyses
            </h3>
            <p className="text-sm text-[#8b9cc8] max-w-sm mx-auto mb-6">
              Get <strong className="text-[#f0f4ff]">3 more free analyses</strong> instantly with your email —
              or sign in to unlock 25 every month plus history and insights.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <button
                onClick={() => setView('email')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all glow-violet"
              >
                Get 3 more free →
              </button>
              <button
                onClick={() => setView('auth')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#2d4070] text-[#cdd5ee] hover:border-[#4a5a80] text-sm font-medium transition-all"
              >
                Sign in / Sign up
              </button>
            </div>
            <p className="text-xs text-[#4a5a80]">{used} of {limit} used — we won&apos;t spam you</p>
          </motion.div>
        )}

        {view === 'email' && (
          <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <h3 className="text-lg font-bold text-[#f0f4ff] mb-1.5">Get 3 more free analyses</h3>
            <p className="text-sm text-[#8b9cc8] mb-5">Enter your email and we&apos;ll unlock 3 more analyses right now.</p>
            <form onSubmit={submitEmail} className="max-w-sm mx-auto space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0e1a] border border-[#2d4070] focus:border-violet-500 text-[#f0f4ff] text-sm outline-none transition-colors placeholder:text-[#4a5a80]"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold transition-all"
              >
                {loading ? 'Unlocking...' : 'Unlock 3 more analyses →'}
              </button>
            </form>
            <button onClick={() => setView('gate')} className="mt-3 text-xs text-[#4a5a80] hover:text-[#8b9cc8] transition-colors">
              ← Back
            </button>
          </motion.div>
        )}

        {view === 'email_success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 11L9 16L18 6" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#f0f4ff] mb-1.5">3 analyses unlocked!</h3>
            <p className="text-sm text-[#8b9cc8] mb-5">
              You can keep going. Sign up free for 25 analyses every month.
            </p>
            <Link
              href="/login?redirectTo=/playground"
              className="inline-block px-5 py-2.5 rounded-xl border border-[#2d4070] text-[#cdd5ee] hover:border-violet-500/40 text-sm font-medium transition-all"
            >
              Sign up for 25/month free →
            </Link>
          </motion.div>
        )}

        {view === 'auth' && (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <h3 className="text-lg font-bold text-[#f0f4ff] mb-1.5">Sign in to continue</h3>
            <p className="text-sm text-[#8b9cc8] max-w-sm mx-auto mb-5">
              Free account includes 25 analyses a month, full history, and insights.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <Link
                href="/login?redirectTo=/playground"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all glow-violet"
              >
                Continue with Google
              </Link>
              <Link
                href="/login?redirectTo=/playground"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#2d4070] text-[#cdd5ee] hover:border-[#4a5a80] text-sm font-medium transition-all"
              >
                Sign in with email
              </Link>
            </div>
            <button onClick={() => setView('gate')} className="text-xs text-[#4a5a80] hover:text-[#8b9cc8] transition-colors">
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
