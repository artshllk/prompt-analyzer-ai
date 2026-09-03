'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { WaitlistModal } from './WaitlistModal'
import { usePaddle } from '@/components/PaddleProvider'

interface UpgradeButtonProps {
  plan?: string
  className?: string
  children: React.ReactNode
}

const PADDLE_LIVE = process.env.NEXT_PUBLIC_PADDLE_LIVE === 'true'

export function UpgradeButton({ plan = 'pro_monthly', className, children }: UpgradeButtonProps) {
  const [waitlist, setWaitlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const paddle = usePaddle()

  async function handleClick() {
    if (!PADDLE_LIVE) {
      setWaitlist(true)
      return
    }
    if (!paddle) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = (await res.json()) as { transactionId?: string; error?: string }
      if (data.transactionId) {
        paddle.Checkout.open({ transactionId: data.transactionId })
        return
      }
      /**
       * A BUTTON THAT DOES NOTHING IS THE WORST OUTCOME HERE.
       *
       * This swallowed every non-success response, so a refusal looked
       * exactly like a broken page. The founding price can genuinely run out
       * between the page rendering and the click, and that is the one case
       * where the reader needs a sentence rather than a shrug.
       */
      setError(
        data.error === 'founding_sold_out'
          ? 'The founding places have just gone. The ordinary price still works.'
          : 'We could not start the checkout. Try again in a moment.'
      )
    } catch {
      setError('We could not start the checkout. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={handleClick} disabled={loading} className={className}>
        {loading ? 'Loading...' : children}
      </button>
      {error && (
        <p className="mt-2 text-[13px]" role="alert" style={{ color: 'var(--guess)' }}>
          {error}
        </p>
      )}
      {typeof document !== 'undefined' && createPortal(
        <WaitlistModal open={waitlist} onClose={() => setWaitlist(false)} />,
        document.body
      )}
    </>
  )
}
