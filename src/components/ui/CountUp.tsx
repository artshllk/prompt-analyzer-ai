'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Counts a number up from 0 to `value` on mount, at reading pace. A small
 * premium touch for dashboard metrics. Respects prefers-reduced-motion
 * (renders the final value immediately). Uses requestAnimationFrame with
 * an ease-out so it decelerates into the final number.
 */
export function CountUp({
  value,
  durationMs = 900,
  prefix = '',
}: {
  value: number
  durationMs?: number
  prefix?: string
}) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setDisplay(Math.round(value * eased))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, durationMs, reduce])

  return (
    <span className="tabular-nums">
      {prefix}
      {display}
    </span>
  )
}
