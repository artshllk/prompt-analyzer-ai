'use client'

interface UpgradeButtonProps {
  plan?: string
  className?: string
  children: React.ReactNode
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle?: any
  }
}

export function UpgradeButton({ plan = 'pro_monthly', className, children }: UpgradeButtonProps) {
  async function handleClick() {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json() as { url?: string }
    if (data.url) {
      // Redirect to Paddle hosted checkout
      window.location.href = data.url
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
