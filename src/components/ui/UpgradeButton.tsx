'use client'

import { useState } from 'react'
import { UpgradeDialog } from './UpgradeDialog'
import { useCheckout } from './useCheckout'

interface UpgradeButtonProps {
  className?: string
  children: React.ReactNode
  /** Founding seats left, counted at Paddle by whichever server component renders this. */
  foundingLeft?: number
  /**
   * Skip the chooser and buy this plan directly.
   *
   * Only for a caller that is already showing the price of exactly this plan,
   * which today is the pricing table. OPTIONAL WITH NO DEFAULT, deliberately:
   * the old default of 'pro_monthly' is what would have charged $19 to
   * someone reading "$12".
   */
  plan?: 'pro_founding' | 'pro_monthly' | 'pro_annual'
}

/**
 * Opens the plan chooser. It does not choose a plan itself.
 *
 * IT USED TO TAKE A `plan` PROP THAT DEFAULTED TO 'pro_monthly'. Two callers
 * relied on that default, so the sidebar's "Upgrade to Pro" would have
 * charged $19 while the pricing page advertised the $12 founding price to the
 * same person. A default that silently picks the more expensive option is not
 * a default, it is a bug with a fallback's clothes on.
 *
 * The plan is now always chosen in front of the reader, next to its price.
 * See UpgradeDialog for the rest, including why every failure says something.
 */
export function UpgradeButton({ className, children, foundingLeft = 0, plan }: UpgradeButtonProps) {
  const [open, setOpen] = useState(false)
  const { start, busy, error } = useCheckout()

  return (
    <>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => (plan ? start(plan) : setOpen(true))}
        className={className}
      >
        {busy ? 'Opening…' : children}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-[13px]" style={{ color: 'var(--guess)' }}>
          {error}
        </p>
      )}
      {!plan && <UpgradeDialog open={open} onClose={() => setOpen(false)} foundingLeft={foundingLeft} />}
    </>
  )
}
