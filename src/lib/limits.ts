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

/**
 * AI detection, and why both numbers are monthly.
 *
 * MEASURED AT $0.018 A RUN, one Gemini call. That is more than a whole
 * uncited source check costs, which makes the detector the more expensive of
 * the two products per use, not the cheap extra it reads as.
 *
 * It used to be 5 a DAY for free, which is 150 a month against 5 source
 * checks a month. The deprecated tool would have been thirty times more
 * generous than the product being built, which tells every free user the
 * wrong thing about what this company is for. Monthly on both sides makes
 * them comparable at a glance, which is the whole point of matching units.
 */
export const DETECT_FREE_LIMIT = 10
export const DETECT_WINDOW_HOURS = 24 * 30

/**
 * PRO DETECTION IS CAPPED, and until now it was not capped at all.
 *
 * `getUsage` returns `limit: null` for pro, so `isAtLimit` could never be
 * true and the pricing page's "Unlimited AI text detections" was enforced
 * literally. At $0.018 a run that is the same unbounded promise on a metered
 * cost that the old unlimited checking was, and it fails the same way: the
 * heaviest user is the one who costs the most and pays the same.
 *
 * 60 a month is two a day every day, far above any real use of a tool that is
 * not being developed. It is a guard, not a shape.
 */
export const PRO_DETECT_LIMIT = 60
export const PRO_DETECT_WINDOW_HOURS = 24 * 30

/** Free taste for anonymous visitors before the sign-in gate. */
export const ANON_REWRITE_LIMIT = 1
export const ANON_DETECT_LIMIT = 1

/** Session history retention for free users, in days. Pro keeps everything. */
/**
 * Source checker limits.
 *
 * WHY THIS EXISTS AT ALL: before it, `consumeAnonRun` only ran when there was
 * no auth, so a SIGNED-IN user had no per-user ceiling whatsoever. One account
 * could have run five hundred documents, and the only thing preventing it was
 * that nobody had an account yet. That is unbounded cost per user, and it
 * stops being theoretical the moment outreach works.
 *
 * ACCOUNTS ARE METERED MONTHLY, THE TRIAL IS METERED DAILY, and mixing the
 * two units is how the pricing table broke. Free at 10 a DAY is 300 a month,
 * which was three times the Pro cap of 100 a month: Pro was a downgrade, and
 * a free user could cost about $12 a month while paying nothing.
 *
 *   anonymous   2 a day, per IP, in memory. BEST EFFORT ONLY: serverless
 *               instances recycle, so the true figure is somewhere above 2.
 *               A trial, not a plan. The global daily bucket in
 *               anon-budget.ts is what actually bounds the bill, and it fails
 *               closed.
 *   free        5 a month. About $0.64 of cost at worst.
 *   pro         120 a month. About $15.36 at worst against $17.55 net of
 *               Paddle on a $19 subscription, so no plan loses money even in
 *               the absurd case where every document is at the cap and every
 *               claim in it carries a link.
 *
 * Pro is 24 times Free and both are bounded. Rolling 30 days rather than
 * calendar months, so there is no month-boundary rush and no reset date to
 * explain.
 */
export const FACTCHECK_FREE_LIMIT = 5
export const FACTCHECK_WINDOW_HOURS = 24 * 30

/**
 * PRO IS CAPPED TOO, and it has to be.
 *
 * Cost is linear in claims checked, measured: $0.018 extraction plus $0.0055
 * a claim, so a document at the 20-claim cap with every claim linked costs
 * $0.128 and one with no links costs $0.018.
 *
 * 120 a month is the number where the ABSURD case still works. 120 x $0.128 =
 * $15.36, plus 60 detections at $0.018 = $1.09, against $17.55 net of Paddle
 * on $19. So the worst subscriber this plan can produce is still profitable,
 * which is the only version of a cap worth having: one that never needs
 * defending after the fact.
 *
 * It is also six documents a working day, far above any real use, so it
 * bounds the loss without being a thing a genuine subscriber ever notices.
 *
 * Rolling 30 days, matching FACTCHECK_WINDOW_HOURS and PRO_VERIFY_WINDOW_HOURS.
 */
export const PRO_FACTCHECK_LIMIT = 120
export const PRO_FACTCHECK_WINDOW_HOURS = 24 * 30

export const HISTORY_FREE_DAYS = 7

/**
 * Pro fair-use meter. Standard improvements stay unlimited for Pro; the
 * one expensive stage (a verification run, which is two full model calls
 * on real output) is metered per rolling 30 days so a single power user
 * can't push per-account cost past the subscription price.
 */
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
