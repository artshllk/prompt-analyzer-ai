import { createClient } from '@/lib/supabase/server'
import type { UsageInfo } from '@/types'

const FREE_LIMIT = 25

export async function getUsageInfo(userId: string): Promise<UsageInfo> {
  const supabase = await createClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [usageResult, profileResult] = await Promise.all([
    supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', 'prompt_analyzed')
      .gte('created_at', startOfMonth.toISOString()),

    supabase
      .from('profiles')
      .select('tier')
      .eq('id', userId)
      .single(),
  ])

  const tier = profileResult.data?.tier ?? 'free'
  const used = usageResult.count ?? 0
  const limit = tier === 'pro' ? null : FREE_LIMIT

  return {
    used,
    limit,
    isAtLimit: limit !== null && used >= limit,
    tier,
  }
}

export async function recordUsage(userId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('usage_events').insert({ user_id: userId, event_type: 'prompt_analyzed' })
}
