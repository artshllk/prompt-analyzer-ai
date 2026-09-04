'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { NavKey } from './MarketingNav'

/**
 * The two secondary tools, behind one navbar slot.
 *
 * ===================================================================
 * WHY THIS EXISTS
 * ===================================================================
 *
 * The detector sat in the navbar and the prompt improver sat in the footer.
 * Both are frozen, and no signed-in account has ever run a detection: there
 * are zero `text_detected` rows in the database. Promoting one dead tool to
 * the top level while hiding the other was not a decision anybody made, it
 * was where each of them happened to land.
 *
 * So they share a slot and a word that is honest about what they are. The
 * checker keeps its own place, first and alone, because it is the product and
 * a first-time visitor should see one thing.
 */
export function NavToolsMenu({
  items,
  current,
}: {
  items: { key: NavKey; href: string; label: string }[]
  current?: NavKey
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const active = items.some(i => i.key === current)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (items.length === 0) return null

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 transition-colors hover:text-[var(--ink)]"
        style={{
          // Same rule as the flat links: state is carried by colour and
          // weight, never opacity, which is a contrast decision in disguise.
          color: active || open ? 'var(--ink)' : 'var(--ink-soft)',
          fontWeight: active ? 500 : 400,
        }}
      >
        Tools
        <svg
          width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        role="menu"
        hidden={!open}
        className="absolute left-0 top-full mt-2 min-w-[196px] rounded-xl py-1.5 z-50"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--rule)',
          boxShadow: '0 8px 28px rgba(21, 19, 15, 0.10)',
        }}
      >
        {items.map(item => (
          <Link
            key={item.key}
            href={item.href}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2.5 text-sm transition-colors"
            style={{
              color: current === item.key ? 'var(--ink)' : 'var(--ink-soft)',
              fontWeight: current === item.key ? 500 : 400,
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
