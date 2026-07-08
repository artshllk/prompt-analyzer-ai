'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Settings-side surface of the Context Graph: a pointer to the Context
 * page (where management lives) plus the destructive "clear everything"
 * control - users look for data deletion under Settings.
 */
export function ContextSettingsSection() {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClear() {
    setClearing(true)
    setError(null)
    try {
      const res = await fetch('/api/context/identity', { method: 'DELETE' })
      if (!res.ok) {
        setError('Could not clear your context. Try again.')
        setClearing(false)
        return
      }
      setConfirmOpen(false)
      setClearing(false)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setClearing(false)
    }
  }

  return (
    <section className="glass rounded-2xl border border-[#1e2d4a] p-6 space-y-4">
      <h2 className="text-sm font-semibold text-[#f0f4ff] uppercase tracking-wider">Context</h2>
      <p className="text-sm text-[#8b9cc8]">
        Deepclario carries your profile and saved preferences into every rewrite.
        Manage what it knows on the Context page.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/context"
          className="inline-block px-4 py-2.5 rounded-xl bg-[#0f1628] border border-[#1e2d4a] hover:border-[#2d4070] text-[#f0f4ff] text-sm font-medium transition-all"
        >
          Manage context →
        </Link>
        <button
          onClick={() => setConfirmOpen(true)}
          className="text-sm text-[#8b9cc8] hover:text-red-300 transition-colors"
        >
          Clear all context
        </button>
      </div>

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => !clearing && setConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#0a0e1a] border border-red-500/30 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-lg font-bold text-[#f0f4ff]">Clear all context?</h3>
              <p className="text-sm text-[#8b9cc8]">
                Your identity profile, saved memories, and learned style signals
                will be erased. Future rewrites start from a blank slate. This
                cannot be undone.
              </p>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={clearing}
                  className="px-4 py-2 rounded-xl border border-[#1e2d4a] hover:border-[#2d4070] text-[#cdd5ee] text-sm font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-40"
                >
                  {clearing ? 'Clearing…' : 'Clear everything'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
