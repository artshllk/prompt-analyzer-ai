'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { NavKey } from './MarketingNav'

/**
 * The two secondary tools, behind one navbar slot.
 *
 * ===================================================================
 * WHY THIS EXISTS
 * ===================================================================
 *
 * The detector sat in the navbar and the improver sat in the footer. Both are
 * frozen, and no signed-in account has ever run a detection: there are zero
 * `text_detected` rows. Promoting one dead tool to the top level while hiding
 * the other was not a decision anybody made, it was where each of them
 * happened to land.
 *
 * Check keeps its own place, first and alone, because it is the product.
 *
 * ===================================================================
 * IT RENDERS IN THE SERVER HTML, OPEN OR NOT
 * ===================================================================
 *
 * The trigger and both links are always in the markup and `hidden` controls
 * visibility. A conditional render would put the only links to two pages
 * behind JavaScript, which is the bug that hid every FAQ answer from crawlers
 * for as long as that page existed. check:html asserts both hrefs are in the
 * HTML.
 */

/** Long enough that crossing the trigger does not open it. */
const OPEN_DELAY_MS = 150
/** Long enough to reach the panel, short enough not to feel stuck. */
const CLOSE_DELAY_MS = 220

export interface ToolItem {
  key: NavKey
  href: string
  label: string
  /** One line, lower case, saying what the tool does. */
  blurb: string
}

export function NavToolsMenu({
  items,
  current,
}: {
  items: ToolItem[]
  current?: NavKey
}) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const active = items.some(i => i.key === current)

  const clearTimers = useCallback(() => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
  }, [])

  /**
   * THE DIAGONAL PROBLEM, WHICH IS THE ONE PEOPLE FEEL.
   *
   * The panel sits below the trigger, so a pointer moving from the trigger to
   * the second item travels diagonally and leaves both elements on the way.
   * A menu that closes on `mouseleave` shuts in your face halfway there.
   *
   * The fix is not a bigger hit area, it is TIME: closing is delayed, and any
   * re-entry into the wrapper cancels it. The wrapper spans the trigger and
   * the panel, and the panel's top margin is bridged by padding rather than a
   * gap, so the diagonal path stays inside one element the whole way.
   */
  const scheduleOpen = useCallback(() => {
    clearTimers()
    openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS)
  }, [clearTimers])

  const scheduleClose = useCallback(() => {
    clearTimers()
    closeTimer.current = setTimeout(() => {
      setOpen(false)
      setFocused(-1)
    }, CLOSE_DELAY_MS)
  }, [clearTimers])

  useEffect(() => clearTimers, [clearTimers])

  // Click outside closes. Pointer-based close is handled by the timers above.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        clearTimers()
        setOpen(false)
        setFocused(-1)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, clearTimers])

  // Move focus to whichever item the arrow keys selected.
  useEffect(() => {
    if (open && focused >= 0) itemRefs.current[focused]?.focus()
  }, [open, focused])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      clearTimers()
      setOpen(false)
      setFocused(-1)
      // Focus goes back where it came from, or the next Tab starts from the
      // top of the page.
      triggerRef.current?.focus()
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      clearTimers()
      setOpen(true)
      setFocused(i => {
        const next = e.key === 'ArrowDown' ? i + 1 : i - 1
        // Wraps, so holding down does not dead-end at either edge.
        return (next + items.length) % items.length
      })
    }
  }

  if (items.length === 0) return null

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      onKeyDown={onKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          clearTimers()
          setOpen(o => !o)
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className="nav-tools-trigger flex items-center gap-1.5"
        style={{
          // State is carried by colour and weight, never opacity, which is a
          // contrast decision wearing a costume.
          color: active || open ? 'var(--ink)' : 'var(--ink-soft)',
          fontWeight: active ? 500 : 400,
        }}
      >
        Tools
        <svg
          width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true"
          className={`nav-tools-chevron ${open ? 'is-open' : ''}`}
        >
          <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Padding rather than margin, so the gap between trigger and panel is
          inside the wrapper and the pointer never leaves it. */}
      <div className="nav-tools-panel-wrap" hidden={!open}>
        <div role="menu" aria-label="Tools" className="nav-tools-panel">
          {items.map((item, i) => (
            <Link
              key={item.key}
              href={item.href}
              role="menuitem"
              ref={el => {
                itemRefs.current[i] = el
              }}
              tabIndex={open ? 0 : -1}
              onClick={() => {
                clearTimers()
                setOpen(false)
                setFocused(-1)
              }}
              className="nav-tools-item"
              aria-current={current === item.key ? 'page' : undefined}
            >
              <span
                className="nav-tools-label"
                style={{
                  color: 'var(--ink)',
                  fontWeight: current === item.key ? 600 : 500,
                }}
              >
                {item.label}
              </span>
              <span className="nav-tools-blurb">{item.blurb}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
