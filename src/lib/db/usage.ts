import { createClient } from '@/lib/supabase/server'
import type { UsageInfo } from '@/types'
import {
  REWRITE_FREE_LIMIT,
  REWRITE_WINDOW_HOURS,
  DETECT_FREE_LIMIT,
  DETECT_WINDOW_HOURS,
  windowStart,
} from '@/lib/limits'

const REWRITE_EVENT = 'prompt_analyzed'
const DETECT_EVENT = 'text_detected'

/**
 * Count a user's events of one type inside a rolling window, and read
 * their tier, in a single round-trip pair. Shared by both metered
 * features so the quota logic stays identical.
 */
async function getUsage(
  userId: string,
  eventType: string,
  windowHours: number,
  freeLimit: number,
): Promise<UsageInfo> {
  const supabase = await createClient()

  const [usageResult, profileResult] = await Promise.all([
    supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', eventType)
      .gte('created_at', windowStart(windowHours)),

    supabase
      .from('profiles')
      .select('tier')
      .eq('id', userId)
      .single(),
  ])

  const tier = profileResult.data?.tier ?? 'free'
  const used = usageResult.count ?? 0
  const limit = tier === 'pro' ? null : freeLimit

  return {
    used,
    limit,
    isAtLimit: limit !== null && used >= limit,
    tier,
  }
}

async function record(userId: string, eventType: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('usage_events').insert({ user_id: userId, event_type: eventType })
}

/** Rewrites: 5 per rolling 48h for free, unlimited for pro. */
export function getUsageInfo(userId: string): Promise<UsageInfo> {
  return getUsage(userId, REWRITE_EVENT, REWRITE_WINDOW_HOURS, REWRITE_FREE_LIMIT)
}

export function recordUsage(userId: string): Promise<void> {
  return record(userId, REWRITE_EVENT)
}

/** AI detection: 5 per rolling 24h for free, unlimited for pro. */
export function getDetectorUsage(userId: string): Promise<UsageInfo> {
  return getUsage(userId, DETECT_EVENT, DETECT_WINDOW_HOURS, DETECT_FREE_LIMIT)
}

export function recordDetectorUsage(userId: string): Promise<void> {
  return record(userId, DETECT_EVENT)
}
