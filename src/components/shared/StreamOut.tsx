'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * Streams text in at reading pace, the way ChatGPT / Claude / Gemini
 * reveal output. Advances by elapsed time (not per-frame) so growth is
 * steady - no bursts - and frame-rate independent. Respects
 * prefers-reduced-motion by showing the full text immediately.
 *
 * Shared by the homepage demo (DemoChat) and the playground so the two
 * never drift. Styling is passed in via className/style so each surface
 * keeps its own type treatment.
 */

interface StreamOutProps {
  text: string
  /** Characters per second. ~70 reads as fast-but-comfortable. */
  cps?: number
  className?: string
  style?: React.CSSProperties
  /** Show a blinking caret while streaming. */
  caret?: boolean
}

export function StreamOut({
  text,
  cps = 70,
  className,
  style,
  caret = true,
}: StreamOutProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(0)
    if (!text) return

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setCount(text.length)
      return
    }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const target = Math.min(text.length, Math.floor(((now - start) / 1000) * cps))
      setCount(target)
      if (target < text.length) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, cps])

  const done = count >= text.length

  return (
    <p className={className} style={style} aria-live="polite">
      {text.slice(0, count)}
      {caret && !done && (
        <motion.span
          className="inline-block w-0.5 h-[1.05em] align-text-bottom ml-0.5"
          style={{ background: 'var(--color-accent-bright)' }}
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          aria-hidden
        />
      )}
    </p>
  )
}
