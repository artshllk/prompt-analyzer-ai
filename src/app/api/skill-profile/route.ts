import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { avgScores, countTags, onlyScored, weeklyTrend } from '@/lib/insights/aggregate'

/**
 * Skill Profile (MVP). Computed live from prompt_sessions - no persisted
 * table, no cron. Validates the "seeing improvement over time" hypothesis
 * before any coaching/practice layer is built.
 *
 * Unlike /api/insights/weekly, this is NOT hard-gated: free users get the
 * snapshot metrics plus a short trend window (the teaser + upgrade hook);
 * Pro users get the full trend.
 */

// How many trailing weeks a free user sees before the trend locks.
const FREE_TREND_WEEKS = 4

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  const isPro = profile?.tier === 'pro'

  // Pull all completed sessions. For the MVP this is fine at current scale;
  // if a heavy user ever has thousands of rows this is the first thing to
  // move behind the persisted user_prompt_patterns rollup (Phase 2).
  const { data: sessions } = await supabase
    .from('prompt_sessions')
    .select('id, clarity_score_before, clarity_score_after, created_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  const completed = onlyScored(sessions ?? [])

  // Snapshot metrics (all-time). Same math as Insights - via shared helper.
  const { before, after, lift } = avgScores(completed)

  // Tag frequency -> the user's recurring gaps. A tag the rewrite keeps
  // ADDING is a skill the user keeps FORGETTING. Top 3, each with how many
  // prompts it appeared in, so the UI can show real evidence instead of a
  // single vague word.
  let gaps: { tag: string; count: number; pct: number }[] = []
  if (completed.length > 0) {
    const { data: improvements } = await supabase
      .from('prompt_improvements')
      .select('improvement_tags')
      .in('session_id', completed.map(s => s.id))
    const counts = countTags(improvements ?? [])
    gaps = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => ({
        tag,
        count,
        pct: Math.min(100, Math.round((count / completed.length) * 100)),
      }))
  }
  const topGapTag = gaps[0]?.tag ?? null

  // The trend - the whole point of the MVP. Full for Pro, last N weeks for
  // free, with a flag so the client knows to render the lock.
  const fullTrend = weeklyTrend(sessions ?? [])
  const trend = isPro ? fullTrend : fullTrend.slice(-FREE_TREND_WEEKS)
  const trendTruncated = !isPro && fullTrend.length > FREE_TREND_WEEKS

  return NextResponse.json({
    tier: isPro ? 'pro' : 'free',
    snapshot: {
      promptsImproved: completed.length,
      avgAfter: after,
      avgBefore: before,
      avgLift: lift,
      topGapTag,
    },
    gaps,
    trend,
    trendTruncated,
    weeksTracked: fullTrend.length,
  })
}
