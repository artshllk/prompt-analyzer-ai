import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { UsageInfo } from '@/types'
import {
  REWRITE_FREE_LIMIT,
  REWRITE_WINDOW_HOURS,
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

/**
 * Count a user's events of one type since `sinceIso` (omit for lifetime).
 *
 * `serviceRole` exists for callers authenticated by a `dc_` bearer token
 * rather than a cookie session - the browser extension, and anything else
 * hitting /api/anon/*. The default client is the anon key under RLS, which
 * reads the caller's cookies; a token-authed request has none, so the query
 * matches zero rows and returns 0. For a COUNT behind a quota gate, that
 * failure is silent and it fails OPEN: "you have used 0 of your 3 free runs"
 * forever. Pass true whenever the userId came from validateToken().
 */
async function countEvents(
  userId: string,
  eventType: string,
  sinceIso?: string,
  serviceRole = false
): Promise<number> {
  const supabase = serviceRole ? await createServiceClient() : await createClient()
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
  tier: string,
  /** True when the caller was authenticated by a bearer token, not a cookie.
   *  See countEvents: without this the count silently reads 0 and the gate
   *  never closes. */
  serviceRole = false
): Promise<{ used: number; limit: number; isAtLimit: boolean; remaining: number }> {
  const isPro = tier === 'pro'
  const used = await countEvents(
    userId,
    VERIFY_EVENT,
    isPro ? windowStart(PRO_VERIFY_WINDOW_HOURS) : undefined,
    serviceRole
  )
  const limit = isPro ? PRO_VERIFY_LIMIT : FREE_VERIFY_LIFETIME_CREDITS
  return { used, limit, isAtLimit: used >= limit, remaining: Math.max(0, limit - used) }
}

/** Same bearer-token caveat as getVerifyAllowance: a token-authed write under
 *  RLS is silently dropped, which would hand out unlimited free runs. */
export async function recordVerifyUsage(userId: string, serviceRole = false): Promise<void> {
  const supabase = serviceRole ? await createServiceClient() : await createClient()
  await supabase.from('usage_events').insert({ user_id: userId, event_type: VERIFY_EVENT })
}
