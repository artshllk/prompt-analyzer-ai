'use client'

interface UpgradeButtonProps {
  plan?: string
  className?: string
  children: React.ReactNode
}

export function UpgradeButton({ plan = 'pro_monthly', className, children }: UpgradeButtonProps) {
  function handleClick() {
    fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
      .then(r => r.json())
      .then((d: { url?: string }) => {
        if (d.url) window.location.href = d.url
      })
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}
