'use client'

import { useEffect, useState } from 'react'

/**
 * The sharpen shortcut, named the way the reader's own keyboard names it.
 *
 * On a Mac there is no key labelled "Alt" - it says Option, and it prints ⌥.
 * Telling a Mac user to "press Alt+I" sends them hunting for a key that is not
 * on their keyboard. (Worse, Option+I is a dead key on macOS: it composes an
 * accent. The extension listens on the physical key code so it still works,
 * but the label has to match what they are actually looking at.)
 *
 * Renders the Windows/Linux label on the server so there is no hydration
 * mismatch, then corrects it on the client once we know the platform.
 */
export function Hotkey({ plain = false }: { plain?: boolean }) {
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || ''))
  }, [])

  const label = isMac ? '⌥ I' : 'Alt + I'

  if (plain) return <>{label}</>

  return (
    <kbd
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.85em] font-semibold"
      style={{
        border: '1px solid var(--color-rule-strong)',
        background: 'var(--color-ink-card)',
        color: 'var(--color-paper)',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </kbd>
  )
}
