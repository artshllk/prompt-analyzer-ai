'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PaywallModalProps {
  open: boolean
  onClose: () => void
}

const PRO_FEATURES = [
  'Unlimited prompt analyses',
  'Full session history forever',
  'Weekly insights & pattern reports',
  'Mistake pattern analysis',
  'CSV export',
]

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<'pro_monthly' | 'pro_annual'>('pro_monthly')

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
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
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md glass rounded-2xl p-8 border border-[#2d4070]"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Glow accent */}
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-violet-400">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#f0f4ff] mb-2">You&apos;ve hit your limit</h2>
              <p className="text-[#8b9cc8] text-sm leading-relaxed">
                You&apos;ve used all 25 free analyses this month.
                Upgrade to keep going.
              </p>
            </div>

            {/* Plan toggle */}
            <div className="flex rounded-xl bg-[#0a0e1a] border border-[#1e2d4a] p-1 mb-6">
              {(['pro_monthly', 'pro_annual'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    plan === p
                      ? 'bg-violet-600 text-white shadow-lg'
                      : 'text-[#8b9cc8] hover:text-[#f0f4ff]'
                  }`}
                >
                  {p === 'pro_monthly' ? (
                    <span>Monthly <span className="font-bold">$4.99</span></span>
                  ) : (
                    <span>Annual <span className="font-bold">$47.88</span> <span className="text-emerald-400 text-xs">Save 20%</span></span>
                  )}
                </button>
              ))}
            </div>

            {/* Features */}
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

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 active:scale-[0.98] transition-all disabled:opacity-50 glow-violet mb-3"
            >
              {loading ? 'Redirecting...' : 'Upgrade to Pro'}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-[#4a5a80] hover:text-[#8b9cc8] transition-colors"
            >
              Not now
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
