'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface WaitlistModalProps {
  open: boolean
  onClose: () => void
}

const PRO_FEATURES = [
  'A monthly allowance of prompt improvements',
  'A stronger model on every improve',
  'Full session history',
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
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(21, 19, 15, 0.45)' }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-md rounded-2xl p-8"
            style={{ background: 'var(--card)', border: '1px solid var(--rule)', boxShadow: '0 24px 60px rgba(21,19,15,0.18)' }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px" style={{ background: 'var(--brand)' }} />

            {status === 'done' ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12L10 17L19 8" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[color:var(--ink)] mb-2">You&apos;re on the list</h2>
                <p className="text-[#8b9cc8] text-sm mb-6">
                  We&apos;ll email you the moment Pro goes live - usually within a few days.
                </p>
                <button
                  onClick={onClose}
                  className="btn-brand px-6 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Got it
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'var(--machine-bg)', border: '1px solid var(--machine)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--machine)' }}>
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[color:var(--ink)] mb-2">Pro is launching soon</h2>
                  <p className="text-[#8b9cc8] text-sm leading-relaxed">
                    We&apos;re finalizing payment processing. Leave your email and you&apos;ll be first to know - and first in line.
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {PRO_FEATURES.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-[#8b9cc8]">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--machine-bg)', border: '1px solid var(--machine)' }}>
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
                    className="w-full px-4 py-3 rounded-xl outline-none text-sm transition-colors"
                    style={{ background: 'var(--paper)', border: '1px solid var(--rule)', color: 'var(--ink)' }}
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="btn-brand w-full py-3.5 rounded-xl font-semibold active:scale-[0.98] disabled:opacity-50"
                  >
                    {status === 'loading' ? 'Saving...' : 'Notify me when Pro launches'}
                  </button>
                  {status === 'error' && (
                    <p className="text-xs text-rose-400 text-center">Something went wrong. Try again.</p>
                  )}
                </form>

                <button
                  onClick={onClose}
                  className="w-full py-2 mt-2 text-sm text-[color:var(--ink-soft)] hover:text-[color:var(--ink)] transition-colors"
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
