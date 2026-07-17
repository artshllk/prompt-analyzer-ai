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
 * Free-tier daily limit (the current policy)
 *
 * Free users get USAGE_DAILY_LIMIT improvements per rolling 24 hours.
 * That is the whole rule.
 *
 * This replaced a 2h-window / 3h-cooldown model. The window was clever and
 * unexplainable, which is a bad trade. Three things were wrong with it:
 * the clock started invisibly on your first improve, so someone who
 * improved once at 9am and came back at 11:30 had silently lost a window
 * they never used; the 25 cap was so high that almost nobody reached the
 * generous half, so in practice users only ever met the cooldown; and it
 * punished the day-one exploration burst, which is the exact behaviour we
 * want from a new user.
 *
 * A rolling daily count fixes all three. It fits in one line - "10 free
 * improvements a day" - which means a user can plan around it, and it
 * gives a hard, predictable cost ceiling per account.
 *
 * Why 10 and not 3-5: one task is not one improve. A real user doing a
 * real piece of work runs improve, tweaks, answers the questions, runs it
 * again. That is ~3 improves for one finished thing. At 5/day they get one
 * and a half tasks; at 3/day they hit a wall inside their first task,
 * before the product has proved itself. 10 is roughly 3 real tasks - long
 * enough to form the habit that makes someone pay.
 *
 * Rolling, not calendar: credits come back gradually as individual
 * improvements age past 24h, so there is no midnight cliff and no timezone
 * question. The trade is that "resets at" is the moment the OLDEST
 * improvement in the window expires, which returns exactly one credit.
 * ------------------------------------------------------------------- */

export const USAGE_DAILY_LIMIT = 10
export const USAGE_WINDOW_HOURS = 24

/** Warn the user only when this few improvements remain. Silence above it. */
export const USAGE_WARN_AT = 2

export type UsageDecision =
  | { allow: true; remaining: number }
  | { allow: false; retryAt: string }

/**
 * The whole gating policy, as one pure function. Pure so it can be tested
 * without a database, and so the rule lives in exactly one place.
 *
 * @param usedInWindow improvements made in the last USAGE_WINDOW_HOURS
 * @param oldestAt     when the oldest of those happened (null = none).
 *                     Only read when blocking, to say when a credit is back.
 * @param now          injectable for tests
 */
export function decideUsage(
  usedInWindow: number,
  oldestAt: string | null = null,
  now: Date = new Date()
): UsageDecision {
  if (usedInWindow < USAGE_DAILY_LIMIT) {
    return { allow: true, remaining: USAGE_DAILY_LIMIT - usedInWindow - 1 }
  }

  // Out of credits. The next one returns when the oldest improvement in the
  // window ages out of it.
  const oldest = oldestAt ? new Date(oldestAt).getTime() : NaN
  const retryAt = isNaN(oldest)
    ? // No usable timestamp: a full window from now is the safe, honest
      // answer. Never guess earlier - a promise that expires late is worse
      // than one that expires early.
      now.getTime() + USAGE_WINDOW_HOURS * 3_600_000
    : oldest + USAGE_WINDOW_HOURS * 3_600_000

  return { allow: false, retryAt: new Date(retryAt).toISOString() }
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
