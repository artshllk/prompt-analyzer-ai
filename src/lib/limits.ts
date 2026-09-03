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
 * Prompt improvements, and why both tiers are now monthly
 *
 * MEASURED, NOT ASSUMED. A Pro improvement costs $0.0198, mean of three real
 * runs through gemini-3.5-flash, ranging $0.0141 to $0.0229. A free one costs
 * $0.0096 on gpt-5.4-mini. CLAUDE.md said improvements "cost about a cent",
 * which is why Pro got them unlimited; that number was twice too low and
 * nothing enforced the promise anyway.
 *
 * Unlimited at two cents is the same unbounded promise that unlimited
 * checking was: improvements alone exhausted a $12 founding subscription at
 * 551 a month, with no ceiling to stop it.
 *
 * FREE MOVED FROM 10 A DAY TO 10 A MONTH. 10 a day is 300 a month, which is
 * $2.88 of cost on a plan that pays nothing, and it made the frozen tool
 * sixty times more generous than the product being built. Every allowance in
 * the product is monthly now, so the plans can be compared at a glance rather
 * than by converting units in your head - the mistake that once had Free at
 * 10 a day against Pro at 100 a month.
 *
 * The old daily reasoning below is kept because its argument is still good
 * and someone will want it if this is ever revisited:
 *
 *   "One task is not one improve. A real user doing a real piece of work runs
 *   improve, tweaks, answers the questions, runs it again. That is ~3
 *   improves for one finished thing."
 *
 * At 10 a month that is roughly three finished tasks. That is a deliberate
 * trade: the improver is frozen, nobody has run one since 2026-07-28, and it
 * should not be the thing that decides what a subscription costs to serve.
 *
 * Rolling 30 days, matching every other allowance here, so there is no
 * month-boundary rush and no reset date to explain.
 * ------------------------------------------------------------------- */

export const IMPROVE_FREE_LIMIT = 10
export const IMPROVE_PRO_LIMIT = 30
export const IMPROVE_WINDOW_HOURS = 24 * 30

/**
 * Kept as aliases because the extension's API contract sends `dailyLimit` and
 * a shipped build reads it. The VALUE is now monthly; only the wire name is
 * historical, and renaming a field an installed extension parses would break
 * it for no gain.
 * @deprecated use IMPROVE_FREE_LIMIT / IMPROVE_WINDOW_HOURS
 */
export const USAGE_DAILY_LIMIT = IMPROVE_FREE_LIMIT
export const USAGE_WINDOW_HOURS = IMPROVE_WINDOW_HOURS

export const USAGE_WARN_AT = 2

export type UsageDecision =
  | { allow: true; remaining: number }
  | { allow: false; retryAt: string }

/**
 * The whole gating policy, as one pure function. Pure so it can be tested
 * without a database, and so the rule lives in exactly one place.
 *
 * @param usedInWindow improvements made in the last IMPROVE_WINDOW_HOURS
 * @param oldestAt     when the oldest of those happened (null = none).
 *                     Only read when blocking, to say when a credit is back.
 * @param now          injectable for tests
 * @param limit        the tier's allowance. Passed in rather than read from a
 *                     constant, because Pro used to have NO ceiling here and
 *                     a function that hardcodes the free one cannot express
 *                     a paid one. Defaults to free so an unconverted caller
 *                     is strict rather than unlimited.
 */
export function decideUsage(
  usedInWindow: number,
  oldestAt: string | null = null,
  now: Date = new Date(),
  limit: number = IMPROVE_FREE_LIMIT
): UsageDecision {
  if (usedInWindow < limit) {
    return { allow: true, remaining: limit - usedInWindow - 1 }
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
 * 30 a month is one a day every day, far above any real use of a tool that is
 * not being developed and that no signed-in account has ever run: zero
 * `text_detected` rows exist. It is a guard, not a shape.
 */
export const PRO_DETECT_LIMIT = 30
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
 *   anonymous   3 a month, per IP, best effort. Not a plan: it is enough to
 *               see the tool work on your own document.
 *   free        10 a month. About $1.56 of cost at worst, counting its
 *               detections and improvements too.
 *   pro         60 a month. About $7.68 at worst.
 *
 * Pro is 24 times Free and both are bounded. Rolling 30 days rather than
 * calendar months, so there is no month-boundary rush and no reset date to
 * explain.
 */
export const FACTCHECK_FREE_LIMIT = 10
export const FACTCHECK_WINDOW_HOURS = 24 * 30

/**
 * PRO IS CAPPED TOO, and it has to be.
 *
 * Cost is linear in claims checked, measured: $0.018 extraction plus $0.0055
 * a claim, so a document at the 20-claim cap with every claim linked costs
 * $0.128 and one with no links costs $0.018.
 *
 * 60 IS THE NUMBER WHERE EVERY PRICE WORKS, NOT JUST THE LIST ONE. The whole
 * worst case, measured:
 *
 *   60 checks      x $0.128 = $7.68
 *   30 detections  x $0.018 = $0.55
 *   30 improvements x $0.0198 = $0.59
 *   ------------------------------------
 *                             $8.81
 *
 * against $10.90 net of Paddle on the $12 FOUNDING price, and $17.55 on the
 * $19 list price. Positive at every price and every usage level, which is the
 * point. The previous 120/60/unlimited was positive at $19 and underwater at
 * $12 the moment somebody used the improver.
 *
 * 60 is still three documents a working day, far above any real use, so it
 * bounds the loss without being a thing a genuine subscriber ever notices.
 *
 * Rolling 30 days, matching FACTCHECK_WINDOW_HOURS and PRO_VERIFY_WINDOW_HOURS.
 */
export const PRO_FACTCHECK_LIMIT = 60
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
