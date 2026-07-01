'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Lightweight entrance wrapper: a gentle fade + rise, staggered by
 * `delay`. Server-rendered children are passed straight through, so this
 * only adds motion, never changes data flow. Respects reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  )
}
