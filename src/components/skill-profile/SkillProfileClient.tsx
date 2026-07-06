'use client'

import { useEffect, useState } from 'react'
import { UpgradeButton } from '@/components/ui/UpgradeButton'

interface WeekBucket {
  weekStart: string
  avgBefore: number
  avgAfter: number
  count: number
}

interface Gap {
  tag: string
  count: number
  pct: number
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
  gaps: Gap[]
  trend: WeekBucket[]
  trendTruncated: boolean
  weeksTracked: number
}

// Per-tag metadata: a display noun, what it means in the user's terms, a
// concrete fix (same voice as InsightsClient's TAG_LABELS), and a link to
// the existing guide that teaches it. No AI call - the meaningful data is
// the user's own tag history; this map just makes it legible.
const TAG_INFO: Record<string, { noun: string; meaning: string; tip: string; learnHref: string }> = {
  context: {
    noun: 'Context',
    meaning: 'Your prompts often leave out the background the AI needs.',
    tip: 'Give the model the situation up front: who the audience is, what came before, why it matters.',
    learnHref: '/blog/what-is-a-good-prompt#context',
  },
  role: {
    noun: 'Role',
    meaning: 'Your prompts rarely tell the AI who to be.',
    tip: 'Start with "Act as a..." to anchor the response in a specific perspective.',
    learnHref: '/blog/chatgpt-system-prompt-examples',
  },
  action: {
    noun: 'Clear ask',
    meaning: 'The task in your prompts is often fuzzy.',
    tip: 'Replace vague verbs with explicit ones: "rewrite", "summarize", "list".',
    learnHref: '/blog/what-is-a-good-prompt#goal-clarity',
  },
  format: {
    noun: 'Format',
    meaning: 'You often leave the output shape up to the model.',
    tip: 'Say exactly how you want the answer structured: bullets, length, sections.',
    learnHref: '/blog/what-is-a-good-prompt#format',
  },
  constraints: {
    noun: 'Constraints',
    meaning: 'Your prompts rarely say what to avoid or stay within.',
    tip: 'Length limits, tone rules, words to ban. Constraints focus the output.',
    learnHref: '/blog/what-is-a-good-prompt#constraints',
  },
  examples: {
    noun: 'Examples',
    meaning: 'You rarely show the model what good looks like.',
    tip: 'One example of the style you want beats five adjectives.',
    learnHref: '/blog/what-is-a-good-prompt#examples',
  },
  specificity: {
    noun: 'Specificity',
    meaning: 'Your prompts lean on vague nouns and adjectives.',
    tip: 'Swap generalities for concrete details and numbers.',
    learnHref: '/blog/how-to-write-better-prompts',
  },
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
  const topGap = data.gaps[0] ? TAG_INFO[data.gaps[0].tag] : null

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
            value={topGap ? topGap.noun : '—'}
            sub={
              data.gaps[0]
                ? `added for you in ${data.gaps[0].count} of ${snapshot.promptsImproved} prompt${snapshot.promptsImproved !== 1 ? 's' : ''}`
                : 'not enough data'
            }
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

      {/* Where to improve next - the user's real recurring gaps, with
          evidence and a concrete next step. */}
      {data.gaps.length > 0 && (
        <GapSection gaps={data.gaps} total={snapshot.promptsImproved} />
      )}
    </section>
  )
}

function GapSection({ gaps, total }: { gaps: Gap[]; total: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="eyebrow">Where to improve next</p>
        <p className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>
          what our rewrites keep adding for you
        </p>
      </div>
      <p className="text-sm leading-relaxed max-w-xl mb-8" style={{ color: 'var(--color-paper-mute)' }}>
        When Deepclario improves a prompt, it records what was missing. These are the things
        it adds for you most often - close these gaps yourself and your prompts get better
        before we ever touch them.
      </p>

      <div className="rule-strong" />
      {gaps.map((g, i) => {
        const info = TAG_INFO[g.tag]
        if (!info) return null
        return (
          <div key={g.tag}>
            <div className="grid md:grid-cols-12 gap-3 md:gap-8 py-6 items-start">
              {/* Rank + name */}
              <div className="md:col-span-3 flex items-baseline gap-3">
                <span className="font-serif text-xl tabular-nums" style={{ color: 'var(--color-paper-mute)', fontWeight: 400 }}>
                  {i + 1}
                </span>
                <span className="text-base" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>
                  {info.noun}
                </span>
              </div>

              {/* Evidence bar */}
              <div className="md:col-span-4">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-rule)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(4, g.pct)}%`,
                      background: i === 0 ? 'var(--color-accent)' : 'var(--color-paper-mute)',
                      opacity: i === 0 ? 1 : 0.6,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs tabular-nums" style={{ color: 'var(--color-paper-mute)' }}>
                  added in {g.count} of {total} prompt{total !== 1 ? 's' : ''} ({g.pct}%)
                </p>
              </div>

              {/* Meaning + fix + learn link */}
              <div className="md:col-span-5">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-paper)' }}>
                  {info.meaning}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
                  {info.tip}
                </p>
                <a
                  href={info.learnHref}
                  className="inline-block mt-2.5 text-xs underline underline-offset-4 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-paper)' }}
                >
                  Learn this skill →
                </a>
              </div>
            </div>
            <div className="rule" />
          </div>
        )
      })}
    </div>
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
  // With a single week there is nothing to draw a line between yet. Instead
  // of an empty chart, show this week's before -> after as two bars so the
  // user immediately sees their lift and understands what the trend will
  // become once they have more weeks.
  if (trend.length < 2) {
    const w = trend[0]
    const before = w?.avgBefore ?? 0
    const after = w?.avgAfter ?? 0
    const lift = after - before
    return (
      <div className="grid md:grid-cols-12 gap-8 items-end">
        {/* Two bars anchored to a shared baseline, with the lift bridging them. */}
        <div className="md:col-span-5">
          <div
            className="flex items-end justify-center gap-12 px-6 mb-10"
            style={{ height: 180, borderBottom: '1px solid var(--color-rule-strong)' }}
          >
            <SingleWeekBar label="Before" value={before} muted />
            <div className="flex flex-col items-center justify-center self-center">
              <span
                className="inline-flex items-center text-[11px] tracking-[0.08em] uppercase font-semibold px-2 py-0.5 rounded-full tabular-nums"
                style={{
                  background: 'var(--color-accent-soft)',
                  color: 'var(--color-accent-bright)',
                  border: '1px solid rgba(91, 143, 237, 0.25)',
                }}
              >
                +{lift}
              </span>
              <svg width="28" height="12" viewBox="0 0 28 12" fill="none" className="mt-1.5" aria-hidden>
                <path d="M2 10L26 2M26 2H18M26 2V10" stroke="var(--color-accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <SingleWeekBar label="After" value={after} />
          </div>
        </div>
        <div className="md:col-span-7">
          <p className="text-sm leading-relaxed max-w-md" style={{ color: 'var(--color-paper-mute)' }}>
            Your first week: prompts averaged{' '}
            <span style={{ color: 'var(--color-paper)' }}>{before}</span> clarity as you wrote them,{' '}
            <span style={{ color: 'var(--color-accent)' }}>{after}</span> after Deepclario improved them.
            Keep going and this becomes a week-by-week line you can watch climb.
          </p>
        </div>
      </div>
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
      <p className="mt-3 text-sm leading-relaxed max-w-lg" style={{ color: 'var(--color-paper-mute)' }}>
        The gap between the two lines is how much clearer your prompts got. When the{' '}
        <span style={{ color: 'var(--color-paper)' }}>before</span> line rises over time, it means you are
        writing stronger prompts on your own.
      </p>
    </div>
  )
}

function SingleWeekBar({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="relative flex flex-col items-center justify-end h-full" style={{ width: 48 }}>
      <span
        className="font-serif text-xl tabular-nums mb-2"
        style={{ color: muted ? 'var(--color-paper-mute)' : 'var(--color-accent-bright)', fontWeight: 400 }}
      >
        {value}
      </span>
      <div
        className="w-full rounded-t"
        style={{
          // Bars scale within ~70% of the container so a 100 score leaves
          // headroom for its number label. The bar bottom sits flush on the
          // container's baseline border.
          height: `${Math.max(4, value * 0.7)}%`,
          background: muted
            ? 'var(--color-rule-strong)'
            : 'linear-gradient(to top, rgba(91,143,237,0.55), var(--color-accent))',
        }}
      />
      {/* Label lives below the baseline, like an axis label */}
      <span
        className="absolute top-full mt-2.5 text-[11px] tracking-widest uppercase"
        style={{ color: 'var(--color-paper-mute)' }}
      >
        {label}
      </span>
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
