'use client'

import { useState } from 'react'
import { usePaddleState } from '@/components/PaddleProvider'

/**
 * Open a Paddle checkout, and say something whenever we cannot.
 *
 * ONE PATH, TWO CALLERS. The pricing page knows which plan it is showing and
 * goes straight to checkout; the in-app dialog asks first. Both end up here,
 * so a failure mode fixed once is fixed for both. Before this they were
 * separate, and only one of them reported anything.
 *
 * Every branch that returns without opening a checkout sets a message. The
 * bug this replaces was `if (!paddle) return` - a button that did nothing,
 * said nothing, and logged nothing.
 */
export function useCheckout() {
  const { paddle, status } = usePaddleState()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /** True when the Paddle overlay opened. False means `error` is set. */
  async function start(plan: string): Promise<boolean> {
    setError(null)

    if (status === 'loading') {
      setError('Still loading the payment form. Give it a second and try again.')
      return false
    }
    if (status === 'disabled') {
      setError('Payments are not switched on in this environment.')
      return false
    }
    if (status === 'failed' || !paddle) {
      setError('The payment form could not load. An ad blocker will do this. Try again with it off.')
      return false
    }

    setBusy(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = (await res.json()) as { transactionId?: string; error?: string }
      if (data.transactionId) {
        paddle.Checkout.open({ transactionId: data.transactionId })
        return true
      }
      setError(
        data.error === 'founding_sold_out'
          ? 'The founding places have just gone. The other prices still work.'
          : data.error === 'unauthorized'
            ? 'Sign in first, then upgrade.'
            : 'We could not start the checkout. Try again in a moment.'
      )
      return false
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
      return false
    } finally {
      setBusy(null)
    }
  }

  return { start, busy, error, setError, status }
}
