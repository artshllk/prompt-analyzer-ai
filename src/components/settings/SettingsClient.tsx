'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { markSignedOut } from '@/lib/auth/local-hints'
import { MemorySection } from './MemorySection'

interface SettingsClientProps {
  email: string
  /** Accepted and unused: the old Account card listed it, and a name is not
   *  something anyone comes to a settings page to read. */
  fullName: string | null
  tier: string
  subscriptionStatus: string | null
}

export function SettingsClient({ email, tier, subscriptionStatus }: SettingsClientProps) {
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
    <div>
      {/*
        ONE PANEL WITH HAIRLINE DIVIDERS, not four floating cards. Four cards
        gave four unrelated settings equal weight and equal prominence, so
        nothing looked more important than anything else.

        Order is orientation first, then action. "Signed in as" answers whose
        settings these are, which comes before every other question a person
        has here. Billing is what a paying user came for. The extension is last
        because it belongs to the frozen product.
      */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--rule)' }}
      >
        <SettingRow
          title="Session"
          body={<>Signed in as <span style={{ color: 'var(--ink)' }}>{email}</span>.</>}
          action={
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-4 py-2.5 rounded-full text-[15px] transition-all btn-outline disabled:opacity-50"
              style={{ border: '1px solid var(--rule)', color: 'var(--ink)', fontWeight: 500 }}
            >
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          }
        />

        <SettingRow
          title="Billing"
          body={
            isPro
              ? 'Manage your plan, card, and invoices.'
              : 'You are on the free plan. 10 source checks a month.'
          }
          /* A subscription that is not active means a payment failed. Without
             this the first they hear of it is Pro switching off. */
          warning={
            isPro && subscriptionStatus && subscriptionStatus !== 'active'
              ? `Your subscription is ${subscriptionStatus.replace(/_/g, ' ')}. Update your card to keep Pro.`
              : null
          }
          action={
            isPro ? (
              <button
                onClick={handleManageBilling}
                disabled={billingLoading}
                className="px-4 py-2.5 rounded-full text-[15px] transition-all btn-outline disabled:opacity-50"
                style={{ border: '1px solid var(--rule)', color: 'var(--ink)', fontWeight: 500 }}
              >
                {billingLoading ? 'Opening...' : 'Manage billing'}
              </button>
            ) : (
              <a
                href="/pricing"
                className="inline-block px-4 py-2.5 rounded-full text-[15px] transition-all btn-outline"
                style={{ border: '1px solid var(--rule)', color: 'var(--ink)', fontWeight: 500 }}
              >
                See Pro
              </a>
            )
          }
          note={billingError}
        />

        <SettingRow
          title="Browser extension"
          body="Improves prompts inside ChatGPT, Claude, and Gemini. No longer updated."
          action={
            <a
              href="/extension/connect"
              className="inline-block px-4 py-2.5 rounded-full text-[15px] transition-all btn-outline"
              style={{ border: '1px solid var(--rule)', color: 'var(--ink)', fontWeight: 500 }}
            >
              Get connection code
            </a>
          }
          last
        />
      </div>

      {/* Improver memory. Self-hides when there is none, so a new account
          never sees it. Kept because it is a data-deletion control, and
          removing it would take a privacy action away from anyone who has
          some. */}
      <div className="mt-6">
        <MemorySection />
      </div>

      {/*
        NO DANGER ZONE. That is a GitHub convention from 2010 that ended up in
        every template: a red box shouting about something the person has not
        done, which makes deletion the loudest thing on a settings page. The
        confirmation dialog does the protecting. The heading is plain, the
        container has no tint and no border, and only the button is red.
      */}
      <section className="mt-12">
        <h2 className="text-[17px] mb-2" style={{ color: 'var(--ink)', fontWeight: 600 }}>
          Delete account
        </h2>
        <p className="text-[16px] leading-[1.6] mb-1" style={{ color: 'var(--ink-soft)' }}>
          This erases your account and all your data. It cannot be undone.
        </p>
        <p className="text-[16px] leading-[1.6] mb-4" style={{ color: 'var(--ink-soft)' }}>
          Cancel your subscription first to avoid further charges.
        </p>
        <button
          onClick={() => setConfirmOpen(true)}
          className="text-[15px] underline underline-offset-4"
          style={{ color: 'var(--brand-text)', fontWeight: 500 }}
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
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-[color:rgba(21,19,15,0.45)] px-4"
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
                Delete your account?
              </h3>
              <p className="text-sm leading-[1.6]" style={{ color: 'var(--color-paper-mute)' }}>
                Type <strong className="font-mono" style={{ color: '#F2A0A0' }}>DELETE</strong> to confirm. Your account and all data go at once.
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
                  className="px-4 py-2 rounded-full bg-[color:var(--brand)] hover:bg-[color:var(--brand-deep)] text-[color:var(--card)] text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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

/**
 * One row in the panel.
 *
 * Heading at 17px semibold in sentence case, not tiny uppercase mono. The
 * uppercase mono labels were the main reason this page read as small and
 * generic, and mono now survives only on the connection code, where the
 * characters have to be distinguishable from each other.
 *
 * Body at 16px with 1.6 line height. Action right on desktop, stacked on
 * mobile, because a button squeezed beside text on a phone is a button nobody
 * hits.
 */
function SettingRow({
  title,
  body,
  action,
  note,
  warning,
  last,
}: {
  title: string
  body: React.ReactNode
  action: React.ReactNode
  note?: string | null
  warning?: string | null
  last?: boolean
}) {
  return (
    <div
      className="flex flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
      style={last ? undefined : { borderBottom: '1px solid var(--rule)' }}
    >
      <div className="min-w-0">
        <h2 className="text-[17px] mb-1" style={{ color: 'var(--ink)', fontWeight: 600 }}>
          {title}
        </h2>
        <p className="text-[16px] leading-[1.6] wrap-break-word" style={{ color: 'var(--ink-soft)' }}>
          {body}
        </p>
        {warning && (
          <p className="mt-2 text-[15px] leading-[1.6]" style={{ color: 'var(--brand-text)' }}>
            {warning}
          </p>
        )}
        {note && (
          <p className="mt-2 text-[15px] leading-[1.6]" style={{ color: 'var(--brand-text)' }}>
            {note}
          </p>
        )}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}

