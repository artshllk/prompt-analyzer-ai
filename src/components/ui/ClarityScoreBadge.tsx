'use client'

import { motion } from 'framer-motion'

interface ClarityScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

function getScoreColor(score: number): { text: string; bg: string; glow: string } {
  if (score >= 75) return { text: 'text-emerald-400', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/30' }
  if (score >= 50) return { text: 'text-amber-400', bg: 'bg-amber-500', glow: 'shadow-amber-500/30' }
  return { text: 'text-red-400', bg: 'bg-red-500', glow: 'shadow-red-500/30' }
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 65) return 'Good'
  if (score >= 45) return 'Fair'
  if (score >= 25) return 'Weak'
  return 'Poor'
}

export function ClarityScoreBadge({ score, size = 'md', animate = true }: ClarityScoreBadgeProps) {
  const colors = getScoreColor(score)
  const label = getScoreLabel(score)

  const sizes = {
    sm: { container: 'w-10 h-10', text: 'text-sm', ring: 28, stroke: 3 },
    md: { container: 'w-16 h-16', text: 'text-lg', ring: 44, stroke: 4 },
    lg: { container: 'w-24 h-24', text: 'text-2xl', ring: 68, stroke: 5 },
  }[size]

  const radius = (sizes.ring / 2) - sizes.stroke
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${sizes.container} relative`}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${sizes.ring} ${sizes.ring}`}>
          <circle
            cx={sizes.ring / 2}
            cy={sizes.ring / 2}
            r={radius}
            fill="none"
            stroke="#1e2d4a"
            strokeWidth={sizes.stroke}
          />
          <motion.circle
            cx={sizes.ring / 2}
            cy={sizes.ring / 2}
            r={radius}
            fill="none"
            strokeWidth={sizes.stroke}
            strokeLinecap="round"
            stroke="currentColor"
            className={colors.text}
            strokeDasharray={circumference}
            initial={animate ? { strokeDashoffset: circumference } : { strokeDashoffset: dashOffset }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={`font-bold ${sizes.text} ${colors.text}`}
            initial={animate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      {size !== 'sm' && (
        <span className="text-xs text-[#4a5a80] uppercase tracking-wider">{label}</span>
      )}
    </div>
  )
}
