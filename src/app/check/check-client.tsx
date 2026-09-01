'use client'

import { useState } from 'react'
import { MarkedDocument } from '@/components/factcheck/MarkedDocument'
import { MAX_DOC_CHARS, MIN_DOC_CHARS } from '@/lib/factcheck/types'
import type { Claim } from '@/lib/factcheck/types'

/**
 * Paste a document, get its checkable claims marked.
 *
 * NOTHING HERE VERIFIES ANYTHING. Every claim comes back `unverifiable`,
 * and the copy says so in those words rather than dressing it up. Saying
 * "we found fourteen claims" is true and useful. Implying we checked them
 * would be the first lie the product ever told, in a product whose only
 * asset is being trusted.
 */

type State =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'done'; text: string; claims: Claim[]; truncated: boolean; foundCount: number }
  | { kind: 'error'; message: string }

// Every server error we can produce, in the user's language. The fallback
// matters as much as the entries: an unmapped code must still read as a
// sentence, never as `daily_capacity`.
const MESSAGES: Record<string, string> = {
  empty: 'Paste something first.',
  too_short: `That is too short to be worth checking. Around ${MIN_DOC_CHARS} characters is the minimum.`,
  too_long: `That is longer than we handle right now. Trim it to ${MAX_DOC_CHARS.toLocaleString()} characters or fewer and try again.`,
  rate_limited: 'You are going faster than we can keep up with. Wait a moment and try again.',
  daily_capacity: 'We have hit the free limit for today. It resets tomorrow.',
  identity_unavailable:
    'We can see you are signed in but cannot read your account right now. This is our problem, not yours. Try again in a few minutes.',
  invalid_body: 'Something went wrong sending that. Try again.',
  unavailable:
    'The model did not answer. Nothing was checked, so nothing here is a verdict. Try again.',
}

export function CheckClient() {
  const [text, setText] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  const chars = text.length
  const overLimit = chars > MAX_DOC_CHARS
  const working = state.kind === 'working'

  async function run() {
    if (working || !text.trim() || overLimit) return
    setState({ kind: 'working' })
    try {
      const res = await fetch('/api/factcheck/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        const code = data?.error as string | undefined
        setState({
          kind: 'error',
          message: (code && MESSAGES[code]) || 'Something went wrong on our end. Try again.',
        })
        return
      }
      setState({
        kind: 'done',
        text: data.text,
        claims: data.claims,
        truncated: Boolean(data.truncated),
        foundCount: data.foundCount ?? data.claims.length,
      })
    } catch {
      setState({
        kind: 'error',
        message: 'Could not reach the server. Check your connection and try again.',
      })
    }
  }

  if (state.kind === 'done') {
    return (
      <div>
        <MarkedDocument text={state.text} claims={state.claims} />

        {/* The cap, said out loud. Silently dropping claims in a product
            about honesty would be disqualifying. */}
        {state.truncated && (
          <p
            className="mt-5 text-[14px] leading-relaxed rounded-xl p-3"
            style={{ background: 'var(--guess-bg)', color: 'var(--guess)' }}
          >
            This document had {state.foundCount} checkable claims and we list the
            first {state.claims.length}. The rest are not marked. Run a shorter
            section to see them.
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setState({ kind: 'idle' })}
            className="text-[14px] px-4 py-2 rounded-full"
            style={{ background: 'var(--brand)', color: '#fff' }}
          >
            Check another
          </button>
          <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>
            Nothing has been verified against a source yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label htmlFor="doc" className="sr-only">
        Paste your document
      </label>
      <textarea
        id="doc"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={12}
        placeholder="Paste the document you are about to send."
        disabled={working}
        className="w-full rounded-2xl p-4 text-[15px] leading-[1.7] resize-y focus:outline-none focus:ring-2"
        style={{
          background: 'var(--card)',
          color: 'var(--ink)',
          border: `1px solid ${overLimit ? 'var(--brand-text)' : 'var(--rule)'}`,
        }}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={run}
          disabled={working || !text.trim() || overLimit}
          className="text-[15px] px-5 py-2.5 rounded-full disabled:opacity-45 disabled:cursor-not-allowed"
          style={{ background: 'var(--brand)', color: '#fff' }}
        >
          {working ? 'Reading...' : 'Find the claims'}
        </button>
        <span
          className="text-[13px]"
          style={{
            color: overLimit ? 'var(--brand-text)' : 'var(--ink-soft)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {chars.toLocaleString()} / {MAX_DOC_CHARS.toLocaleString()}
        </span>
      </div>

      {state.kind === 'error' && (
        <p
          className="mt-4 text-[14px] leading-relaxed rounded-xl p-3"
          style={{ background: 'var(--contradicted-bg)', color: 'var(--brand-text)' }}
        >
          {state.message}
        </p>
      )}
    </div>
  )
}
