'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Lightweight entrance wrapper: a gentle fade + rise, staggered by
 * `delay`. Server-rendered children are passed straight through, so this
 * only adds motion, never changes data flow. Respects reduced-motion.
 *
 * `blur` adds a blur-to-sharp resolve on top of the rise - reserved for
 * one display headline per page, where the extra weight reads as
 * intentional rather than decorative.
 */
export function Reveal({
  children,
  delay = 0,
  blur = false,
  className,
}: {
  children: ReactNode
  delay?: number
  blur?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={
        reduce
          ? false
          : { opacity: 0, y: 14, ...(blur && { filter: 'blur(8px)' }) }
      }
      animate={{ opacity: 1, y: 0, ...(blur && { filter: 'blur(0px)' }) }}
      transition={{
        duration: blur ? 0.7 : 0.5,
        ease: [0.16, 1, 0.3, 1],
        delay: reduce ? 0 : delay,
      }}
    >
      {children}
    </motion.div>
  )
}
