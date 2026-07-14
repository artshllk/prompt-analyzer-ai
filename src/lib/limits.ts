/**
 * Central quota configuration for the two metered features.
 *
 * Single source of truth so the API routes, the usage helpers, the client
 * gates, and the pricing copy never drift. Windows are rolling, not
 * calendar-based (e.g. "5 in the last 48 hours", not "5 this month").
 *
 * Tiers:
 *   - anon (not signed in): a single free taste, then a sign-in gate.
 *   - free (signed in):     the limits below, per rolling window.
 *   - pro:                  unlimited (limit === null everywhere).
 *
 * This module is pure config (no server-only imports) so it's safe to
 * import from client components too.
 */

/* ---------------------------------------------------------------------
 * Free-tier usage window (the current policy)
 *
 * Free users improve freely for USAGE_WINDOW_HOURS, then wait
 * USAGE_COOLDOWN_HOURS before a fresh window opens. Repeating.
 *
 * Why a window rather than a credit count: it matches how people actually
 * work - a focused session, then away for hours - and it is how the chat
 * products gate their own free tiers. Someone sharpening three prompts
 * never touches it. Someone hammering the tool does, which is exactly who
 * should feel it. It also gives Pro a clean, honest pitch: never wait.
 *
 * SOFT_CAP is an abuse guard, not a product limit. It should be high
 * enough that a genuine user never sees it.
 * ------------------------------------------------------------------- */

export const USAGE_WINDOW_HOURS = 2
export const USAGE_COOLDOWN_HOURS = 3
export const USAGE_SOFT_CAP = 25

/** Warn the user only when this few improvements remain. Silence above it. */
export const USAGE_WARN_AT = 2

export type UsageDecision =
  | { allow: true; opensWindow: boolean; remaining: number }
  | { allow: false; retryAt: string }

/**
 * The whole gating policy, as one pure function. Pure so it can be tested
 * without a database, and so the rule lives in exactly one place.
 *
 * @param windowStartedAt when the current window opened (null = none)
 * @param usedInWindow    improvements already made inside it
 * @param now             injectable for tests
 */
export function decideUsage(
  windowStartedAt: string | null,
  usedInWindow: number,
  now: Date = new Date()
): UsageDecision {
  const t = now.getTime()

  // No window yet: this improvement opens one.
  if (!windowStartedAt) {
    return { allow: true, opensWindow: true, remaining: USAGE_SOFT_CAP - 1 }
  }

  const started = new Date(windowStartedAt).getTime()
  if (isNaN(started)) {
    // Corrupt value - fail open and reset rather than locking someone out.
    return { allow: true, opensWindow: true, remaining: USAGE_SOFT_CAP - 1 }
  }

  const windowEnds = started + USAGE_WINDOW_HOURS * 3_600_000
  const cooldownEnds = windowEnds + USAGE_COOLDOWN_HOURS * 3_600_000

  // Inside the window: allowed, unless they are hammering it.
  if (t < windowEnds) {
    if (usedInWindow >= USAGE_SOFT_CAP) {
      return { allow: false, retryAt: new Date(cooldownEnds).toISOString() }
    }
    return {
      allow: true,
      opensWindow: false,
      remaining: USAGE_SOFT_CAP - usedInWindow - 1,
    }
  }

  // Window closed, cooling down.
  if (t < cooldownEnds) {
    return { allow: false, retryAt: new Date(cooldownEnds).toISOString() }
  }

  // Cooldown served: a fresh window opens now.
  return { allow: true, opensWindow: true, remaining: USAGE_SOFT_CAP - 1 }
}

/**
 * Legacy credit quota. Still referenced by the website playground routes,
 * which are on their way out. Do not build anything new on these.
 * @deprecated use decideUsage()
 */
export const REWRITE_FREE_LIMIT = 5
export const REWRITE_WINDOW_HOURS = 48

/** AI-detection texts for signed-in free users. */
export const DETECT_FREE_LIMIT = 5
export const DETECT_WINDOW_HOURS = 24

/** Free taste for anonymous visitors before the sign-in gate. */
export const ANON_REWRITE_LIMIT = 1
export const ANON_DETECT_LIMIT = 1

/** Session history retention for free users, in days. Pro keeps everything. */
export const HISTORY_FREE_DAYS = 7

/**
 * Pro fair-use meters. Standard improvements stay unlimited for Pro;
 * the two expensive stages (Deep Rewrite's critic pass, verification
 * runs) are metered per rolling 30 days so a single power user can't
 * push per-account cost past the subscription price.
 */
export const PRO_DEEP_LIMIT = 100
export const PRO_DEEP_WINDOW_HOURS = 30 * 24
export const PRO_VERIFY_LIMIT = 100
export const PRO_VERIFY_WINDOW_HOURS = 30 * 24

/**
 * Free users get a small lifetime taste of verification - seeing the
 * original vs improved prompt actually behave differently is the
 * conversion moment, so everyone gets to experience it a few times.
 */
export const FREE_VERIFY_LIFETIME_CREDITS = 3

/** ISO timestamp for the start of a rolling window `hours` ago. */
export function windowStart(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString()
}

/** Human-readable window label for UI copy ("48h", "24h"). */
export function windowLabel(hours: number): string {
  return `${hours}h`
}
