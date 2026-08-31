import { createServiceClient } from '@/lib/supabase/server'

/**
 * The global daily ceiling on anonymous model calls.
 *
 * WHY THIS EXISTS AND THE PER-IP LIMIT DOES NOT COVER IT
 *
 * lib/rate-limit.ts holds its buckets in a Map inside the serverless process.
 * It is not shared between instances, it is wiped on every cold start and
 * every deploy, and its key eviction means a flood of distinct IPs resets
 * everyone. It is good burst protection for one impatient person and no
 * protection at all against a script with a proxy list.
 *
 * The tool now sits in the hero of a public page, so the exposure is an
 * unauthenticated LLM call reachable by anyone who can type a URL. This is
 * the ceiling on that. It lives in the database, so every instance shares it.
 *
 * WHAT IT DOES NOT DO
 *
 * It does not identify anybody. One integer per day, no IP, no session, no
 * prompt. That is the whole point: a counter that cannot be gamed because
 * there is nothing per-caller to game, and nothing in it worth leaking.
 *
 * SIGNED-IN USERS ARE NEVER AFFECTED. They have their own quotas and their
 * own accountability. This only stands in front of the anonymous path.
 */

/**
 * Tunable without a code change. 500 anonymous runs a day is far more than
 * the site's real traffic and caps the worst case at roughly ten dollars,
 * which is the number that matters for something pre-revenue.
 */
const DEFAULT_CAP = 500

export function anonDailyCap(): number {
  const raw = Number(process.env.ANON_DAILY_GLOBAL_CAP)
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_CAP
}

/** UTC, so the reset is a fixed time rather than one that moves per region. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface AnonBudget {
  allowed: boolean
  used: number
  cap: number
  /** When the counter rolls over, for the "back tomorrow" copy. */
  resetAt: string
}

function nextMidnightUtc(): string {
  const d = new Date()
  d.setUTCHours(24, 0, 0, 0)
  return d.toISOString()
}

/**
 * Count one anonymous run and say whether it was within the cap.
 *
 * Increments first and checks after, on purpose. Reading then writing lets
 * two concurrent requests see the same number and both pass a cap they
 * jointly break, which is precisely the traffic shape this exists to survive.
 * The atomic RPC returns the post-increment count, so the check is on a
 * number that is already true.
 *
 * FAILS CLOSED. Everywhere else in this codebase a quota read that errors
 * fails open, because the cost of wrongly blocking a paying user is worse
 * than one free extra rewrite. This is the opposite case: if the database is
 * unreachable, the LLM still answers and still bills, and the only thing left
 * standing is an in-memory limiter that a script walks straight past. An
 * anonymous visitor during a database outage sees "come back tomorrow".
 * Everyone signed in is unaffected. That is the right trade for a product
 * with no revenue and a public, unauthenticated model call.
 */
export async function consumeAnonRun(): Promise<AnonBudget> {
  const cap = anonDailyCap()
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase.rpc('bump_anon_runs', { p_day: today() })
    if (error || typeof data !== 'number') {
      console.error('[anon-budget] bump failed, failing CLOSED:', error?.message ?? data)
      return { allowed: false, used: cap, cap, resetAt: nextMidnightUtc() }
    }
    return { allowed: data <= cap, used: data, cap, resetAt: nextMidnightUtc() }
  } catch (err) {
    console.error('[anon-budget] bump threw, failing CLOSED:', (err as Error).message)
    return { allowed: false, used: cap, cap, resetAt: nextMidnightUtc() }
  }
}

/**
 * Read-only check, for a call that is part of a run rather than a run itself.
 *
 * The extension's ambiguity check runs before the rewrite it belongs to, so
 * counting it would bill one user action twice and halve the real ceiling. It
 * still has to respect the ceiling once it is hit, or a script could sit on
 * that endpoint alone.
 *
 * Cached briefly because this is on the hot path and the answer only changes
 * when the counter crosses the cap. Fails OPEN: it is one cheap call, it is
 * still behind the per-IP bucket, and blocking it on a database blip would
 * break the extension for people who are not the problem.
 */
let cached: { at: number; exhausted: boolean } | null = null
const CACHE_MS = 30_000

export async function anonBudgetExhausted(): Promise<boolean> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.exhausted
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('anon_daily_usage')
      .select('runs')
      .eq('day', today())
      .maybeSingle()
    if (error) {
      console.error('[anon-budget] read failed, allowing:', error.message)
      return false
    }
    const exhausted = (data?.runs ?? 0) > anonDailyCap()
    cached = { at: Date.now(), exhausted }
    return exhausted
  } catch {
    return false
  }
}
