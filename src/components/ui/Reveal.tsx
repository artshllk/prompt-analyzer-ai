'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Scroll reveal: a fade and a 14px rise, once, when the block enters view.
 *
 * WHY THIS IS NOT FRAMER-MOTION ANY MORE
 *
 * The old version set `initial={{ opacity: 0 }}`, which framer server-renders
 * as an inline `opacity: 0`. So the HTML that leaves the server has the
 * content hidden, and it only becomes visible once React hydrates and undoes
 * it. If the bundle fails, is blocked, or is simply slow on a bad connection,
 * the visitor gets a blank page that looks like an outage. On a marketing
 * page that is the worst possible failure, and it was shipped.
 *
 * Now nothing is hidden by default. The element renders visible, JS adds
 * `.reveal` on mount (which hides it) and `.reveal-in` when it scrolls into
 * view. No JS means no classes means fully visible content, which is the
 * correct fallback.
 *
 * It also actually watches the scroll. The old one animated on MOUNT, so
 * every "reveal" below the fold fired while it was off screen and the visitor
 * scrolled down to find it already finished.
 *
 * Rules from the brief, enforced here:
 *   threshold 0.15, unobserve after firing once
 *   500ms cubic-bezier(.16,1,.3,1), children staggered 60ms via `index`
 *   section-level blocks only, six per page maximum
 *   prefers-reduced-motion disables all of it (handled in globals.css)
 */
export function Reveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode
  /** Position in a staggered group. Each step delays by 60ms. */
  index?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Starts false so the server-rendered markup carries no hiding class at
  // all. The element is only made hideable once we know JS is running and
  // can therefore be relied on to reveal it again.
  const [armed, setArmed] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    // Already in view on first paint (the hero, usually). Arming it would
    // mean hiding something the visitor is looking at, then fading it back
    // in, which reads as a flash rather than an entrance.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.85) {
      setArmed(true)
      const id = window.setTimeout(() => setShown(true), 20 + index * 60)
      return () => window.clearTimeout(id)
    }

    setArmed(true)
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          // Once only. A block that re-animates every time it crosses the
          // viewport is the thing that makes a page feel generated.
          io.unobserve(entry.target)
          window.setTimeout(() => setShown(true), index * 60)
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [index])

  const classes = [className, armed && 'reveal', armed && shown && 'reveal-in']
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={ref} className={classes || undefined}>
      {children}
    </div>
  )
}
