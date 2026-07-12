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

/** Rewrites (prompt analysis) for signed-in free users. */
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
