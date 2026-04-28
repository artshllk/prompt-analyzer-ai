'use client'

import { motion } from 'framer-motion'
import type { UsageInfo } from '@/types'

interface UsageBarProps {
  usage: UsageInfo
  onUpgrade?: () => void
}

export function UsageBar({ usage, onUpgrade }: UsageBarProps) {
  if (usage.tier === 'pro') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0f1628] border border-[#1e2d4a]">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
        <span className="text-xs text-[#8b9cc8]">Pro — Unlimited</span>
      </div>
    )
  }

  const pct = usage.limit ? Math.min((usage.used / usage.limit) * 100, 100) : 0
  const isNearLimit = pct >= 80
  const isAtLimit = usage.isAtLimit

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-[120px]">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-[#4a5a80]">Free tier</span>
          <span className={`text-xs font-medium ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-[#8b9cc8]'}`}>
            {usage.used}/{usage.limit}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[#1e2d4a] overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-violet-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
      {(isNearLimit || isAtLimit) && onUpgrade && (
        <button
          onClick={onUpgrade}
          className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors shrink-0"
        >
          Upgrade
        </button>
      )}
    </div>
  )
}
