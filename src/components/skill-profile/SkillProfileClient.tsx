'use client'

import { useEffect, useState } from 'react'
import { UpgradeButton } from '@/components/ui/UpgradeButton'

interface WeekBucket {
  weekStart: string
  avgBefore: number
  avgAfter: number
  count: number
}

interface SkillProfile {
  tier: 'free' | 'pro'
  snapshot: {
    promptsImproved: number
    avgAfter: number
    avgBefore: number
    avgLift: number
    topGapTag: string | null
  }
  trend: WeekBucket[]
  trendTruncated: boolean
  weeksTracked: number
}

// Human labels for the improvement tags, matching the voice used in
// InsightsClient's TAG_LABELS. Kept short - this is a snapshot, not coaching.
const TAG_LABEL: Record<string, string> = {
  context: 'adding context',
  role: 'assigning a role',
  action: 'a clearer ask',
  format: 'specifying format',
  constraints: 'adding constraints',
  examples: 'including examples',
  specificity: 'being more specific',
}

export function SkillProfileClient() {
  const [data, setData] = useState<SkillProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/skill-profile')
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 py-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="h-2 w-16 mb-3" style={{ background: 'var(--color-rule-strong)' }} />
              <div className="h-9 w-16" style={{ background: 'var(--color-rule-strong)' }} />
            </div>
          ))}
        </div>
        <div className="rule" />
        <div className="h-48 mt-8" style={{ background: 'var(--color-rule)', borderRadius: 12 }} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <section className="py-12">
        <div className="rule-strong" />
        <p className="py-8 font-serif tracking-tight text-xl md:text-2xl" style={{ color: 'var(--color-paper-mute)' }}>
          We couldn&rsquo;t load your profile right now. Try again in a moment.
        </p>
        <div className="rule-strong" />
      </section>
    )
  }

  // Empty state - a brand-new user with no completed sessions yet.
  if (data.snapshot.promptsImproved === 0) {
    return (
      <section className="py-10">
        <div className="rule-strong" />
        <div className="py-14 max-w-xl">
          <p className="font-serif text-2xl md:text-[2rem] leading-tight tracking-tight mb-4" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Nothing to show yet.
          </p>
          <p className="text-base md:text-lg leading-[1.6] mb-8" style={{ color: 'var(--color-paper-mute)' }}>
            Improve a few prompts in the playground and your fluency starts taking shape here - your average clarity lift, and how it grows week over week.
          </p>
          <a
            href="/playground"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
            style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
          >
            Improve a prompt
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
        <div className="rule-strong" />
      </section>
    )
  }

  const { snapshot } = data
  const gapLabel = snapshot.topGapTag ? (TAG_LABEL[snapshot.topGapTag] ?? snapshot.topGapTag) : null

  return (
    <section className="space-y-12">
      {/* Snapshot metrics - 4 tiles, all-time */}
      <div>
        <div className="rule-strong" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 py-8">
          <Metric label="Prompts improved" value={String(snapshot.promptsImproved)} sub="all time" />
          <Metric label="Average lift" value={`+${snapshot.avgLift}`} sub="clarity per prompt" accent />
          <Metric label="Clarity now" value={String(snapshot.avgAfter)} sub="average after score" />
          <Metric
            label="Biggest gap"
            value={gapLabel ? gapLabel.split(' ')[0] : '—'}
            sub={gapLabel ? `you often need help ${gapLabel}` : 'not enough data'}
            small
          />
        </div>
        <div className="rule-strong" />
      </div>

      {/* The trend - the point of the whole page */}
      <div>
        <div className="flex items-baseline justify-between mb-6">
          <p className="eyebrow">Clarity over time</p>
          <p className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>
            before → after, by week
          </p>
        </div>
        <TrendChart trend={data.trend} />
        {data.trendTruncated && <TrendLock weeksTracked={data.weeksTracked} />}
      </div>
    </section>
  )
}

function Metric({ label, value, sub, accent, small }: { label: string; value: string; sub: string; accent?: boolean; small?: boolean }) {
  return (
    <div>
      <p className="eyebrow mb-3">{label}</p>
      <p
        className={`font-serif tabular-nums ${small ? 'text-2xl md:text-3xl capitalize' : 'text-3xl md:text-4xl'}`}
        style={{ color: accent ? 'var(--color-accent)' : 'var(--color-paper)', fontWeight: 400 }}
      >
        {value}
      </p>
      <p className="text-xs mt-1.5" style={{ color: 'var(--color-paper-mute)' }}>{sub}</p>
    </div>
  )
}

/**
 * Two-line before/after trend. Inline SVG in the same spirit as the
 * ScoreTrend sparkline in history and the dailyActivity chart in Insights -
 * no charting dependency. Fixed 0-100 y-axis so the "gap between the lines
 * = your lift" reads honestly and doesn't rescale week to week.
 */
function TrendChart({ trend }: { trend: WeekBucket[] }) {
  if (trend.length < 2) {
    return (
      <p className="py-8 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
        One week of data so far. Come back after a few more sessions to see the trend line grow.
      </p>
    )
  }

  const W = 720
  const H = 200
  const padX = 8
  const padY = 16
  const n = trend.length
  const x = (i: number) => padX + (i / (n - 1)) * (W - padX * 2)
  const y = (v: number) => padY + (1 - v / 100) * (H - padY * 2)

  const line = (key: 'avgBefore' | 'avgAfter') =>
    trend.map((b, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(b[key]).toFixed(1)}`).join(' ')

  // Area between the two lines = the lift, shaded lightly.
  const areaPath =
    trend.map((b, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(b.avgAfter).toFixed(1)}`).join(' ') +
    ' ' +
    trend
      .map((b, i) => `L${x(n - 1 - i).toFixed(1)},${y(trend[n - 1 - i].avgBefore).toFixed(1)}`)
      .join(' ') +
    ' Z'

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="min-w-[520px]" role="img" aria-label="Clarity score before and after, by week">
        <path d={areaPath} fill="var(--color-accent)" opacity="0.10" />
        <path d={line('avgBefore')} fill="none" stroke="var(--color-paper-mute)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" />
        <path d={line('avgAfter')} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {trend.map((b, i) => (
          <circle key={b.weekStart} cx={x(i)} cy={y(b.avgAfter)} r="2.5" fill="var(--color-accent)" />
        ))}
      </svg>
      <div className="flex items-center gap-5 mt-4 text-xs" style={{ color: 'var(--color-paper-mute)' }}>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-4 h-0.5 rounded-full" style={{ background: 'var(--color-accent)' }} /> after
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-4 h-0 border-t border-dashed" style={{ borderColor: 'var(--color-paper-mute)' }} /> before
        </span>
        <span className="ml-auto tabular-nums">
          {trend[0].weekStart} → {trend[n - 1].weekStart}
        </span>
      </div>
    </div>
  )
}

function TrendLock({ weeksTracked }: { weeksTracked: number }) {
  return (
    <div className="mt-8 rounded-2xl p-6 md:p-7" style={{ border: '1px solid var(--color-rule-strong)', background: 'var(--color-ink-card)' }}>
      <p className="eyebrow mb-3" style={{ color: 'var(--color-accent)' }}>Pro</p>
      <p className="font-serif text-xl md:text-2xl leading-snug mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
        You have {weeksTracked} weeks of history. Pro shows all of it.
      </p>
      <p className="text-sm md:text-base leading-[1.6] max-w-xl mb-6" style={{ color: 'var(--color-paper-mute)' }}>
        The free profile shows your last few weeks. Go Pro to see your full trend - how far you have come since the day you started, not just recently.
      </p>
      <UpgradeButton
        plan="pro_monthly"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper cursor-pointer"
      >
        <span>Upgrade · <span className="line-through opacity-60">$9.99</span> $4.99/mo</span>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </UpgradeButton>
    </div>
  )
}
