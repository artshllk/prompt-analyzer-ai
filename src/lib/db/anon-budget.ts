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
 * Which product is spending. Each has its own daily ceiling, because they
 * have wildly different unit costs and because both guards fail closed: with
 * one shared counter, a busy day on one product takes the other offline.
 * See migration 015.
 */
export type BudgetBucket = 'improver' | 'factcheck'

/**
 * Per-bucket daily ceilings, each tunable without a code change.
 *
 * improver: FROZEN PRODUCT. It was 500 a day when it was the homepage. It is
 * now a legacy page kept alive so 48 existing links and one already-sent
 * email keep resolving, and it should not cost real money to keep that
 * promise. 60 a day is roughly a dollar, which is the right price for a
 * page nobody is being sent to on purpose. The browser extension shares this
 * bucket, which is deliberate: it is the same frozen product.
 *
 * factcheck: set when the route that spends it exists. A fact-check run is
 * 5x to 50x a rewrite, so this number is not comparable to the one above and
 * a shared counter could never have expressed that.
 */
const DEFAULT_CAPS: Record<BudgetBucket, number> = {
  improver: 60,
  factcheck: 40,
}

const CAP_ENV: Record<BudgetBucket, string> = {
  improver: 'ANON_DAILY_GLOBAL_CAP',
  factcheck: 'FACTCHECK_DAILY_CAP',
}

export function anonDailyCap(bucket: BudgetBucket = 'improver'): number {
  const raw = Number(process.env[CAP_ENV[bucket]])
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_CAPS[bucket]
}

/**
 * What the budget should do for one incoming call.
 *
 * Extracted from the route so the rule can be tested rather than inferred
 * from an if-chain, because the if-chain got it wrong. `consumeAnonRun` used
 * to run on every anonymous call with no turn gate, while the quota check
 * three lines below was correctly gated on the first turn. A prompt that
 * asked a clarifying question therefore cost two units: one for the question
 * and one for the answer. That halved the real ceiling, and at a cap of 1 it
 * meant no prompt that asked anything could ever finish.
 *
 *   consume  first turn of an anonymous action. Costs one unit.
 *   check    a later turn of the same action. Must respect the ceiling, must
 *            not spend again, or one action costs two.
 *   skip     signed in. They have their own quota and their own
 *            accountability, and this ceiling is not theirs.
 */
export type BudgetAction = 'consume' | 'check' | 'skip'

export function budgetActionFor(params: { signedIn: boolean; turn: number }): BudgetAction {
  if (params.signedIn) return 'skip'
  return params.turn === 0 ? 'consume' : 'check'
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
export async function consumeAnonRun(
  bucket: BudgetBucket = 'improver'
): Promise<AnonBudget> {
  const cap = anonDailyCap(bucket)
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase.rpc('bump_anon_runs', {
      p_day: today(),
      p_bucket: bucket,
    })
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
// Cached PER BUCKET. One shared cache entry would let a busy improver day
// answer a factcheck question, which is the exact confusion buckets exist to
// remove.
const cached = new Map<BudgetBucket, { at: number; exhausted: boolean }>()
const CACHE_MS = 30_000

export async function anonBudgetExhausted(
  bucket: BudgetBucket = 'improver'
): Promise<boolean> {
  const hit = cached.get(bucket)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.exhausted
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('anon_daily_usage')
      .select('runs')
      .eq('day', today())
      .eq('bucket', bucket)
      .maybeSingle()
    if (error) {
      console.error('[anon-budget] read failed, allowing:', error.message)
      return false
    }
    const exhausted = (data?.runs ?? 0) > anonDailyCap(bucket)
    cached.set(bucket, { at: Date.now(), exhausted })
    return exhausted
  } catch {
    return false
  }
}
