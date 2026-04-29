'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface SettingsClientProps {
  email: string
  fullName: string | null
  tier: string
  subscriptionStatus: string | null
}

export function SettingsClient({ email, fullName, tier, subscriptionStatus }: SettingsClientProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPro = tier === 'pro'

  async function handleManageBilling() {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? 'Could not delete account.')
        setDeleting(false)
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Account info */}
      <section className="glass rounded-2xl border border-[#1e2d4a] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#f0f4ff] uppercase tracking-wider">Account</h2>
        <div className="space-y-3 text-sm">
          <Row label="Email" value={email} />
          <Row label="Name" value={fullName ?? '—'} />
          <Row
            label="Plan"
            value={
              <span className="flex items-center gap-2">
                <span className="capitalize text-[#f0f4ff]">{tier}</span>
                {isPro && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">
                    PRO
                  </span>
                )}
                {subscriptionStatus && subscriptionStatus !== 'active' && (
                  <span className="text-[10px] capitalize text-amber-400">{subscriptionStatus.replace('_', ' ')}</span>
                )}
              </span>
            }
          />
        </div>
      </section>

      {/* Billing */}
      <section className="glass rounded-2xl border border-[#1e2d4a] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#f0f4ff] uppercase tracking-wider">Billing</h2>
        {isPro ? (
          <>
            <p className="text-sm text-[#8b9cc8]">Manage your subscription, payment method, and invoices.</p>
            <button
              onClick={handleManageBilling}
              className="px-4 py-2.5 rounded-xl bg-[#0f1628] border border-[#1e2d4a] hover:border-[#2d4070] text-[#f0f4ff] text-sm font-medium transition-all"
            >
              Manage billing →
            </button>
          </>
        ) : (
          <p className="text-sm text-[#8b9cc8]">
            You&apos;re on the free plan. Upgrade in the sidebar to unlock unlimited analyses and insights.
          </p>
        )}
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wider">Danger zone</h2>
        <p className="text-sm text-[#8b9cc8]">
          Permanently delete your account and all associated data — sessions, history, and insights. This cannot be undone.
          {isPro && (
            <span className="block mt-2 text-amber-400">
              Cancel your subscription via &quot;Manage billing&quot; first to avoid further charges.
            </span>
          )}
        </p>
        <button
          onClick={() => setConfirmOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 text-sm font-medium transition-all"
        >
          Delete account
        </button>
      </section>

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => !deleting && setConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#0a0e1a] border border-red-500/30 rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-lg font-bold text-[#f0f4ff]">Delete account permanently?</h3>
              <p className="text-sm text-[#8b9cc8]">
                Type <strong className="text-red-300 font-mono">DELETE</strong> to confirm. Your account, sessions, and all data will be erased immediately.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                disabled={deleting}
                className="w-full bg-[#0f1628] border border-[#1e2d4a] focus:border-red-500/40 rounded-xl px-4 py-3 text-[#f0f4ff] placeholder:text-[#2d4070] text-sm font-mono outline-none transition-colors"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl border border-[#1e2d4a] hover:border-[#2d4070] text-[#cdd5ee] text-sm font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || deleting}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting…' : 'Delete forever'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1e2d4a]/60 last:border-b-0">
      <span className="text-[#8b9cc8]">{label}</span>
      <span className="text-[#f0f4ff]">{value}</span>
    </div>
  )
}
