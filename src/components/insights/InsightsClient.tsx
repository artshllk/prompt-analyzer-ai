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
  context: {
    label: 'Adding context',
    tip: 'Try giving the AI background up front — who the audience is, what came before, why it matters.',
  },
  role: {
    label: 'Assigning a role',
    tip: 'Start with "Act as a..." to anchor the response in a specific perspective.',
  },
  format: {
    label: 'Specifying format',
    tip: 'Tell the AI exactly how to structure the output — bullet list, paragraphs, length, sections.',
  },
  constraints: {
    label: 'Adding constraints',
    tip: 'Set length limits, tone rules, or words to avoid. Constraints sharpen output.',
  },
  examples: {
    label: 'Including examples',
    tip: 'One example of what good looks like beats five adjectives every time.',
  },
  action: {
    label: 'Clearer action verb',
    tip: 'Replace fuzzy verbs ("help me with", "do something") with explicit ones ("rewrite", "summarize", "list").',
  },
  specificity: {
    label: 'More specificity',
    tip: 'Replace vague nouns and adjectives with concrete details and numbers.',
  },
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
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass rounded-2xl p-5 border border-[#1e2d4a] h-24 shimmer" />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="glass rounded-2xl p-10 text-center border border-[#1e2d4a]">
        <p className="text-[#8b9cc8] text-sm">We couldn&apos;t load your insights right now. Try again in a moment.</p>
      </div>
    )
  }

  const noData = data.week.promptsCount === 0 && data.month.promptsCount === 0
  if (noData) return <EmptyState />

  if (data.week.promptsCount < 3) return <BuildingState count={data.week.promptsCount} />

  // Week-over-week direction
  const wowDelta = data.week.avgAfter - data.prevWeek.avgAfter
  const trendIcon = wowDelta > 0 ? '↑' : wowDelta < 0 ? '↓' : '→'
  const trendColor = wowDelta > 0 ? 'text-emerald-400' : wowDelta < 0 ? 'text-rose-400' : 'text-[#8b9cc8]'

  // Biggest takeaway — pick the most-applied tag and turn it into a coaching note
  const topTag = data.topTags[0]
  const tagInfo = topTag ? TAG_LABELS[topTag.tag] : null

  return (
    <div className="space-y-6">
      {/* HEADLINE */}
      <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-600/12 via-violet-500/5 to-cyan-500/5 p-6">
        <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">Your week in prompts</p>
        <h2 className="text-2xl md:text-3xl font-bold text-[#f0f4ff] leading-tight">
          You analyzed <span className="text-violet-400">{data.week.promptsCount}</span> {plural('prompt', data.week.promptsCount)} this week.
          Your average score went from{' '}
          <span className="text-rose-300">{data.week.avgBefore}</span>
          {' → '}
          <span className="text-emerald-300">{data.week.avgAfter}</span>.
        </h2>
        {data.prevWeek.promptsCount > 0 && (
          <p className="text-sm text-[#8b9cc8] mt-3">
            <span className={trendColor}>{trendIcon} {Math.abs(wowDelta)} {plural('point', Math.abs(wowDelta))}</span>
            {' '}vs. last week ({data.prevWeek.avgAfter} avg)
          </p>
        )}
      </div>

      {/* STREAK */}
      {data.streak > 0 && (
        <div className="glass rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5 flex items-center gap-4">
          <div className="text-3xl">🔥</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#f0f4ff]">
              {data.streak}-day streak
            </p>
            <p className="text-xs text-[#8b9cc8] mt-0.5">
              {data.streak >= 7
                ? "You've improved a prompt every day this week. Keep it going."
                : `Improve a prompt today to make it ${data.streak + 1} days.`}
            </p>
          </div>
        </div>
      )}

      {/* THIS WEEK'S TAKEAWAY */}
      {tagInfo && (
        <div className="glass rounded-2xl p-6 border border-[#1e2d4a]">
          <p className="text-xs font-semibold text-[#4a5a80] uppercase tracking-wider mb-3">This week&apos;s takeaway</p>
          <h3 className="text-lg font-bold text-[#f0f4ff] mb-2">
            Your prompts most often needed: <span className="text-violet-400">{tagInfo.label.toLowerCase()}</span>
          </h3>
          <p className="text-sm text-[#8b9cc8] leading-relaxed mb-3">
            Out of {data.week.promptsCount} {plural('prompt', data.week.promptsCount)}, this fix came up{' '}
            <strong className="text-[#f0f4ff]">{topTag.count} {plural('time', topTag.count)}</strong>.
          </p>
          <div className="border-l-2 border-violet-500/40 pl-4 py-1">
            <p className="text-sm text-[#cdd5ee] leading-relaxed">{tagInfo.tip}</p>
          </div>
        </div>
      )}

      {/* DAILY ACTIVITY */}
      <div className="glass rounded-2xl p-5 border border-[#1e2d4a]">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-[#4a5a80] uppercase tracking-wider">Daily activity</p>
            <p className="text-xs text-[#8b9cc8] mt-1">Last 14 days · taller bar = more prompts</p>
          </div>
        </div>
        <DailyBars data={data.dailyActivity} />
      </div>

      {/* WHAT YOU FIXED MOST */}
      {data.topTags.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-[#1e2d4a]">
          <p className="text-xs font-semibold text-[#4a5a80] uppercase tracking-wider mb-1">What Deepclario added most often</p>
          <p className="text-xs text-[#8b9cc8] mb-4">
            These are the categories of fixes you&apos;d benefit from doing yourself first.
          </p>
          <div className="space-y-3">
            {data.topTags.map((t, i) => {
              const max = data.topTags[0].count
              const pct = Math.max(8, Math.round((t.count / max) * 100))
              const info = TAG_LABELS[t.tag]
              return (
                <div key={t.tag} className="flex items-center gap-3">
                  <span className="text-sm text-[#cdd5ee] w-44 shrink-0">
                    {info?.label ?? t.tag.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-[#1e2d4a] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${i === 0 ? 'bg-violet-500' : 'bg-violet-500/40'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#8b9cc8] w-8 text-right">{t.count}×</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* HIGHLIGHT CARDS */}
      <div className="grid md:grid-cols-2 gap-4">
        {data.bestThisWeek && (
          <HighlightCard
            label="Top score this week"
            color="emerald"
            score={data.bestThisWeek.after}
            scoreLabel={`from ${data.bestThisWeek.before}`}
            prompt={data.bestThisWeek.prompt}
          />
        )}
        {data.biggestLift && (
          <HighlightCard
            label="Biggest improvement"
            color="violet"
            score={`+${data.biggestLift.delta}`}
            scoreLabel={`${data.biggestLift.before} → ${data.biggestLift.after}`}
            prompt={data.biggestLift.prompt}
          />
        )}
      </div>

      {/* PRACTICE NUDGE */}
      <div className="glass rounded-2xl p-6 border border-[#1e2d4a] text-center">
        <p className="text-xs font-semibold text-[#4a5a80] uppercase tracking-wider mb-2">Try this week</p>
        <p className="text-[#f0f4ff] font-medium mb-3">
          Take a prompt you used this week and rewrite it before pasting into Deepclario.
          {tagInfo && ` Focus on ${tagInfo.label.toLowerCase()}.`}
        </p>
        <p className="text-sm text-[#8b9cc8] mb-5 max-w-md mx-auto">
          The fastest way to internalize the pattern is to attempt the fix yourself, then compare.
        </p>
        <Link
          href="/playground"
          className="inline-block px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all glow-violet"
        >
          Open the playground →
        </Link>
      </div>
    </div>
  )
}

function HighlightCard({
  label,
  color,
  score,
  scoreLabel,
  prompt,
}: {
  label: string
  color: 'emerald' | 'violet'
  score: number | string
  scoreLabel: string
  prompt: string
}) {
  const colorClass =
    color === 'emerald'
      ? 'border-emerald-500/25 bg-emerald-500/5 text-emerald-300'
      : 'border-violet-500/25 bg-violet-500/5 text-violet-300'
  return (
    <div className={`rounded-2xl border ${colorClass.split(' ').slice(0, 2).join(' ')} p-5`}>
      <p className="text-xs font-semibold text-[#4a5a80] uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-3xl font-bold ${colorClass.split(' ')[2]}`}>{score}</span>
        <span className="text-xs text-[#8b9cc8]">{scoreLabel}</span>
      </div>
      <p className="text-sm text-[#cdd5ee] italic leading-relaxed line-clamp-3">
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
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
            <div
              className={`w-full rounded-md transition-all ${
                d.count === 0 ? 'bg-[#1e2d4a]' : 'bg-violet-500/70 group-hover:bg-violet-400'
              }`}
              style={{ height: `${h}%` }}
            />
            <span className="text-[10px] text-[#4a5a80]">{day}</span>
            {d.count > 0 && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0f1628] border border-[#2d4070] rounded-lg px-2 py-1 text-[11px] text-[#cdd5ee] whitespace-nowrap z-10">
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
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/8 to-cyan-500/4 p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mx-auto mb-5">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 17V13M11 17V8M19 17V4" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 className="text-lg font-bold text-[#f0f4ff] mb-2">Your insights start here</h3>
      <p className="text-sm text-[#8b9cc8] max-w-md mx-auto mb-5">
        Analyze a few prompts and Deepclario will start spotting patterns — what you skip most often,
        which fixes lift your scores the fastest, and how you&apos;re trending week over week.
      </p>
      <Link
        href="/playground"
        className="inline-block px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all glow-violet"
      >
        Analyze your first prompt →
      </Link>
    </div>
  )
}

function BuildingState({ count }: { count: number }) {
  const remaining = 3 - count
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/8 to-cyan-500/4 p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mx-auto mb-4">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="#a78bfa" strokeWidth="1.6" />
          <path d="M10 6V10L13 12" stroke="#a78bfa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3 className="text-lg font-bold text-[#f0f4ff] mb-2">Insights are warming up</h3>
      <p className="text-sm text-[#8b9cc8] max-w-md mx-auto mb-5">
        You&apos;ve analyzed {count} {plural('prompt', count)} this week. Run{' '}
        <strong className="text-[#f0f4ff]">{remaining} more</strong>{' '}
        and we&apos;ll start showing your patterns and weekly takeaways.
      </p>
      <Link
        href="/playground"
        className="inline-block px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all glow-violet"
      >
        Analyze another prompt →
      </Link>
    </div>
  )
}

function plural(word: string, n: number) {
  return n === 1 ? word : `${word}s`
}
