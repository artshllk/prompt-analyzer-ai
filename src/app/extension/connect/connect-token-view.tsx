'use client'

import { useState } from 'react'

export function ConnectTokenView({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Older browsers / insecure context - user can still select & copy manually.
    }
  }

  return (
    <div className="mt-10">
      <p className="eyebrow mb-3">Your connection code</p>
      <div
        className="p-5 rounded-2xl flex items-center gap-3"
        style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}
      >
        <code
          className="flex-1 font-mono text-sm md:text-base break-all"
          style={{ color: 'var(--color-paper)' }}
        >
          {token}
        </code>
        <button
          type="button"
          onClick={copy}
          className="px-4 py-2 rounded-full text-sm transition-all btn-paper shrink-0"
          style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="mt-3 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
        Paste this into the extension panel. Treat it like a password - anyone with
        the code can use your Deepclario allowance.
      </p>
    </div>
  )
}
