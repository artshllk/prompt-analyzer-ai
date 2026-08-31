'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { markSignedOut } from '@/lib/auth/local-hints'
import { USAGE_DAILY_LIMIT } from '@/lib/limits'
import { MemorySection } from './MemorySection'

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
  const [signingOut, setSigningOut] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

  const isPro = tier === 'pro'

  async function handleManageBilling() {
    setBillingLoading(true)
    setBillingError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (data.url) {
        window.location.href = data.url
        return
      }
      setBillingError(
        data.error === 'no_subscription'
          ? 'No billing profile found for this account. If you just upgraded, give it a minute and refresh.'
          : 'Could not open the billing portal. Try again in a moment.'
      )
    } catch {
      setBillingError('Network error. Check your connection and try again.')
    } finally {
      setBillingLoading(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    // Explicit sign-out: One Tap must not auto-select them back in.
    markSignedOut()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
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
    <div className="space-y-6">
      {/* Account info */}
      <section className="card-editorial p-6 space-y-4">
        <p className="eyebrow">Account</p>
        <div className="space-y-3 text-sm">
          <Row label="Email" value={email} />
          <Row label="Name" value={fullName ?? '-'} />
          <Row
            label="Plan"
            value={
              <span className="flex items-center gap-2">
                <span className="capitalize" style={{ color: 'var(--color-paper)' }}>{tier}</span>
                {isPro && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent-bright)' }}
                  >
                    Pro
                  </span>
                )}
                {subscriptionStatus && subscriptionStatus !== 'active' && (
                  <span className="text-[10px] capitalize" style={{ color: '#E89A6B' }}>
                    {subscriptionStatus.replace('_', ' ')}
                  </span>
                )}
              </span>
            }
          />
        </div>
      </section>

      <MemorySection />

      {/* Browser extension */}
      <section className="card-editorial p-6 space-y-4">
        <p className="eyebrow">Browser extension</p>
        <p className="text-sm leading-[1.6]" style={{ color: 'var(--color-paper-mute)' }}>
          Connect the Deepclario extension to this account so it uses your plan{' '}
          {isPro
            ? '(unlimited improvements, no daily limit)'
            : `(${USAGE_DAILY_LIMIT} free improvements a day)`}{' '}
          instead of the public free quota.
        </p>
        <a
          href="/extension/connect"
          className="inline-block px-4 py-2.5 rounded-full text-sm transition-all btn-outline"
          style={{ border: '1px solid var(--color-rule-strong)', color: 'var(--color-paper)', fontWeight: 500 }}
        >
          Get connection code →
        </a>
      </section>

      {/* Session - Sign out lives here now that the sidebar footer
          is gone. Compact section, no need for theatre. */}
      <section className="card-editorial p-6 space-y-4">
        <p className="eyebrow">Session</p>
        <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
          Signed in as <span style={{ color: 'var(--color-paper)' }}>{email}</span>.
        </p>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="px-4 py-2.5 rounded-full text-sm transition-all btn-outline disabled:opacity-50"
          style={{ border: '1px solid var(--color-rule-strong)', color: 'var(--color-paper)', fontWeight: 500 }}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </section>

      {/* Billing */}
      <section className="card-editorial p-6 space-y-4">
        <p className="eyebrow">Billing</p>
        {isPro ? (
          <>
            <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
              Manage your subscription, payment method, and invoices.
            </p>
            <button
              onClick={handleManageBilling}
              disabled={billingLoading}
              className="px-4 py-2.5 rounded-full text-sm transition-all btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ border: '1px solid var(--color-rule-strong)', color: 'var(--color-paper)', fontWeight: 500 }}
            >
              {billingLoading ? 'Opening…' : 'Manage billing →'}
            </button>
            {billingError && (
              <p className="text-sm" style={{ color: '#E89A6B' }}>{billingError}</p>
            )}
          </>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
            You&apos;re on the free plan. Upgrade in the sidebar for unlimited improvements and a stronger model.
          </p>
        )}
      </section>

      {/* Danger zone */}
      <section
        className="rounded-2xl p-6 space-y-4"
        style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)' }}
      >
        <p className="eyebrow" style={{ color: '#F2A0A0' }}>Danger zone</p>
        <p className="text-sm leading-[1.6]" style={{ color: 'var(--color-paper-mute)' }}>
          Permanently delete your account and all associated data, including your sessions and history. This cannot be undone.
          {isPro && (
            <span className="block mt-2" style={{ color: '#E89A6B' }}>
              Cancel your subscription via &quot;Manage billing&quot; first to avoid further charges.
            </span>
          )}
        </p>
        <button
          onClick={() => setConfirmOpen(true)}
          className="px-4 py-2.5 rounded-full text-sm transition-all"
          style={{
            background: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(239,68,68,0.30)',
            color: '#F2A0A0',
            fontWeight: 500,
          }}
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
              className="w-full max-w-md rounded-2xl p-6 space-y-4"
              style={{ background: 'var(--color-ink-card)', border: '1px solid rgba(239,68,68,0.30)' }}
            >
              <h3 className="font-serif text-xl" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
                Delete account permanently?
              </h3>
              <p className="text-sm leading-[1.6]" style={{ color: 'var(--color-paper-mute)' }}>
                Type <strong className="font-mono" style={{ color: '#F2A0A0' }}>DELETE</strong> to confirm. Your account, sessions, and all data will be erased immediately.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                disabled={deleting}
                className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition-colors"
                style={{
                  background: 'var(--color-ink)',
                  border: '1px solid var(--color-rule-strong)',
                  color: 'var(--color-paper)',
                }}
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-full text-sm transition-all btn-outline disabled:opacity-50"
                  style={{ border: '1px solid var(--color-rule-strong)', color: 'var(--color-paper)', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || deleting}
                  className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting…' : 'Delete account'}
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
    <div
      className="flex items-center justify-between py-2 last:border-b-0"
      style={{ borderBottom: '1px solid var(--color-rule)' }}
    >
      <span style={{ color: 'var(--color-paper-mute)' }}>{label}</span>
      <span style={{ color: 'var(--color-paper)' }}>{value}</span>
    </div>
  )
}
