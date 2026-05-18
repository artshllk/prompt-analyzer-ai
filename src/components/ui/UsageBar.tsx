'use client'

import { motion } from 'framer-motion'
import type { UsageInfo } from '@/types'

interface UsageBarProps {
  usage: UsageInfo
  onUpgrade?: () => void
}

/**
 * Editorial usage indicator - hairline track, paper fill, no glow.
 */
export function UsageBar({ usage, onUpgrade }: UsageBarProps) {
  if (usage.tier === 'pro') {
    return (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
        <span className="text-[12px]" style={{ color: 'var(--color-paper-mute)' }}>
          Pro &middot; Unlimited
        </span>
      </div>
    )
  }

  const pct = usage.limit ? Math.min((usage.used / usage.limit) * 100, 100) : 0
  const isNearLimit = pct >= 80
  const isAtLimit = usage.isAtLimit

  const fillColor = isAtLimit ? '#C25E5E' : isNearLimit ? 'var(--color-accent)' : 'var(--color-paper)'
  const numberColor = isAtLimit ? '#C25E5E' : isNearLimit ? 'var(--color-accent)' : 'var(--color-paper)'

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span
          className="text-[10px] uppercase tracking-[0.16em]"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          Free
        </span>
        <span className="tabular-nums text-[12px]" style={{ color: numberColor }}>
          {usage.used}<span style={{ color: 'var(--color-paper-mute)' }}>/{usage.limit}</span>
        </span>
      </div>
      <div className="h-px w-full" style={{ background: 'var(--color-rule-strong)' }}>
        <motion.div
          className="h-px"
          style={{ background: fillColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {(isNearLimit || isAtLimit) && onUpgrade && (
        <button
          onClick={onUpgrade}
          className="mt-3 text-[12px] underline-offset-4 hover:underline transition-all"
          style={{ color: 'var(--color-paper)' }}
        >
          Upgrade to Pro &rarr;
        </button>
      )}
    </div>
  )
}
