'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { WaitlistModal } from './WaitlistModal'

interface UpgradeButtonProps {
  plan?: string
  className?: string
  children: React.ReactNode
}

const PADDLE_LIVE = process.env.NEXT_PUBLIC_PADDLE_LIVE === 'true'

export function UpgradeButton({ plan = 'pro_monthly', className, children }: UpgradeButtonProps) {
  const [waitlist, setWaitlist] = useState(false)

  async function handleClick() {
    if (!PADDLE_LIVE) {
      setWaitlist(true)
      return
    }
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json() as { url?: string }
    if (data.url) window.location.href = data.url
  }

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children}
      </button>
      {typeof document !== 'undefined' && createPortal(
        <WaitlistModal open={waitlist} onClose={() => setWaitlist(false)} />,
        document.body
      )}
    </>
  )
}
