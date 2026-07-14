'use client'

import { useEffect, useState } from 'react'

/**
 * What Deepclario remembers about you, and how to make it forget.
 *
 * The engine asks what a prompt is missing ("Who is this for?"). You answer.
 * It remembers, so it never asks you the same thing cold twice.
 *
 * A memory feature people cannot see or delete is a liability. Everything the
 * engine has learned is listed here in plain words, and any of it can be
 * removed in one click.
 */

interface Memory {
  label: string
  answer: string
  timesUsed: number
}

export function MemorySection() {
  const [memory, setMemory] = useState<Memory[] | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/account/memory')
      .then(r => r.json())
      .then(d => setMemory(Array.isArray(d.memory) ? d.memory : []))
      .catch(() => setMemory([]))
  }, [])

  async function forget(label?: string) {
    setBusy(true)
    try {
      const url = label
        ? `/api/account/memory?label=${encodeURIComponent(label)}`
        : '/api/account/memory'
      await fetch(url, { method: 'DELETE' })
      setMemory(prev =>
        label ? (prev ?? []).filter(m => m.label !== label) : []
      )
    } finally {
      setBusy(false)
    }
  }

  // Nothing learned yet, or still loading: say nothing. An empty box with a
  // "delete all" button under it is just noise.
  if (memory === null || memory.length === 0) return null

  return (
    <section className="card-editorial p-6 space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">What we remember</p>
        <button
          onClick={() => forget()}
          disabled={busy}
          className="text-xs underline underline-offset-4 transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          Forget everything
        </button>
      </div>

      <p className="text-sm leading-[1.6]" style={{ color: 'var(--color-paper-mute)' }}>
        When we ask what a prompt is missing, we remember your answer, so we do
        not ask you the same thing cold every time. We offer it back. We never
        assume it.
      </p>

      <ul className="space-y-px">
        {memory.map(m => (
          <li key={m.label}>
            <div className="rule" />
            <div className="flex items-baseline justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="text-sm capitalize" style={{ color: 'var(--color-paper-mute)' }}>
                  {m.label}
                </p>
                <p className="text-base truncate" style={{ color: 'var(--color-paper)' }}>
                  {m.answer}
                </p>
              </div>
              <button
                onClick={() => forget(m.label)}
                disabled={busy}
                className="shrink-0 text-xs underline underline-offset-4 transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ color: 'var(--color-paper-mute)' }}
              >
                Forget
              </button>
            </div>
          </li>
        ))}
        <li className="rule" />
      </ul>
    </section>
  )
}
