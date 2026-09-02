'use client'

import { useState } from 'react'

/**
 * The next useful action for someone who already pays.
 *
 * A Pro user used to see "Get Pro", which did nothing. Disabling it would have
 * been worse: a dead grey button says the product is broken and never says
 * why. The Paddle portal covers cancelling, changing a card and downloading
 * invoices, so one link is the whole of what this person could want here.
 */
export function ManageSubscription({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function open() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null
      if (data?.url) {
        window.location.assign(data.url)
        return
      }
      /**
       * `no_subscription` is a real state, not an edge case: Art's own account
       * is Pro by SQL with no paddle_customer_id, and anyone comped the same
       * way lands here. Saying so plainly beats a generic failure, because
       * there is genuinely nothing to manage.
       */
      setError(
        data?.error === 'no_subscription'
          ? 'This account has Pro without a paid subscription, so there is nothing to manage.'
          : 'Could not open the billing page. Try again in a moment.'
      )
    } catch {
      setError('Could not reach the billing page. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={open} disabled={loading} className={className} style={style}>
        {loading ? 'Opening...' : 'Manage subscription'}
      </button>
      {error && (
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
          {error}
        </p>
      )}
    </>
  )
}
