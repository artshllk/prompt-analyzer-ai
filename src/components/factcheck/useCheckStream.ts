'use client'

import { useCallback, useRef, useState } from 'react'
import type { Claim, CitationDensity, CitationResult } from '@/lib/factcheck/types'

/**
 * Reading the NDJSON check stream.
 *
 * Holds one rule: STATE ONLY EVER MOVES FORWARD. Every claim starts not
 * checked and each event upgrades exactly one of them. Nothing is held back to
 * be revealed at the end, and nothing already shown is taken away, because a
 * mark that appears and then vanishes is worse than one that never appeared.
 */

export interface ClaimProgress {
  stage: 'waiting' | 'opening' | 'reading' | 'slow'
  host?: string
}

export interface Refusals {
  paywalled: number
  dead: number
  live: number
  noSource: number
}

export type StreamState =
  | { kind: 'idle' }
  | { kind: 'extracting' }
  | {
      kind: 'checking' | 'done'
      text: string
      claims: Claim[]
      density: CitationDensity
      truncated: boolean
      foundCount: number
      progress: Record<string, ClaimProgress>
      checked: number
      checkable: number
      refusals?: Refusals
      failure?: string
    }
  | { kind: 'error'; message: string }

const MESSAGES: Record<string, string> = {
  empty: 'Paste something first.',
  too_short: 'That is too short to check. Paste a bit more.',
  too_long: 'That is too long. Try one section at a time.',
  rate_limited: 'Slow down a moment, then try again.',
  anon_daily_limit:
    'That is 2 checks today. Make a free account for 10 a month.',
  free_monthly_limit: 'That is your 10 checks this month. Pro gives you 100.',
  pro_monthly_limit:
    'That is 100 checks this month, which is the Pro cap. Email us if you need more.',
  daily_capacity: 'We have hit today’s free limit. It resets tomorrow.',
  identity_unavailable:
    'We can see you are signed in but cannot read your account. That is our problem. Try again in a few minutes.',
  invalid_body: 'Something went wrong sending that. Try again.',
  unavailable: 'That did not work. Nothing was checked. Try again.',
}

export function useCheckStream() {
  const [state, setState] = useState<StreamState>({ kind: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setState({ kind: 'idle' })
  }, [])

  const run = useCallback(async (text: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setState({ kind: 'extracting' })

    try {
      const res = await fetch('/api/factcheck/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null)
        const code = data?.error as string | undefined
        setState({
          kind: 'error',
          message: (code && MESSAGES[code]) || 'Something went wrong on our end. Try again.',
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffered = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffered += decoder.decode(value, { stream: true })
        // NDJSON: everything up to the last newline is complete. The tail is a
        // partial line and waits for the next chunk.
        const lines = buffered.split('\n')
        buffered = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          let event: Record<string, unknown>
          try {
            event = JSON.parse(line)
          } catch {
            continue // a malformed line is skipped, never fatal
          }
          setState(prev => apply(prev, event))
        }
      }
      setState(prev => (prev.kind === 'checking' ? { ...prev, kind: 'done' } : prev))
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      setState({
        kind: 'error',
        message: 'Could not reach the server. Check your connection and try again.',
      })
    }
  }, [])

  return { state, run, reset }
}

function apply(prev: StreamState, event: Record<string, unknown>): StreamState {
  const type = event.type as string

  if (type === 'claims') {
    const claims = event.claims as Claim[]
    return {
      kind: 'checking',
      text: event.text as string,
      claims,
      density: event.density as CitationDensity,
      truncated: Boolean(event.truncated),
      foundCount: (event.foundCount as number) ?? claims.length,
      progress: {},
      checked: 0,
      // Only claims that will actually be opened count toward the visible
      // total, or the counter would stall at "7 of 19" forever while the other
      // twelve were never going to be fetched.
      checkable: 0,
    }
  }

  if (prev.kind !== 'checking' && prev.kind !== 'done') return prev

  switch (type) {
    case 'opening':
      return {
        ...prev,
        checkable: prev.checkable + 1,
        progress: {
          ...prev.progress,
          [event.id as string]: { stage: 'opening', host: event.host as string },
        },
      }
    case 'reading':
    case 'slow':
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [event.id as string]: {
            stage: type as 'reading' | 'slow',
            host: event.host as string,
          },
        },
      }
    case 'resolved': {
      const id = event.id as string
      const rest = { ...prev.progress }
      delete rest[id]
      return {
        ...prev,
        checked: prev.checked + 1,
        progress: rest,
        claims: prev.claims.map(c =>
          c.id === id ? { ...c, citation: event.citation as CitationResult } : c
        ),
      }
    }
    case 'refusals': {
      const results = event.results as Record<string, CitationResult>
      const reasons = event.claimReasons as Record<string, 'live_source'>
      return {
        ...prev,
        refusals: event.counts as Refusals,
        claims: prev.claims.map(c => {
          const found = results[c.id]
          if (!found) return c
          const reason = reasons[c.id]
          return {
            ...c,
            citation: found,
            judgement:
              reason && c.judgement.verdict === 'unchecked'
                ? { ...c.judgement, reason }
                : c.judgement,
          }
        }),
      }
    }
    case 'failed':
      return { ...prev, failure: event.failure as string }
    case 'done':
      return { ...prev, kind: 'done' }
    default:
      return prev
  }
}
