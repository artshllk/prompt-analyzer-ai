import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DAY_MS = 24 * 60 * 60 * 1000

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  if (profile?.tier !== 'pro') {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 })
  }

  const now = new Date()
  const weekStart = new Date(now.getTime() - 7 * DAY_MS)
  const monthStart = new Date(now.getTime() - 30 * DAY_MS)
  const prevWeekStart = new Date(now.getTime() - 14 * DAY_MS)

  // Pull recent sessions (last 30 days) + linked improvements
  const { data: sessions } = await supabase
    .from('prompt_sessions')
    .select('id, original_prompt, clarity_score_before, clarity_score_after, clarify_turns, created_at, status, tone')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('created_at', monthStart.toISOString())
    .order('created_at', { ascending: false })

  const completed = (sessions ?? []).filter(
    s => s.clarity_score_after != null && s.clarity_score_before != null
  )

  const week = completed.filter(s => new Date(s.created_at) >= weekStart)
  const prevWeek = completed.filter(s => {
    const d = new Date(s.created_at)
    return d >= prevWeekStart && d < weekStart
  })

  const weekScores = avgScores(week)
  const prevWeekScores = avgScores(prevWeek)
  const monthScores = avgScores(completed)

  // Improvement tags from linked rows
  const sessionIds = completed.map(s => s.id)
  let tagCounts: Record<string, number> = {}
  if (sessionIds.length > 0) {
    const { data: improvements } = await supabase
      .from('prompt_improvements')
      .select('improvement_tags, session_id')
      .in('session_id', sessionIds)
    tagCounts = countTags(improvements ?? [])
  }

  // Daily activity for streak + sparkline (last 14 days)
  const dailyActivity: { date: string; count: number; avgAfter: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d.getTime() + DAY_MS)
    const dayItems = completed.filter(s => {
      const t = new Date(s.created_at).getTime()
      return t >= d.getTime() && t < next.getTime()
    })
    dailyActivity.push({
      date: d.toISOString().slice(0, 10),
      count: dayItems.length,
      avgAfter: dayItems.length
        ? Math.round(dayItems.reduce((a, b) => a + (b.clarity_score_after ?? 0), 0) / dayItems.length)
        : 0,
    })
  }

  // Streak - consecutive days from today backwards with at least 1 prompt
  let streak = 0
  for (let i = dailyActivity.length - 1; i >= 0; i--) {
    if (dailyActivity[i].count > 0) streak++
    else break
  }

  // Best prompt this week (highest after score)
  const bestThisWeek = [...week].sort(
    (a, b) => (b.clarity_score_after ?? 0) - (a.clarity_score_after ?? 0)
  )[0] ?? null

  // Biggest improvement this week (largest delta)
  const biggestLift = [...week].sort((a, b) => {
    const da = (a.clarity_score_after ?? 0) - (a.clarity_score_before ?? 0)
    const db = (b.clarity_score_after ?? 0) - (b.clarity_score_before ?? 0)
    return db - da
  })[0] ?? null

  return NextResponse.json({
    week: {
      promptsCount: week.length,
      avgBefore: weekScores.before,
      avgAfter: weekScores.after,
      avgLift: weekScores.lift,
    },
    prevWeek: {
      promptsCount: prevWeek.length,
      avgAfter: prevWeekScores.after,
    },
    month: {
      promptsCount: completed.length,
      avgAfter: monthScores.after,
    },
    dailyActivity,
    streak,
    topTags: Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count })),
    bestThisWeek: bestThisWeek
      ? {
          id: bestThisWeek.id,
          prompt: bestThisWeek.original_prompt.slice(0, 140),
          before: bestThisWeek.clarity_score_before,
          after: bestThisWeek.clarity_score_after,
        }
      : null,
    biggestLift: biggestLift
      ? {
          id: biggestLift.id,
          prompt: biggestLift.original_prompt.slice(0, 140),
          before: biggestLift.clarity_score_before,
          after: biggestLift.clarity_score_after,
          delta: (biggestLift.clarity_score_after ?? 0) - (biggestLift.clarity_score_before ?? 0),
        }
      : null,
  })
}

type CompletedSession = {
  clarity_score_before: number | null
  clarity_score_after: number | null
}

function avgScores(items: CompletedSession[]) {
  if (!items.length) return { before: 0, after: 0, lift: 0 }
  const before = Math.round(items.reduce((a, b) => a + (b.clarity_score_before ?? 0), 0) / items.length)
  const after = Math.round(items.reduce((a, b) => a + (b.clarity_score_after ?? 0), 0) / items.length)
  return { before, after, lift: after - before }
}

function countTags(rows: { improvement_tags: string[] | null }[]) {
  const counts: Record<string, number> = {}
  rows.forEach(r => {
    ;(r.improvement_tags ?? []).forEach(tag => {
      counts[tag] = (counts[tag] ?? 0) + 1
    })
  })
  return counts
}
