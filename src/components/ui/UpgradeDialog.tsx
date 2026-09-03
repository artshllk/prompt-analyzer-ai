'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useCheckout } from './useCheckout'
import { planChoices, PRO_INCLUDES, type PlanChoice } from '@/lib/plans'

/**
 * Choose a plan, then pay, without leaving the app.
 *
 * ===================================================================
 * WHY THIS EXISTS RATHER THAN A LINK TO /pricing
 * ===================================================================
 *
 * Upgrading from inside the app used to be a link to the marketing pricing
 * page. That drops a signed-in person out of the app shell, onto a page whose
 * job is to persuade someone who has not signed up yet, and asks them to find
 * the button again. A real user did exactly that, clicked the button on the
 * far side, and nothing happened.
 *
 * It also had a worse property: the sidebar button posted `pro_monthly`
 * whatever the pricing page was advertising, so somebody who had just read
 * "$12, 50 places left" would have been charged $19.
 *
 * So the choice happens here, next to the thing that prompted it, and the
 * plan that is charged is the one whose price is on screen.
 */
export function UpgradeDialog({
  open,
  onClose,
  foundingLeft,
}: {
  open: boolean
  onClose: () => void
  /** Counted at Paddle by the server. 0 hides the founding option entirely. */
  foundingLeft: number
}) {
  const { start, busy, error } = useCheckout()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Escape closes, focus lands inside, and the page behind does not scroll.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const choices = planChoices(foundingLeft)

  async function choose(choice: PlanChoice) {
    // start() reports whether the overlay actually opened. Reading the hook's
    // `error` after the await would read the previous render's value, so the
    // dialog would close over its own error message.
    if (await start(choice.plan)) onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: 'rgba(21, 19, 15, 0.45)' }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--rule)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 id="upgrade-title" className="text-[20px] tracking-tight" style={{ color: 'var(--ink)', fontWeight: 600 }}>
            Upgrade to Pro
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 p-2 rounded-lg focus-ring"
            style={{ color: 'var(--ink-soft)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <ul className="mb-5 space-y-1">
          {PRO_INCLUDES.map(line => (
            <li key={line} className="text-[14px]" style={{ color: 'var(--ink-soft)' }}>
              {line}
            </li>
          ))}
        </ul>

        <div className="space-y-2.5">
          {choices.map(c => (
            <button
              key={c.plan}
              type="button"
              onClick={() => choose(c)}
              disabled={busy !== null}
              className="w-full text-left rounded-xl p-4 transition-colors focus-ring disabled:opacity-60"
              style={{
                border: `1px solid ${c.plan === 'pro_founding' ? 'var(--brand)' : 'var(--rule)'}`,
                background: 'var(--paper)',
              }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[15px]" style={{ color: 'var(--ink)', fontWeight: 600 }}>
                  {c.name}
                </span>
                <span className="text-[17px] tabular-nums" style={{ color: 'var(--ink)', fontWeight: 600 }}>
                  ${c.price}
                  <span className="text-[13px] ml-1" style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>
                    {c.cadence}
                  </span>
                </span>
              </div>
              <p className="mt-1 text-[13px]" style={{ color: c.plan === 'pro_founding' ? 'var(--brand)' : 'var(--ink-soft)' }}>
                {busy === c.plan ? 'Opening checkout…' : c.note}
              </p>
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[13px] leading-relaxed rounded-lg p-3"
             style={{ background: 'var(--guess-bg)', color: 'var(--guess)' }}>
            {error}
          </p>
        )}

        <p className="mt-4 text-[12px]" style={{ color: 'var(--ink-soft)' }}>
          Secure checkout by Paddle. Cancel anytime from Settings.
        </p>
      </div>
    </div>,
    document.body
  )
}
