import { createClient } from '@/lib/supabase/server'
import type { UsageInfo } from '@/types'
import {
  USAGE_DAILY_LIMIT,
  USAGE_WINDOW_HOURS,
  DETECT_FREE_LIMIT,
  DETECT_WINDOW_HOURS,
  PRO_DEEP_LIMIT,
  PRO_DEEP_WINDOW_HOURS,
  PRO_VERIFY_LIMIT,
  PRO_VERIFY_WINDOW_HOURS,
  FREE_VERIFY_LIFETIME_CREDITS,
  windowStart,
} from '@/lib/limits'

const REWRITE_EVENT = 'prompt_analyzed'
const DETECT_EVENT = 'text_detected'
const DEEP_EVENT = 'deep_rewrite'
const VERIFY_EVENT = 'verify_run'

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

/**
 * Improvements: USAGE_DAILY_LIMIT per rolling 24h for free, unlimited for pro.
 *
 * This read the deprecated REWRITE_FREE_LIMIT/REWRITE_WINDOW_HOURS (5 per 48h),
 * which no longer gates anything. The gate that actually runs is decideUsage()
 * on the sharpen route, at 10 per 24h. Both count the same `prompt_analyzed`
 * event, so the dashboard was counting the right rows against the wrong
 * ceiling: a free user with six improvements saw "6 of 5" on a 48-hour window
 * they were not on, while the extension happily kept going.
 */
export function getUsageInfo(userId: string): Promise<UsageInfo> {
  return getUsage(userId, REWRITE_EVENT, USAGE_WINDOW_HOURS, USAGE_DAILY_LIMIT)
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

/** Count a user's events of one type since `sinceIso` (omit for lifetime). */
async function countEvents(userId: string, eventType: string, sinceIso?: string): Promise<number> {
  const supabase = await createClient()
  let query = supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', eventType)
  if (sinceIso) query = query.gte('created_at', sinceIso)
  const { count } = await query
  return count ?? 0
}

/**
 * Deep Rewrite fair-use meter (Pro only - free users never reach it).
 * The critic pass runs on the expensive model, so it's capped per
 * rolling 30 days rather than unlimited.
 */
export async function isAtDeepLimit(userId: string): Promise<boolean> {
  const used = await countEvents(userId, DEEP_EVENT, windowStart(PRO_DEEP_WINDOW_HOURS))
  return used >= PRO_DEEP_LIMIT
}

export function recordDeepUsage(userId: string): Promise<void> {
  return record(userId, DEEP_EVENT)
}

/**
 * Verification-run allowance: Pro gets PRO_VERIFY_LIMIT per rolling 30
 * days; free users get a small lifetime credit so they experience the
 * before/after proof at least once.
 */
export async function getVerifyAllowance(
  userId: string,
  tier: string
): Promise<{ used: number; limit: number; isAtLimit: boolean }> {
  const isPro = tier === 'pro'
  const used = await countEvents(
    userId,
    VERIFY_EVENT,
    isPro ? windowStart(PRO_VERIFY_WINDOW_HOURS) : undefined
  )
  const limit = isPro ? PRO_VERIFY_LIMIT : FREE_VERIFY_LIFETIME_CREDITS
  return { used, limit, isAtLimit: used >= limit }
}

export function recordVerifyUsage(userId: string): Promise<void> {
  return record(userId, VERIFY_EVENT)
}
