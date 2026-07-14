import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Insights: what YOU keep getting wrong.
 *
 * The old version reported score deltas ("your average clarity rose 4
 * points"). Two problems with that. It was vanity - a number about the tool,
 * not about the user - and it was about to break entirely: it required both
 * clarity scores to be non-null, but extension sessions land with null scores
 * by design (the fast path does not score; that is what keeps it under a
 * second). Now that the extension is the only thing writing history, the old
 * route would have silently shown almost nothing.
 *
 * So it now reports the thing the engine actually knows and the user can act
 * on: the gaps. "You leave out who it is for in 7 of 10 prompts" is a lesson.
 * "Your average score is 78" is trivia.
 *
 * Free for everyone. Charging people to learn from their own mistakes would
 * be a strange thing to do.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const now = new Date()
  const monthStart = new Date(now.getTime() - 30 * DAY_MS)
  const weekStart = new Date(now.getTime() - 7 * DAY_MS)

  const { data: sessions } = await supabase
    .from('prompt_sessions')
    .select('id, original_prompt, final_prompt, clarity_score_before, clarify_turns, created_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('created_at', monthStart.toISOString())
    .order('created_at', { ascending: false })

  const all = sessions ?? []
  const week = all.filter(s => new Date(s.created_at) >= weekStart)

  // The gaps the diagnosis found, stored on the improvement row when the user
  // opened the why? panel. This is the raw material for every real insight.
  const ids = all.map(s => s.id)
  const gapCounts: Record<string, number> = {}
  let diagnosed = 0

  if (ids.length > 0) {
    const { data: improvements } = await supabase
      .from('prompt_improvements')
      .select('session_id, analysis')
      .in('session_id', ids)

    for (const row of improvements ?? []) {
      const analysis = row.analysis as { gaps?: Array<{ label?: string }> } | null
      const gaps = analysis?.gaps
      if (!Array.isArray(gaps) || gaps.length === 0) continue
      diagnosed += 1
      for (const g of gaps) {
        const label = (g?.label ?? '').trim()
        if (label) gapCounts[label] = (gapCounts[label] ?? 0) + 1
      }
    }
  }

  // "You leave out X in 7 of 10 prompts" - a habit, stated plainly.
  const habits = Object.entries(gapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({
      label,
      count,
      outOf: diagnosed,
    }))

  // Activity for the sparkline / streak (last 14 days).
  const dailyActivity: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d.getTime() + DAY_MS)
    dailyActivity.push({
      date: d.toISOString().slice(0, 10),
      count: all.filter(s => {
        const t = new Date(s.created_at).getTime()
        return t >= d.getTime() && t < next.getTime()
      }).length,
    })
  }

  let streak = 0
  for (let i = dailyActivity.length - 1; i >= 0; i--) {
    if (dailyActivity[i].count > 0) streak++
    else break
  }

  // How often the prompt was ambiguous enough that we had to ask. A high rate
  // is itself the lesson: you are starting from a topic, not a request.
  const askedCount = all.filter(s => (s.clarify_turns ?? 0) > 0).length

  // Only sessions the user actually opened the panel on have a score.
  const scored = all.filter(s => s.clarity_score_before != null)
  const avgStartingScore = scored.length
    ? Math.round(
        scored.reduce((a, s) => a + (s.clarity_score_before ?? 0), 0) / scored.length
      )
    : null

  return NextResponse.json({
    week: { promptsCount: week.length },
    month: { promptsCount: all.length },
    dailyActivity,
    streak,
    /** The headline: the habits that keep costing them a good answer. */
    habits,
    /** How many prompts were vague enough to need a question first. */
    askedCount,
    askedRate: all.length ? Math.round((askedCount / all.length) * 100) : 0,
    /** Null until they have opened the why? panel at least once. */
    avgStartingScore,
  })
}
