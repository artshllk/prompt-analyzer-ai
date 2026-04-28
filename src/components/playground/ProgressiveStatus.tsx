'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/8 to-cyan-500/4 px-5 py-5 overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        />
        <span className="text-sm font-medium text-violet-200">
          {mode === 'analyzing' ? 'Analyzing your prompt' : 'Generating improvement'}
        </span>
      </div>

      <ul className="space-y-2">
        {steps.map((step, i) => {
          const isDone = i < activeStep
          const isActive = i === activeStep
          return (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span
                className={`relative w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isDone
                    ? 'bg-violet-500/80 border border-violet-400/60'
                    : isActive
                      ? 'bg-violet-500/20 border border-violet-400/50'
                      : 'bg-[#0a0e1a] border border-[#1e2d4a]'
                }`}
              >
                {isDone && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {isActive && (
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-violet-300"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                )}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${step}-${isDone}-${isActive}`}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: isDone || isActive ? 1 : 0.45 }}
                  className={
                    isDone
                      ? 'text-[#cdd5ee]'
                      : isActive
                        ? 'text-[#f0f4ff] font-medium'
                        : 'text-[#5a6a90]'
                  }
                >
                  {step}
                </motion.span>
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}
