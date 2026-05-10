'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface InsightsData {
  week: { promptsCount: number; avgBefore: number; avgAfter: number; avgLift: number }
  prevWeek: { promptsCount: number; avgAfter: number }
  month: { promptsCount: number; avgAfter: number }
  dailyActivity: { date: string; count: number; avgAfter: number }[]
  streak: number
  topTags: { tag: string; count: number }[]
  bestThisWeek: { id: string; prompt: string; before: number; after: number } | null
  biggestLift: { id: string; prompt: string; before: number; after: number; delta: number } | null
}

const TAG_LABELS: Record<string, { label: string; tip: string }> = {
  context: { label: 'adding context', tip: 'Try giving the model the background up front — who the audience is, what came before, why it matters.' },
  role: { label: 'assigning a role', tip: 'Start with "Act as a..." to anchor the response in a specific perspective.' },
  format: { label: 'specifying format', tip: 'Tell the model exactly how to structure the output — bullets, paragraphs, length, sections.' },
  constraints: { label: 'adding constraints', tip: 'Length limits, tone rules, words to avoid. Constraints sharpen output.' },
  examples: { label: 'including examples', tip: 'One example of what good looks like beats five adjectives every time.' },
  action: { label: 'a clearer action verb', tip: 'Replace fuzzy verbs with explicit ones — "rewrite", "summarize", "list".' },
  specificity: { label: 'more specificity', tip: 'Replace vague nouns and adjectives with concrete details and numbers.' },
}

function scoreColor(score: number): string {
  if (score < 30) return '#C25E5E'
  if (score < 60) return '#C99550'
  return '#7FA875'
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
        <p className="py-8 font-serif display-italic text-xl md:text-2xl" style={{ color: 'var(--color-paper-mute)' }}>
          We couldn&rsquo;t load your insights right now. Try again in a moment.
        </p>
        <div className="rule-strong" />
      </section>
    )
  }

  const noData = data.week.promptsCount === 0 && data.month.promptsCount === 0
  if (noData) return <EmptyState />
  if (data.week.promptsCount < 3) return <BuildingState count={data.week.promptsCount} />

  const wowDelta = data.week.avgAfter - data.prevWeek.avgAfter
  const trendArrow = wowDelta > 0 ? '↑' : wowDelta < 0 ? '↓' : '→'

  const topTag = data.topTags[0]
  const tagInfo = topTag ? TAG_LABELS[topTag.tag] : null

  return (
    <div className="space-y-12">
      {/* Headline pull-quote */}
      <section className="grid md:grid-cols-12 gap-6 md:gap-12">
        <div className="md:col-span-3">
          <p className="eyebrow">Your week</p>
        </div>
        <div className="md:col-span-9">
          <p
            className="font-serif display-italic text-2xl md:text-[2.4rem] leading-tight"
            style={{ color: 'var(--color-paper)' }}
          >
            You analyzed <span style={{ color: 'var(--color-paper)' }}>{data.week.promptsCount}</span> {plural('prompt', data.week.promptsCount)}.
            Average score moved from{' '}
            <span style={{ color: scoreColor(data.week.avgBefore) }}>{data.week.avgBefore}</span>
            {' to '}
            <span style={{ color: scoreColor(data.week.avgAfter) }}>{data.week.avgAfter}</span>.
          </p>
          {data.prevWeek.promptsCount > 0 && (
            <p className="mt-4 text-base" style={{ color: 'var(--color-paper-mute)' }}>
              <span style={{ color: wowDelta > 0 ? '#7FA875' : wowDelta < 0 ? '#C25E5E' : 'var(--color-paper-mute)' }}>
                {trendArrow} {Math.abs(wowDelta)} {plural('point', Math.abs(wowDelta))}
              </span>{' '}
              vs. last week ({data.prevWeek.avgAfter} avg).
            </p>
          )}
        </div>
      </section>

      {/* Streak — restrained, no fire emoji */}
      {data.streak > 0 && (
        <section>
          <div className="rule-strong" />
          <div className="grid grid-cols-12 gap-3 md:gap-6 py-6 items-baseline">
            <div className="col-span-5 md:col-span-3">
              <p className="eyebrow">Streak</p>
            </div>
            <div className="col-span-7 md:col-span-9">
              <p className="text-base md:text-lg" style={{ color: 'var(--color-paper)' }}>
                <span className="font-serif text-2xl md:text-3xl tabular-nums mr-2" style={{ fontWeight: 400 }}>
                  {data.streak}
                </span>
                {data.streak === 1 ? 'day' : 'days'} in a row.{' '}
                <span style={{ color: 'var(--color-paper-mute)' }}>
                  {data.streak >= 7
                    ? 'You have improved a prompt every day this week.'
                    : `Run one today to make it ${data.streak + 1}.`}
                </span>
              </p>
            </div>
          </div>
          <div className="rule" />
        </section>
      )}

      {/* Takeaway */}
      {tagInfo && topTag && (
        <section className="grid md:grid-cols-12 gap-6 md:gap-12">
          <div className="md:col-span-3">
            <p className="eyebrow" style={{ color: 'var(--color-accent)' }}>This week&rsquo;s takeaway</p>
          </div>
          <div className="md:col-span-9">
            <p className="text-base md:text-lg leading-[1.55] mb-3" style={{ color: 'var(--color-paper)' }}>
              Your prompts most often needed{' '}
              <span className="font-serif" style={{ fontStyle: 'italic' }}>
                {tagInfo.label}
              </span>
              .
            </p>
            <p className="text-sm md:text-base mb-6" style={{ color: 'var(--color-paper-mute)' }}>
              Out of {data.week.promptsCount} {plural('prompt', data.week.promptsCount)}, this fix came up{' '}
              <span style={{ color: 'var(--color-paper)' }}>{topTag.count} {plural('time', topTag.count)}</span>.
            </p>
            <div className="pl-5" style={{ borderLeft: '1px solid var(--color-rule-strong)' }}>
              <p className="font-serif text-base md:text-lg leading-[1.55]" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
                {tagInfo.tip}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Daily activity */}
      <section>
        <div className="rule-strong" />
        <div className="py-7">
          <div className="flex items-baseline justify-between mb-5">
            <p className="eyebrow">Daily activity</p>
            <p className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>
              Last 14 days &middot; taller bar = more prompts
            </p>
          </div>
          <DailyBars data={data.dailyActivity} />
        </div>
        <div className="rule-strong" />
      </section>

      {/* What we added most */}
      {data.topTags.length > 0 && (
        <section className="grid md:grid-cols-12 gap-6 md:gap-12">
          <div className="md:col-span-3">
            <p className="eyebrow">What we added most</p>
            <p className="text-xs mt-2" style={{ color: 'var(--color-paper-mute)' }}>
              The categories of fixes you&rsquo;d benefit from doing yourself first.
            </p>
          </div>
          <div className="md:col-span-9 space-y-4">
            {data.topTags.map((t, i) => {
              const max = data.topTags[0].count
              const pct = Math.max(8, Math.round((t.count / max) * 100))
              const info = TAG_LABELS[t.tag]
              return (
                <div key={t.tag} className="flex items-center gap-4">
                  <span className="text-sm md:text-base shrink-0 w-44 capitalize" style={{ color: 'var(--color-paper)' }}>
                    {info?.label ?? t.tag.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--color-rule-strong)' }}>
                    <div
                      className="h-px"
                      style={{
                        width: `${pct}%`,
                        background: i === 0 ? 'var(--color-paper)' : 'var(--color-paper-mute)',
                      }}
                    />
                  </div>
                  <span className="font-serif text-base tabular-nums w-10 text-right" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
                    {t.count}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Highlights */}
      {(data.bestThisWeek || data.biggestLift) && (
        <section className="grid md:grid-cols-12 gap-y-10 md:gap-x-12">
          {data.bestThisWeek && (
            <div className="md:col-span-6">
              <Highlight
                label="Top score this week"
                color="#7FA875"
                primary={data.bestThisWeek.after}
                secondary={`from ${data.bestThisWeek.before}`}
                prompt={data.bestThisWeek.prompt}
              />
            </div>
          )}
          {data.biggestLift && (
            <div className="md:col-span-6">
              <Highlight
                label="Biggest lift"
                color="var(--color-accent)"
                primary={`+${data.biggestLift.delta}`}
                secondary={`${data.biggestLift.before} → ${data.biggestLift.after}`}
                prompt={data.biggestLift.prompt}
              />
            </div>
          )}
        </section>
      )}

      {/* Practice nudge */}
      <section className="grid md:grid-cols-12 gap-6 md:gap-12 pt-6" style={{ borderTop: '1px solid var(--color-rule-strong)' }}>
        <div className="md:col-span-3">
          <p className="eyebrow">Try this week</p>
        </div>
        <div className="md:col-span-9">
          <p
            className="font-serif display-italic text-xl md:text-2xl leading-tight mb-4"
            style={{ color: 'var(--color-paper)' }}
          >
            Take a prompt you used this week and rewrite it before pasting into Deepclario.
            {tagInfo && ` Focus on ${tagInfo.label}.`}
          </p>
          <p className="text-base leading-[1.55] mb-6" style={{ color: 'var(--color-paper-mute)' }}>
            The fastest way to internalize the pattern is to attempt the fix yourself, then compare.
          </p>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3"
            style={{
              background: 'var(--color-paper)',
              color: 'var(--color-ink)',
              fontWeight: 500,
            }}
          >
            Open the playground
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}

function Highlight({
  label,
  color,
  primary,
  secondary,
  prompt,
}: {
  label: string
  color: string
  primary: number | string
  secondary: string
  prompt: string
}) {
  return (
    <div>
      <p className="eyebrow mb-3" style={{ color }}>{label}</p>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-serif text-4xl md:text-5xl tabular-nums" style={{ color, fontWeight: 400 }}>{primary}</span>
        <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>{secondary}</span>
      </div>
      <p
        className="font-serif display-italic text-base md:text-lg leading-normal line-clamp-3"
        style={{ color: 'var(--color-paper-mute)' }}
      >
        &ldquo;{prompt}&rdquo;
      </p>
    </div>
  )
}

function DailyBars({ data }: { data: { date: string; count: number; avgAfter: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map(d => {
        const h = d.count === 0 ? 4 : Math.max(8, Math.round((d.count / max) * 100))
        const day = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })[0]
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group relative">
            <div
              className="w-full transition-all"
              style={{
                height: `${h}%`,
                background: d.count === 0 ? 'var(--color-rule-strong)' : 'var(--color-paper)',
              }}
            />
            <span className="text-[10px]" style={{ color: 'var(--color-paper-mute)' }}>{day}</span>
            {d.count > 0 && (
              <div
                className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap z-10 px-2 py-1 text-[11px]"
                style={{
                  background: 'var(--color-ink-card)',
                  color: 'var(--color-paper)',
                  border: '1px solid var(--color-rule-strong)',
                }}
              >
                {d.count} {plural('prompt', d.count)} · avg {d.avgAfter}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EmptyState() {
  return (
    <section className="grid md:grid-cols-12 gap-6 md:gap-12 py-8">
      <div className="md:col-span-4">
        <p className="eyebrow">Empty</p>
      </div>
      <div className="md:col-span-8">
        <p className="font-serif display-italic text-2xl md:text-3xl leading-tight mb-6" style={{ color: 'var(--color-paper)' }}>
          Insights start once you have run a few prompts.
        </p>
        <p className="text-base md:text-lg leading-[1.6] mb-8 max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
          Analyze a few prompts and Deepclario will start spotting patterns &mdash; what you skip most often, which fixes lift your scores fastest, and how you trend week over week.
        </p>
        <Link
          href="/playground"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3"
          style={{
            background: 'var(--color-paper)',
            color: 'var(--color-ink)',
            fontWeight: 500,
          }}
        >
          Analyze your first prompt
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  )
}

function BuildingState({ count }: { count: number }) {
  const remaining = 3 - count
  return (
    <section className="grid md:grid-cols-12 gap-6 md:gap-12 py-8">
      <div className="md:col-span-4">
        <p className="eyebrow">Warming up</p>
      </div>
      <div className="md:col-span-8">
        <p className="font-serif display-italic text-2xl md:text-3xl leading-tight mb-6" style={{ color: 'var(--color-paper)' }}>
          Insights are warming up.
        </p>
        <p className="text-base md:text-lg leading-[1.6] mb-8 max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
          You&rsquo;ve analyzed {count} {plural('prompt', count)} this week. Run{' '}
          <span style={{ color: 'var(--color-paper)' }}>{remaining} more</span>{' '}
          and we&rsquo;ll start showing your patterns and weekly takeaways.
        </p>
        <Link
          href="/playground"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3"
          style={{
            background: 'var(--color-paper)',
            color: 'var(--color-ink)',
            fontWeight: 500,
          }}
        >
          Analyze another prompt
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  )
}

function plural(word: string, n: number) {
  return n === 1 ? word : `${word}s`
}
