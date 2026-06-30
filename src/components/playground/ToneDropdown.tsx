'use client'

import { useEffect, useRef, useState } from 'react'
import type { Tone } from '@/types/database'

interface ToneDropdownProps {
  value: Tone
  onChange: (tone: Tone) => void
  disabled?: boolean
}

const TONES: { id: Tone; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'persuasive', label: 'Persuasive' },
  { id: 'concise', label: 'Concise' },
  { id: 'creative', label: 'Creative' },
]

/**
 * Compact tone picker - a quiet pill that opens a small menu. Demoted
 * from the old full-width segmented row so it never competes with the
 * prompt input for attention. Most users keep the default.
 */
export function ToneDropdown({ value, onChange, disabled }: ToneDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = TONES.find(t => t.id === value)?.label ?? 'Professional'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="btn-outline inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ color: 'var(--color-paper)', border: '1px solid var(--color-rule-strong)' }}
      >
        <span style={{ color: 'var(--color-paper-mute)' }}>Tone:</span>
        {current}
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.6 }}>
          <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 bottom-full mb-2 left-0 min-w-44 rounded-2xl p-1.5"
          style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
        >
          {TONES.map(t => {
            const selected = t.id === value
            return (
              <li key={t.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => { onChange(t.id); setOpen(false) }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors hover:bg-[rgba(245,244,241,0.05)]"
                  style={{
                    color: selected ? 'var(--color-paper)' : 'var(--color-paper-mute)',
                    fontWeight: selected ? 500 : 400,
                  }}
                >
                  {t.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
