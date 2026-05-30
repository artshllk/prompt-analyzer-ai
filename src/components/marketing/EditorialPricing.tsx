'use client'

import { useState } from 'react'
import Link from 'next/link'

export function EditorialPricing() {
  const [annual, setAnnual] = useState(false)
  const proPrice = annual ? '7.99' : '9.99'

  return (
    <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
      {/* Left: editorial intro */}
      <div className="md:col-span-5">
        <p className="eyebrow mb-6">Pricing</p>
        <h2
          className="display text-4xl md:text-5xl mb-6"
          style={{ color: 'var(--color-paper)' }}
        >
          Free until you outgrow it.
        </h2>
        <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: 'var(--color-paper-mute)' }}>
          The free plan is the actual product, not a trial. Use it weekly, monthly, indefinitely.
          Upgrade only when you find yourself reaching for it every day.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAnnual(false)}
            className={`text-sm transition-colors ${!annual ? 'underline underline-offset-4' : ''}`}
            style={{ color: !annual ? 'var(--color-paper)' : 'var(--color-paper-mute)' }}
          >
            Monthly
          </button>
          <span style={{ color: 'var(--color-rule-strong)' }}>·</span>
          <button
            onClick={() => setAnnual(true)}
            className={`text-sm transition-colors ${annual ? 'underline underline-offset-4' : ''}`}
            style={{ color: annual ? 'var(--color-paper)' : 'var(--color-paper-mute)' }}
          >
            Annual <span className="text-xs ml-1" style={{ color: 'var(--color-accent)' }}>save 20%</span>
          </button>
        </div>
      </div>

      {/* Right: two stacked tiers, editorial style - no boxes, no shadows, just hairlines */}
      <div className="md:col-span-7 space-y-px">
        {/* Free */}
        <div className="rule-strong" />
        <div className="grid grid-cols-12 gap-4 py-7">
          <div className="col-span-4 md:col-span-3">
            <p className="eyebrow mb-2">Free</p>
            <p className="font-serif text-3xl tabular-nums" style={{ color: 'var(--color-paper)' }}>$0</p>
            {/* <p className="text-xs mt-1" style={{ color: 'var(--color-paper-mute)' }}>forever</p> */}
          </div>
          <div className="col-span-8 md:col-span-7">
            <p className="text-sm mb-3" style={{ color: 'var(--color-paper)' }}>
              25 prompts a month. Full scoring. Full rewrites. 7-day history.
            </p>
            <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
              Plenty for most people. The product without a meter looking over your shoulder.
            </p>
          </div>
          <div className="col-span-12 md:col-span-2 flex md:justify-end">
            <Link
              href="/playground"
              className="inline-flex items-center gap-1.5 text-sm transition-all hover:gap-2 mt-2 md:mt-0"
              style={{ color: 'var(--color-paper)' }}
            >
              Start
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>

        <div className="rule" />
        {/* Pro */}
        <div className="grid grid-cols-12 gap-4 py-7">
          <div className="col-span-4 md:col-span-3">
            <p className="eyebrow mb-2" style={{ color: 'var(--color-accent)' }}>Pro</p>
            <p className="font-serif text-3xl tabular-nums" style={{ color: 'var(--color-paper)' }}>
              ${proPrice}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-paper-mute)' }}>
              {annual ? 'per month, billed yearly' : 'per month'}
            </p>
          </div>
          <div className="col-span-8 md:col-span-7">
            <p className="text-sm mb-3" style={{ color: 'var(--color-paper)' }}>
              Unlimited rewrites. Full history. Weekly insights on what you write and how the output improves.
            </p>
            <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
              For people who reach for AI every day. Engineers, writers, founders, marketers. The ones who want the layer that quietly makes every prompt better.
            </p>
          </div>
          <div className="col-span-12 md:col-span-2 flex md:justify-end">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all btn-paper mt-2 md:mt-0"
              style={{
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
              }}
            >
              Unlock
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
        <div className="rule-strong" />

        <p className="pt-4 text-xs" style={{ color: 'var(--color-paper-mute)' }}>
          Cancel anytime. No card required to try the free plan. Payments handled securely by Paddle.
        </p>
      </div>
    </div>
  )
}
