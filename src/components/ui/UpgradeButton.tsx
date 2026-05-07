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
  const paddle = usePaddle()

  async function handleClick() {
    if (!PADDLE_LIVE) {
      setWaitlist(true)
      return
    }
    if (!paddle) return
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json() as { transactionId?: string }
      if (data.transactionId) {
        paddle.Checkout.open({ transactionId: data.transactionId })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={handleClick} disabled={loading} className={className}>
        {loading ? 'Loading...' : children}
      </button>
      {typeof document !== 'undefined' && createPortal(
        <WaitlistModal open={waitlist} onClose={() => setWaitlist(false)} />,
        document.body
      )}
    </>
  )
}
