import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Check pro tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  if (profile?.tier !== 'pro') {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 })
  }

  // Fetch the last 4 weeks of patterns
  const { data: patterns, error } = await supabase
    .from('user_prompt_patterns')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(4)

  if (error) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })
  }

  // Also fetch recent sessions for current (not-yet-aggregated) week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const { data: currentWeekSessions } = await supabase
    .from('prompt_sessions')
    .select('clarity_score_before, clarity_score_after, clarify_turns, created_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('created_at', weekStart.toISOString())

  const currentWeekStats = currentWeekSessions?.length
    ? {
        prompts_count: currentWeekSessions.length,
        avg_clarity_before: avg(currentWeekSessions.map(s => s.clarity_score_before ?? 0)),
        avg_clarity_after: avg(currentWeekSessions.map(s => s.clarity_score_after ?? 0)),
        avg_improvement: avg(
          currentWeekSessions.map(s =>
            s.clarity_score_after && s.clarity_score_before
              ? s.clarity_score_after - s.clarity_score_before
              : 0
          )
        ),
      }
    : null

  return NextResponse.json({ patterns, currentWeekStats })
}

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}
