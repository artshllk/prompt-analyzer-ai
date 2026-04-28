'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Pattern {
  week_start: string
  prompts_count: number
  avg_clarity_before: number | null
  avg_clarity_after: number | null
  avg_improvement: number | null
  common_mistakes: Record<string, number>
  top_improvement_tags: string[]
}

interface WeeklyData {
  patterns: Pattern[]
  currentWeekStats: {
    prompts_count: number
    avg_clarity_before: number
    avg_clarity_after: number
    avg_improvement: number
  } | null
}

export function InsightsClient() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/insights/weekly')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass rounded-2xl p-5 border border-[#1e2d4a] h-24 shimmer" />
        ))}
      </div>
    )
  }

  if (!data || (!data.patterns.length && !data.currentWeekStats)) {
    return (
      <div className="glass rounded-2xl p-10 text-center border border-[#1e2d4a]">
        <p className="text-[#8b9cc8] text-sm">Insights will appear after your first full week of usage.</p>
      </div>
    )
  }

  const chartData = [...(data.patterns ?? [])].reverse().map(p => ({
    week: new Date(p.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    before: p.avg_clarity_before ?? 0,
    after: p.avg_clarity_after ?? 0,
    count: p.prompts_count,
  }))

  // Aggregate top mistakes
  const allMistakes: Record<string, number> = {}
  data.patterns.forEach(p => {
    const mistakes = p.common_mistakes as Record<string, number>
    Object.entries(mistakes).forEach(([k, v]) => {
      allMistakes[k] = (allMistakes[k] ?? 0) + v
    })
  })
  const topMistakes = Object.entries(allMistakes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const current = data.currentWeekStats

  return (
    <div className="space-y-6">
      {/* This week stats */}
      {current && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'This week', value: current.prompts_count, sub: 'prompts analyzed' },
            { label: 'Avg score after', value: current.avg_clarity_after, sub: 'clarity points' },
            { label: 'Avg improvement', value: `+${current.avg_improvement}`, sub: 'per prompt' },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-2xl p-5 border border-[#1e2d4a]">
              <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-[#f0f4ff] mb-0.5">{stat.value}</p>
              <p className="text-xs text-[#4a5a80]">{stat.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Clarity score chart */}
      {chartData.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-[#1e2d4a]">
          <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-4">Clarity score over time</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis dataKey="week" stroke="#4a5a80" tick={{ fontSize: 11 }} />
              <YAxis stroke="#4a5a80" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#0f1628', border: '1px solid #1e2d4a', borderRadius: '12px', color: '#f0f4ff' }}
              />
              <Line type="monotone" dataKey="before" stroke="#4a5a80" strokeWidth={2} dot={false} name="Before" />
              <Line type="monotone" dataKey="after" stroke="#7c3aed" strokeWidth={2} dot={false} name="After" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#4a5a80]" />
              <span className="text-xs text-[#4a5a80]">Before</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-violet-500" />
              <span className="text-xs text-[#8b9cc8]">After</span>
            </div>
          </div>
        </div>
      )}

      {/* Top mistakes */}
      {topMistakes.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-[#1e2d4a]">
          <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-4">Your most common gaps</p>
          <div className="space-y-3">
            {topMistakes.map(([mistake, count]) => {
              const maxCount = topMistakes[0][1]
              const pct = Math.round((count / maxCount) * 100)
              return (
                <div key={mistake} className="flex items-center gap-3">
                  <span className="text-sm text-[#8b9cc8] capitalize w-40 shrink-0">
                    {mistake.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#1e2d4a] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#4a5a80] w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
