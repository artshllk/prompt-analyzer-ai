'use client'

import { useState } from 'react'
import Link from 'next/link'
import { track } from '@/lib/track'

/**
 * "See what actually changes."
 *
 * Nobody can judge whether a prompt got better. Everybody can judge whether an
 * ANSWER got better. So this runs the original and the rewrite on a real model
 * and puts the two outputs side by side. It is the only honest proof the
 * product can offer, and it is why the clarity score was never needed.
 *
 * It costs double inference, which is why it is metered rather than free:
 * three model calls, two full generations plus a contrast pass. Free accounts
 * get three lifetime runs, because nobody pays for a feature they have never
 * seen work. Pro gets 100 per rolling 30 days.
 *
 * The server side of this has existed and worked for some time with no client
 * calling it. This is that client.
 */

interface CompareAnswersProps {
  original: string
  /** The rewrite as it currently stands, after any guesses were removed. */
  improved: string
}

type Result = {
  originalOutput: string
  improvedOutput: string
  contrast: string
  remaining: number
  limit: number
}

type State =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'done'; result: Result }
  | { kind: 'signin' }
  | { kind: 'limit'; limit: number; tier: string }
  | { kind: 'error'; message: string }

export function CompareAnswers({ original, improved }: CompareAnswersProps) {
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function run() {
    setState({ kind: 'running' })
    track('compare_clicked')
    try {
      const res = await fetch('/api/anon/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original, improved }),
      })

      if (res.status === 401) return setState({ kind: 'signin' })
      if (res.status === 402) {
        const d = await res.json().catch(() => ({}))
        return setState({ kind: 'limit', limit: d.limit ?? 0, tier: d.tier ?? 'free' })
      }
      if (res.status === 400) {
        const d = await res.json().catch(() => ({}))
        return setState({
          kind: 'error',
          message:
            d.error === 'prompts_identical'
              ? 'These two prompts are the same, so there is nothing to compare.'
              : 'That prompt is too long to run twice.',
        })
      }
      if (!res.ok) {
        return setState({
          kind: 'error',
          message: 'The comparison did not finish. Nothing was used up, so try again.',
        })
      }

      const result = (await res.json()) as Result
      track('compare_completed')
      setState({ kind: 'done', result })
    } catch {
      setState({
        kind: 'error',
        message: 'Network trouble. Nothing was used up, so try again.',
      })
    }
  }

  if (state.kind === 'idle' || state.kind === 'running' || state.kind === 'error') {
    return (
      <div className="mt-6">
        <button
          type="button"
          onClick={run}
          disabled={state.kind === 'running'}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all btn-outline disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-(--color-ink) focus:ring-(--color-machine)"
          style={{
            border: '1px solid var(--color-machine)',
            color: 'var(--color-machine)',
            fontWeight: 500,
          }}
        >
          {state.kind === 'running'
            ? 'Running both prompts…'
            : 'See what actually changes'}
        </button>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--color-paper-mute)' }}>
          Runs your original and this rewrite on a real model, side by side.
        </p>
        {state.kind === 'error' && (
          <p className="mt-3 text-[13px]" style={{ color: '#E89A6B' }}>
            {state.message}
          </p>
        )}
      </div>
    )
  }

  if (state.kind === 'signin') {
    return (
      <Gate
        title="This one needs an account."
        body="Running both prompts costs real model time, so it is tied to an account. Free accounts get three, which is enough to see whether the rewrite is doing anything."
        cta="Create a free account"
        href="/login?signup=1"
      />
    )
  }

  if (state.kind === 'limit') {
    return (
      <Gate
        title={
          state.tier === 'pro'
            ? 'You have used this month’s comparisons.'
            : 'You have used all three comparisons.'
        }
        body={
          state.tier === 'pro'
            ? `Pro includes ${state.limit} comparison runs every 30 days. The counter rolls, so the oldest ones come back.`
            : 'The free plan includes three, for good. Pro removes the daily improve limit and includes 100 comparisons every 30 days.'
        }
        cta={state.tier === 'pro' ? 'See your plan' : 'See what Pro includes'}
        href="/pricing"
      />
    )
  }

  const { result } = state
  return (
    <div className="mt-6">
      {result.contrast && (
        <p
          className="text-[15px] leading-relaxed mb-4 pb-4"
          style={{
            color: 'var(--color-paper)',
            borderBottom: '1px solid var(--color-rule)',
          }}
        >
          {result.contrast}
        </p>
      )}

      {/* Stacked on phones. Two columns of model output at 375px would be two
          columns of nothing readable. */}
      <div className="grid gap-4 md:grid-cols-2">
        <Output label="Your original prompt" text={result.originalOutput} />
        <Output label="The rewrite" text={result.improvedOutput} machine />
      </div>

      <p className="mt-4 text-[13px]" style={{ color: 'var(--color-paper-mute)' }}>
        {result.remaining} of {result.limit} comparison
        {result.limit === 1 ? '' : 's'} left.
      </p>
    </div>
  )
}

function Output({
  label,
  text,
  machine,
}: {
  label: string
  text: string
  machine?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: machine ? 'var(--color-machine-bg)' : 'var(--color-ink-card)',
        border: `1px solid ${machine ? 'var(--color-machine)' : 'var(--color-rule-strong)'}`,
      }}
    >
      <p
        className="eyebrow mb-3"
        style={{ color: machine ? 'var(--color-machine)' : 'var(--color-paper-mute)' }}
      >
        {label}
      </p>
      <p
        className="text-[14px] leading-[1.65] whitespace-pre-wrap wrap-break-word"
        style={{ color: 'var(--color-paper)' }}
      >
        {text}
      </p>
    </div>
  )
}

function Gate({
  title,
  body,
  cta,
  href,
}: {
  title: string
  body: string
  cta: string
  href: string
}) {
  return (
    <div
      className="mt-6 rounded-2xl p-5"
      style={{
        background: 'var(--color-ink-card)',
        border: '1px solid var(--color-rule-strong)',
      }}
    >
      <p className="text-[15px] mb-2" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>
        {title}
      </p>
      <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'var(--color-paper-mute)' }}>
        {body}
      </p>
      <Link
        href={href}
        className="inline-flex items-center px-5 py-2.5 rounded-full text-sm transition-all btn-paper"
        style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
      >
        {cta}
      </Link>
    </div>
  )
}
