'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface WaitlistModalProps {
  open: boolean
  onClose: () => void
}

const PRO_FEATURES = [
  'Unlimited prompt analyses',
  'Full session history',
  'Weekly insights & pattern reports',
  'Mistake pattern analysis',
]

export function WaitlistModal({ open, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-md glass rounded-2xl p-8 border border-[#2d4070]"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

            {status === 'done' ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12L10 17L19 8" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#f0f4ff] mb-2">You&apos;re on the list</h2>
                <p className="text-[#8b9cc8] text-sm mb-6">
                  We&apos;ll email you the moment Pro goes live - usually within a few days.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
                >
                  Got it
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-violet-400">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#f0f4ff] mb-2">Pro is launching soon</h2>
                  <p className="text-[#8b9cc8] text-sm leading-relaxed">
                    We&apos;re finalizing payment processing. Leave your email and you&apos;ll be first to know - and first in line.
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {PRO_FEATURES.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-[#8b9cc8]">
                      <div className="w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3 5.5L6.5 2" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0e1a] border border-[#1e2d4a] text-[#f0f4ff] placeholder:text-[#4a5a80] outline-none focus:border-violet-500/60 text-sm transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-3.5 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 active:scale-[0.98] transition-all disabled:opacity-50 glow-violet"
                  >
                    {status === 'loading' ? 'Saving...' : 'Notify me when Pro launches'}
                  </button>
                  {status === 'error' && (
                    <p className="text-xs text-rose-400 text-center">Something went wrong. Try again.</p>
                  )}
                </form>

                <button
                  onClick={onClose}
                  className="w-full py-2 mt-2 text-sm text-[#4a5a80] hover:text-[#8b9cc8] transition-colors"
                >
                  Maybe later
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
