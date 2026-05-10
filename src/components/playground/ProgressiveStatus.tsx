'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const ANALYZE_STEPS = [
  'Reading your prompt',
  'Mapping the domain',
  'Identifying gaps',
  'Crafting the question',
]

const IMPROVE_STEPS = [
  'Loading your answers',
  'Applying the CRAFT framework',
  'Tightening the rewrite',
  'Scoring the result',
]

interface ProgressiveStatusProps {
  mode: 'analyzing' | 'improving'
}

/**
 * Editorial loading state — typographic dots, hairline checklist, no glow.
 */
export function ProgressiveStatus({ mode }: ProgressiveStatusProps) {
  const steps = mode === 'analyzing' ? ANALYZE_STEPS : IMPROVE_STEPS
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    setActiveStep(0)
    const timers = steps.slice(1).map((_, i) =>
      setTimeout(() => setActiveStep(i + 1), (i + 1) * 900)
    )
    return () => timers.forEach(clearTimeout)
  }, [steps])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="py-7"
      style={{ borderTop: '1px solid var(--color-rule-strong)', borderBottom: '1px solid var(--color-rule-strong)' }}
    >
      <div className="flex items-center gap-3 mb-5">
        <ThinkingDots />
        <span className="eyebrow">
          {mode === 'analyzing' ? 'Reading your prompt' : 'Rewriting'}
        </span>
      </div>

      <ul className="space-y-3">
        {steps.map((step, i) => {
          const isDone = i < activeStep
          const isActive = i === activeStep
          return (
            <li key={step} className="flex items-center gap-3 text-sm md:text-base">
              <span
                className="font-serif text-base md:text-lg tabular-nums shrink-0"
                style={{
                  color: isDone || isActive ? 'var(--color-paper)' : 'var(--color-paper-mute)',
                  fontWeight: 400,
                  width: '1.5rem',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                style={{
                  color: isActive
                    ? 'var(--color-paper)'
                    : isDone
                    ? 'var(--color-paper)'
                    : 'var(--color-paper-mute)',
                  fontWeight: isActive ? 500 : 400,
                  textDecorationLine: isDone ? 'line-through' : 'none',
                  textDecorationColor: 'var(--color-rule-strong)',
                  opacity: isDone ? 0.6 : 1,
                  transition: 'all 0.4s ease',
                }}
              >
                {step}
              </span>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="block w-1 h-1 rounded-full"
          style={{ background: 'var(--color-paper)' }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}
