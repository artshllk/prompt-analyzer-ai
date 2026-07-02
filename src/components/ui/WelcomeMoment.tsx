'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/**
 * Post-signup welcome moment: a ~2s branded bridge shown exactly once,
 * on a brand-new user's first dashboard visit. This is the one place a
 * splash-style beat is earned - the user has just committed, and the
 * moment doubles as a soft landing into the app.
 *
 * Guardrails, in order of importance:
 * - Once ever per user (localStorage flag, written the moment it shows,
 *   so an interrupted session never replays it).
 * - Click anywhere or Escape skips instantly.
 * - Auto-dismisses; nothing to wait on, nothing to read twice.
 * - Reduced motion skips the whole thing - without the choreography it
 *   would just be a delay.
 */
export function WelcomeMoment({
  firstName,
  userId,
  enabled,
}: {
  firstName: string | null
  userId: string
  enabled: boolean
}) {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled || reduce) return
    const key = `dc:welcomed:${userId}`
    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, '1')
    } catch {
      return
    }
    // Post-paint timeout rather than a synchronous set: the dashboard
    // paints first, so hydration stays clean and the overlay fades in
    // over it rather than flashing.
    const show = setTimeout(() => setVisible(true), 50)
    const hide = setTimeout(() => setVisible(false), 2450)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [enabled, reduce, userId])

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-label={`Welcome to Deepclario${firstName ? `, ${firstName}` : ''}`}
          className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
          style={{ background: 'var(--color-ink)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
          transition={{ duration: 0.25 }}
          onClick={() => setVisible(false)}
        >
          {/* Ambient accent glow behind the mark */}
          <motion.div
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{
              width: 560,
              height: 560,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, var(--color-accent-glow), transparent 65%)',
              filter: 'blur(40px)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />

          <div className="relative flex flex-col items-center gap-6 px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image src="/logo.png" alt="" width={48} height={48} priority />
            </motion.div>
            <motion.p
              className="display text-4xl md:text-5xl"
              style={{ color: 'var(--color-paper)' }}
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.7,
                delay: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {firstName ? (
                <>Welcome, {firstName}.</>
              ) : (
                <>Welcome to Deepclario.</>
              )}
            </motion.p>
            <motion.p
              className="eyebrow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              Bring your worst prompt
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
