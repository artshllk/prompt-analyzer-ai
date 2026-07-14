'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Insights: the habits that keep costing you a good answer.
 *
 * The old version reported score deltas ("average moved from 42 to 78").
 * That is trivia about the tool. This reports what the user actually keeps
 * leaving out - "you don't say who it is for, in 7 of 10 prompts" - which is
 * something they can fix tomorrow.
 */

interface InsightsData {
  week: { promptsCount: number }
  month: { promptsCount: number }
  dailyActivity: { date: string; count: number }[]
  streak: number
  /** The gaps that came up most: what they keep leaving out. */
  habits: { label: string; count: number; outOf: number }[]
  askedCount: number
  askedRate: number
  avgStartingScore: number | null
}

/** Plain-English advice per gap. Falls back to the label if we have no tip. */
const HABIT_TIPS: Record<string, string> = {
  goal: 'Say what you actually want out of it, not just the topic.',
  audience: 'Name who reads it. The same request changes completely depending on who it is for.',
  reader: 'Name who reads it. The same request changes completely depending on who it is for.',
  length: 'Say how long. Otherwise the model picks for you, and it usually picks wrong.',
  format: 'Say what shape you want back: a list, a table, a draft, a plan.',
  tone: 'Say how it should sound. "Plain and direct" is a real instruction.',
  limits: 'Say what to avoid. Constraints do more work than adjectives.',
  days: 'Say how much time you actually have.',
  context: 'Give the background the model cannot guess: what came before, why it matters.',
  deadline: 'Say when it is due. It changes what a good answer looks like.',
  examples: 'One example of what good looks like beats five adjectives.',
}

function tipFor(label: string): string | null {
  const key = label.toLowerCase().trim()
  if (HABIT_TIPS[key]) return HABIT_TIPS[key]
  for (const k of Object.keys(HABIT_TIPS)) {
    if (key.includes(k)) return HABIT_TIPS[k]
  }
  return null
}

export function InsightsClient() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/insights/weekly')
      .then(r => r.json())
      .then(d => {
        if (d?.error) setError(true)
        else setData(d)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-px">
        <div className="rule-strong" />
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 py-8">
              {[1, 2, 3, 4].map(j => (
                <div key={j}>
                  <div className="h-2 w-12 mb-3" style={{ background: 'var(--color-rule-strong)' }} />
                  <div className="h-8 w-16" style={{ background: 'var(--color-rule-strong)' }} />
                </div>
              ))}
            </div>
            <div className="rule" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <section className="py-12">
        <div className="rule-strong" />
        <p className="py-8 font-serif tracking-tight text-xl md:text-2xl" style={{ color: 'var(--color-paper-mute)' }}>
          We couldn&rsquo;t load your insights right now. Try again in a moment.
        </p>
        <div className="rule-strong" />
      </section>
    )
  }

  if (data.month.promptsCount === 0) return <EmptyState />

  const top = data.habits[0]
  const topTip = top ? tipFor(top.label) : null

  return (
    <div className="space-y-12">
      {/* The headline: the one habit worth fixing. */}
      <section className="grid md:grid-cols-12 gap-6 md:gap-12">
        <div className="md:col-span-3">
          <p className="eyebrow">What you keep leaving out</p>
        </div>
        <div className="md:col-span-9">
          {top ? (
            <>
              <p
                className="font-serif tracking-tight text-2xl md:text-[2.4rem] leading-tight"
                style={{ color: 'var(--color-paper)' }}
              >
                You leave out{' '}
                <span style={{ fontStyle: 'italic' }}>{top.label.toLowerCase()}</span>{' '}
                in{' '}
                <span className="tabular-nums">{top.count}</span> of{' '}
                <span className="tabular-nums">{top.outOf}</span> prompts.
              </p>
              {topTip && (
                <div className="mt-6 pl-5" style={{ borderLeft: '1px solid var(--color-rule-strong)' }}>
                  <p
                    className="font-serif text-base md:text-lg leading-[1.55]"
                    style={{ color: 'var(--color-paper)', fontWeight: 400 }}
                  >
                    {topTip}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p
              className="font-serif tracking-tight text-xl md:text-2xl leading-tight"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              Open Compare on an improved prompt and we&rsquo;ll start spotting your
              patterns here.
            </p>
          )}
        </div>
      </section>

      {/* The rest of the habits. */}
      {data.habits.length > 1 && (
        <section className="grid md:grid-cols-12 gap-6 md:gap-12">
          <div className="md:col-span-3">
            <p className="eyebrow">The rest</p>
            <p className="text-xs mt-2" style={{ color: 'var(--color-paper-mute)' }}>
              Things an AI cannot guess for you.
            </p>
          </div>
          <div className="md:col-span-9 space-y-4">
            {data.habits.slice(1).map(h => {
              const pct = Math.max(8, Math.round((h.count / data.habits[0].count) * 100))
              return (
                <div key={h.label} className="flex items-center gap-4">
                  <span
                    className="text-sm md:text-base shrink-0 w-40"
                    style={{ color: 'var(--color-paper)' }}
                  >
                    {h.label}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--color-rule-strong)' }}>
                    <div className="h-px" style={{ width: `${pct}%`, background: 'var(--color-paper-mute)' }} />
                  </div>
                  <span
                    className="font-serif text-base tabular-nums w-16 text-right"
                    style={{ color: 'var(--color-paper)', fontWeight: 400 }}
                  >
                    {h.count}/{h.outOf}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* How often the prompt was too vague to act on. */}
      {data.month.promptsCount >= 3 && (
        <section>
          <div className="rule-strong" />
          <div className="grid grid-cols-12 gap-3 md:gap-6 py-6 items-baseline">
            <div className="col-span-5 md:col-span-3">
              <p className="eyebrow">Started too vague</p>
            </div>
            <div className="col-span-7 md:col-span-9">
              <p className="text-base md:text-lg" style={{ color: 'var(--color-paper)' }}>
                <span className="font-serif text-2xl md:text-3xl tabular-nums mr-2" style={{ fontWeight: 400 }}>
                  {data.askedRate}%
                </span>
                <span style={{ color: 'var(--color-paper-mute)' }}>
                  of your prompts needed a question before they could be improved.
                  {data.askedRate >= 50
                    ? ' Most of the time you are starting from a topic, not a request.'
                    : ' Most of the time you say enough to act on.'}
                </span>
              </p>
            </div>
          </div>
          <div className="rule" />
        </section>
      )}

      {/* Activity */}
      <section>
        <div className="rule-strong" />
        <div className="py-7">
          <div className="flex items-baseline justify-between mb-5">
            <p className="eyebrow">Daily activity</p>
            <p className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>
              Last 14 days &middot; {data.streak > 0 ? `${data.streak} day streak` : 'no streak yet'}
            </p>
          </div>
          <DailyBars data={data.dailyActivity} />
        </div>
        <div className="rule-strong" />
      </section>

      {/* Practice nudge - points at the extension, which is where the work happens. */}
      <section className="grid md:grid-cols-12 gap-6 md:gap-12 pt-6">
        <div className="md:col-span-3">
          <p className="eyebrow">Try this week</p>
        </div>
        <div className="md:col-span-9">
          <p
            className="font-serif tracking-tight text-xl md:text-2xl leading-tight mb-4"
            style={{ color: 'var(--color-paper)' }}
          >
            {top
              ? `Before you hit improve, add ${top.label.toLowerCase()} yourself. Then see what is left.`
              : 'Write your next prompt, then improve it and see what you missed.'}
          </p>
          <p className="text-base leading-[1.55] mb-6" style={{ color: 'var(--color-paper-mute)' }}>
            The fastest way to get better is to try the fix yourself first, then compare.
          </p>
          <Link
            href="/extension"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
            style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
          >
            Open the extension
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}

function DailyBars({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.count))
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map(d => {
        const h = d.count === 0 ? 2 : Math.max(6, Math.round((d.count / max) * 76))
        return (
          <div key={d.date} className="flex-1 flex flex-col justify-end" title={`${d.date}: ${d.count}`}>
            <div
              style={{
                height: `${h}px`,
                background: d.count > 0 ? 'var(--color-paper)' : 'var(--color-rule-strong)',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

function EmptyState() {
  return (
    <section className="py-12">
      <div className="rule-strong" />
      <p
        className="py-8 font-serif tracking-tight text-xl md:text-2xl leading-tight"
        style={{ color: 'var(--color-paper)' }}
      >
        Nothing here yet. Improve a few prompts and we&rsquo;ll show you what you keep
        leaving out.
      </p>
      <Link
        href="/extension"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper mb-8"
        style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
      >
        Get the extension
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <div className="rule-strong" />
    </section>
  )
}
