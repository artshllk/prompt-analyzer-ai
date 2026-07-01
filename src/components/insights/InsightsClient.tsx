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
  context: { label: 'context', tip: 'Give the model the background up front - who the audience is, what came before, why it matters.' },
  role: { label: 'a role', tip: 'Start with "Act as a..." to anchor the response in a specific perspective.' },
  format: { label: 'a format', tip: 'Tell the model exactly how to structure the output - bullets, paragraphs, length, sections.' },
  constraints: { label: 'constraints', tip: 'Length limits, tone rules, words to avoid. Constraints focus the output.' },
  examples: { label: 'examples', tip: 'One example of what good looks like beats five adjectives every time.' },
  action: { label: 'a clearer action verb', tip: 'Replace fuzzy verbs with explicit ones - "rewrite", "summarize", "list".' },
  specificity: { label: 'specificity', tip: 'Replace vague nouns and adjectives with concrete details and numbers.' },
}

function scoreColor(score: number): string {
  if (score < 30) return '#C25E5E'
  if (score < 60) return 'var(--color-paper-mute)'
  return 'var(--color-paper)'
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

  if (loading) return <LoadingState />

  if (error || !data) {
    return (
      <section className="py-4">
        <div className="card-editorial p-8">
          <p className="font-serif text-xl md:text-2xl" style={{ color: 'var(--color-paper-mute)', fontWeight: 400 }}>
            We couldn&rsquo;t load your insights right now. Try again in a moment.
          </p>
        </div>
      </section>
    )
  }

  const noData = data.week.promptsCount === 0 && data.month.promptsCount === 0
  if (noData) return <EmptyState />
  if (data.week.promptsCount < 3) return <BuildingState count={data.week.promptsCount} />

  const wowDelta = data.week.avgAfter - data.prevWeek.avgAfter
  const hasPrev = data.prevWeek.promptsCount > 0

  const topTag = data.topTags[0]
  const tagInfo = topTag ? TAG_LABELS[topTag.tag] : null

  return (
    <div className="space-y-8 md:space-y-10">
      {/* 1. Metric cards - the four KPIs, scannable in seconds. */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <MetricCard
          label="Prompts this week"
          value={String(data.week.promptsCount)}
          sub={`${data.month.promptsCount} this month`}
        />
        <MetricCard
          label="Avg score"
          value={String(data.week.avgAfter)}
          valueColor={scoreColor(data.week.avgAfter)}
          sub={`from ${data.week.avgBefore} before`}
          trend={hasPrev ? { delta: wowDelta, unit: 'pt' } : undefined}
        />
        <MetricCard
          label="Avg lift"
          value={`+${data.week.avgLift}`}
          valueColor="var(--color-accent-bright)"
          sub="per rewrite"
        />
        <MetricCard
          label="Streak"
          value={String(data.streak)}
          sub={data.streak === 1 ? 'day in a row' : 'days in a row'}
        />
      </section>

      {/* 2. Do this next - the single most valuable block. Accent border,
            weakness + tip + a direct CTA back into the playground. */}
      {tagInfo && topTag && (
        <section
          className="rounded-2xl p-6 md:p-8"
          style={{
            background: 'var(--color-ink-card)',
            border: '1px solid var(--color-rule-strong)',
            borderLeft: '3px solid var(--color-accent)',
          }}
        >
          <p className="eyebrow mb-3" style={{ color: 'var(--color-accent-bright)' }}>Do this next</p>
          <p className="font-serif text-xl md:text-2xl leading-[1.35] tracking-tight mb-2" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Your prompts most often skip{' '}
            <span style={{ fontStyle: 'italic' }}>{tagInfo.label}</span>
            {' '}&mdash; {topTag.count} {plural('time', topTag.count)} this week.
          </p>
          <p className="text-sm md:text-base leading-[1.6] mb-6 max-w-2xl" style={{ color: 'var(--color-paper-mute)' }}>
            {tagInfo.tip}
          </p>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all hover:gap-3 btn-paper"
            style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
          >
            Practice in the playground
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </section>
      )}

      {/* 3. Activity - quiet context, not a headline. */}
      <section className="rounded-2xl p-6 md:p-7" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
        <div className="flex items-baseline justify-between mb-5">
          <p className="eyebrow">Activity</p>
          <p className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>Last 14 days</p>
        </div>
        <DailyBars data={data.dailyActivity} />
      </section>

      {/* 4. Two-up: top fixes + highlights, compact. */}
      <section className="grid md:grid-cols-2 gap-4 md:gap-5">
        {data.topTags.length > 0 && (
          <div className="rounded-2xl p-6 md:p-7" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
            <p className="eyebrow mb-5">Top fixes</p>
            <div className="space-y-3.5">
              {data.topTags.slice(0, 5).map((t, i) => {
                const max = data.topTags[0].count
                const pct = Math.max(8, Math.round((t.count / max) * 100))
                const info = TAG_LABELS[t.tag]
                return (
                  <div key={t.tag} className="flex items-center gap-3">
                    <span className="text-sm shrink-0 w-32 capitalize truncate" style={{ color: 'var(--color-paper)' }}>
                      {info?.label ?? t.tag.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-rule-strong)' }}>
                      <div
                        className="h-1 rounded-full"
                        style={{ width: `${pct}%`, background: i === 0 ? 'var(--color-accent)' : 'var(--color-paper-mute)' }}
                      />
                    </div>
                    <span className="font-serif text-base tabular-nums w-8 text-right" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
                      {t.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(data.bestThisWeek || data.biggestLift) && (
          <div className="rounded-2xl p-6 md:p-7" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
            <p className="eyebrow mb-5">Highlights</p>
            <div className="space-y-6">
              {data.bestThisWeek && (
                <Highlight
                  label="Top score"
                  color="var(--color-paper)"
                  primary={data.bestThisWeek.after}
                  secondary={`from ${data.bestThisWeek.before}`}
                  prompt={data.bestThisWeek.prompt}
                />
              )}
              {data.biggestLift && (
                <Highlight
                  label="Biggest lift"
                  color="var(--color-accent-bright)"
                  primary={`+${data.biggestLift.delta}`}
                  secondary={`${data.biggestLift.before} → ${data.biggestLift.after}`}
                  prompt={data.biggestLift.prompt}
                />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

/* ===== Metric card ===== */

function MetricCard({
  label,
  value,
  valueColor = 'var(--color-paper)',
  sub,
  trend,
}: {
  label: string
  value: string
  valueColor?: string
  sub?: string
  trend?: { delta: number; unit: string }
}) {
  const up = trend && trend.delta > 0
  const down = trend && trend.delta < 0
  const arrow = up ? '↑' : down ? '↓' : '→'
  const trendColor = up ? '#5FBE8C' : down ? '#C25E5E' : 'var(--color-paper-mute)'
  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
      <p className="text-xs mb-3" style={{ color: 'var(--color-paper-mute)' }}>{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-4xl md:text-5xl tabular-nums leading-none" style={{ color: valueColor, fontWeight: 400 }}>
          {value}
        </span>
        {trend && (
          <span className="text-xs tabular-nums" style={{ color: trendColor }}>
            {arrow} {Math.abs(trend.delta)}{trend.unit}
          </span>
        )}
      </div>
      {sub && <p className="text-xs mt-2" style={{ color: 'var(--color-paper-mute)' }}>{sub}</p>}
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
      <div className="flex items-baseline gap-2.5 mb-2">
        <p className="eyebrow" style={{ color }}>{label}</p>
        <span className="font-serif text-2xl tabular-nums leading-none" style={{ color, fontWeight: 400 }}>{primary}</span>
        <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>{secondary}</span>
      </div>
      <p className="text-sm leading-[1.5] line-clamp-2" style={{ color: 'var(--color-paper-mute)' }}>
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
              className="w-full rounded-sm transition-all"
              style={{ height: `${h}%`, background: d.count === 0 ? 'var(--color-rule-strong)' : 'var(--color-paper)' }}
            />
            <span className="text-[10px]" style={{ color: 'var(--color-paper-mute)' }}>{day}</span>
            {d.count > 0 && (
              <div
                className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap z-10 px-2 py-1 text-[11px] rounded-md"
                style={{ background: 'var(--color-ink-card-elevated)', color: 'var(--color-paper)', border: '1px solid var(--color-rule-strong)' }}
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

/* ===== States ===== */

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl p-6 h-32" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
            <div className="h-2 w-16 mb-4 rounded" style={{ background: 'var(--color-rule-strong)' }} />
            <div className="h-8 w-12 rounded" style={{ background: 'var(--color-rule-strong)' }} />
          </div>
        ))}
      </div>
      <div className="rounded-2xl h-40" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl p-8 md:p-10" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
      <p className="font-serif text-2xl md:text-3xl leading-tight mb-4" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
        Insights start once you have run a few prompts.
      </p>
      <p className="text-base leading-[1.6] mb-7 max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
        Analyze a few prompts and Deepclario spots your patterns &mdash; what you skip most, which fixes lift scores fastest, and how you trend week over week.
      </p>
      <PlaygroundCta label="Analyze your first prompt" />
    </div>
  )
}

function BuildingState({ count }: { count: number }) {
  const remaining = 3 - count
  return (
    <div className="rounded-2xl p-8 md:p-10" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
      <p className="font-serif text-2xl md:text-3xl leading-tight mb-4" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
        Insights are warming up.
      </p>
      <p className="text-base leading-[1.6] mb-7 max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
        You&rsquo;ve analyzed {count} {plural('prompt', count)} this week. Run{' '}
        <span style={{ color: 'var(--color-paper)' }}>{remaining} more</span> and your patterns appear here.
      </p>
      <PlaygroundCta label="Analyze another prompt" />
    </div>
  )
}

function PlaygroundCta({ label }: { label: string }) {
  return (
    <Link
      href="/playground"
      className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
      style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
    >
      {label}
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}

function plural(word: string, n: number) {
  return n === 1 ? word : `${word}s`
}
