'use client'

import { useState } from 'react'

/**
 * Copy-to-clipboard button for a prompt block. Kept as its own small
 * client component so the prompt pages can stay server-rendered (better
 * for SEO) — only this button needs interactivity.
 */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Insecure context / old browser — the prompt text is visible and
      // selectable on the page, so the user can still copy it manually.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all btn-paper"
      style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
    >
      {copied ? 'Copied' : 'Copy prompt'}
      {!copied && (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M9.5 4.5V2.5H2.5V9.5H4.5M4.5 4.5H11.5V11.5H4.5V4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
