/**
 * Lightweight in-memory token bucket. Single-instance only - fine for early
 * Vercel traffic (one warm Lambda usually serves many users); for multi-region
 * scale swap to Upstash Redis without changing the call sites.
 *
 * Each bucket key (IP, userId, etc.) gets `capacity` tokens that refill at
 * `refillPerSecond`. `take(key)` returns true if a token was available.
 */

interface Bucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, Bucket>()
const MAX_KEYS = 10_000

interface LimitConfig {
  capacity: number
  refillPerSecond: number
}

export function take(key: string, config: LimitConfig): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  let bucket = buckets.get(key)

  if (!bucket) {
    if (buckets.size >= MAX_KEYS) {
      // Crude eviction - clear oldest 10% when full
      const cutoff = now - 60_000
      for (const [k, b] of buckets) {
        if (b.lastRefill < cutoff) buckets.delete(k)
      }
    }
    bucket = { tokens: config.capacity, lastRefill: now }
    buckets.set(key, bucket)
  }

  const elapsed = (now - bucket.lastRefill) / 1000
  bucket.tokens = Math.min(config.capacity, bucket.tokens + elapsed * config.refillPerSecond)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return { allowed: true, retryAfterMs: 0 }
  }

  const needed = 1 - bucket.tokens
  return {
    allowed: false,
    retryAfterMs: Math.ceil((needed / config.refillPerSecond) * 1000),
  }
}

/** Strict per-IP cap for anonymous traffic - abuse protection. */
/**
 * 6/hour was set when the tool was behind a modal and most traffic was
 * desktop. Launch traffic is mostly mobile, and a mobile carrier NAT puts
 * thousands of people behind one address: at 6/hour the seventh person on
 * that carrier is refused while the site is quiet, and they have no way to
 * know why.
 *
 * This is burst protection, not a cost control. The cost control is the
 * global daily ceiling in lib/db/anon-budget.ts, which no amount of IP
 * rotation gets around. 30/hour still stops one person hammering it and stops
 * blaming a whole carrier for it.
 */
export const ANON_LIMIT: LimitConfig = { capacity: 30, refillPerSecond: 30 / 3600 } // 30/hour

/** Per-user cap layered on top of monthly quota - burst protection. */
export const USER_LIMIT: LimitConfig = { capacity: 10, refillPerSecond: 10 / 60 } // 10/minute

/** Pro users get triple the burst headroom - the "priority processing"
 *  the pricing page promises. Still capped for infra protection. */
export const PRO_USER_LIMIT: LimitConfig = { capacity: 30, refillPerSecond: 30 / 60 } // 30/minute

/**
 * Counter events (/api/anon/event). Deliberately loose: one improve emits
 * several of these, an active session emits many, and throttling them would
 * quietly bias the data toward light users - the opposite of what a metric is
 * for. It exists only so a script cannot fill the table.
 *
 * On its own key namespace, like every other endpoint, so a burst of counters
 * can never consume the budget that gates real work.
 */
export const EVENT_LIMIT: LimitConfig = { capacity: 120, refillPerSecond: 120 / 3600 } // 120/hour

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}
