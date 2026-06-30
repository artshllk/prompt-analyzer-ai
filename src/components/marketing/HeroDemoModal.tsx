'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DemoChat } from './DemoChat'

/**
 * Homepage hero entry point. Renders the primary CTA; clicking it opens a
 * modal that hosts the live demo inline, so a cold visitor goes straight
 * from "promise" to "their own prompt, improved" without leaving the page.
 *
 * Shell behaviour:
 *   - Content-driven width: narrow for the composer, wider for the
 *     conversation. Generous max sizes so longer threads never feel boxed.
 *   - Height capped to the viewport; overflow scrolls INSIDE the panel.
 *   - Safe dismissal: once there's active work or a generated rewrite
 *     (DemoChat reports `dirty`), a backdrop click does NOT destroy state.
 *     It pulses the close button and shows a hint instead. Closing is then
 *     an intentional act (the X, or Escape). A clean/idle modal still
 *     closes on backdrop click for quick dismissal.
 *   - Focus trapped while open; focus returns to the trigger on close.
 */
export function HeroDemoModal() {
  const [open, setOpen] = useState(false)
  const [wide, setWide] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [nudge, setNudge] = useState(false)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const close = useCallback(() => setOpen(false), [])

  // Backdrop click: protect dirty state, dismiss otherwise.
  const onBackdrop = useCallback(() => {
    if (!dirty) {
      close()
      return
    }
    // Don't destroy work. Draw the eye to the deliberate close affordance.
    setNudge(true)
    closeRef.current?.focus()
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current)
    nudgeTimer.current = setTimeout(() => setNudge(false), 2200)
  }, [dirty, close])

  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const first = panelRef.current?.querySelector<HTMLElement>(
      'textarea, button, [href], input, [tabindex]:not([tabindex="-1"])',
    )
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key !== 'Tab') return
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables || focusables.length === 0) return
      const list = Array.from(focusables)
      const firstEl = list[0]
      const lastEl = list[list.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      triggerRef.current?.focus()
    }
  }, [open, close])

  // Reset transient state when the modal closes.
  useEffect(() => {
    if (!open) {
      setWide(false)
      setDirty(false)
      setNudge(false)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[15px] transition-all btn-paper"
        style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
      >
        Try with your prompt
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="demo-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Try Deepclario with your prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-6"
            style={{ background: 'rgba(10,10,12,0.72)', backdropFilter: 'blur(8px)' }}
            onMouseDown={e => {
              if (e.target === e.currentTarget) onBackdrop()
            }}
          >
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="relative w-full flex flex-col rounded-t-3xl sm:rounded-3xl"
              style={{
                background: 'var(--color-ink)',
                border: '1px solid var(--color-rule-strong)',
                // Generous, content-driven width. Wider once a conversation
                // exists so longer threads breathe.
                maxWidth: wide ? 'min(64rem, 100%)' : 'min(38rem, 100%)',
                maxHeight: '90dvh',
                transition: 'max-width 0.45s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              }}
            >
              <button
                ref={closeRef}
                onClick={close}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full transition-all opacity-60 hover:opacity-100 focus:opacity-100 focus:outline-none"
                style={{
                  border: `1px solid ${nudge ? 'var(--color-accent-bright)' : 'var(--color-rule-strong)'}`,
                  color: nudge ? 'var(--color-accent-bright)' : 'var(--color-paper)',
                  boxShadow: nudge ? '0 0 0 4px rgba(91,143,237,0.18)' : 'none',
                  transform: nudge ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              <div className="overflow-y-auto overscroll-contain p-5 sm:p-8 md:p-10">
                <DemoChat onWide={setWide} onDirty={setDirty} />
              </div>

              {/* Safe-dismiss hint - only appears when a backdrop click was
                  intercepted to protect content. */}
              <AnimatePresence>
                {nudge && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs whitespace-nowrap"
                    style={{
                      background: 'var(--color-ink-card)',
                      border: '1px solid var(--color-rule-strong)',
                      color: 'var(--color-paper)',
                    }}
                  >
                    Close with the × to keep your result
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
