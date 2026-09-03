// Amounts are cents and must match BOTH the Paddle dashboard price IDs
// (authoritative - what the customer is actually charged) and the marketing
// display in EditorialPricing.tsx. If these drift again, fix the Paddle
// dashboard or the marketing copy - not just this file.
//
// PRICING, AND WHY IT MOVED OFF $4.99
//
// Paddle charges 5% + $0.50 a transaction, and the fixed half of that is what
// makes cheap subscriptions structurally bad: it is 15.0% of $4.99 and 7.6%
// of $19. At $4.99 net of fees ($4.24) a subscriber using their allowance on
// dense documents cost more than they paid. At $19 net ($17.55) the worst
// subscriber this plan can produce - 120 checks at the 20-claim cap with
// every claim linked, plus 60 detections - costs $16.44 and is still
// profitable. See limits.ts for the cost model those numbers come from.
export const PADDLE_PLANS = {
  pro_monthly: {
    priceId: process.env.PADDLE_PRO_MONTHLY_PRICE_ID!,
    amount: 1900,
    interval: 'month' as const,
    label: 'Pro Monthly',
  },
  pro_annual: {
    priceId: process.env.PADDLE_PRO_ANNUAL_PRICE_ID!,
    amount: 19000,
    interval: 'year' as const,
    label: 'Pro Annual',
  },
  /**
   * The founding price. Same product, locked for the life of the
   * subscription.
   *
   * A SEPARATE PADDLE PRICE, NOT A DISCOUNT CODE, because the promise is that
   * it never rises. A subscription created against this price keeps billing
   * against it when the list price moves, which is what "locked" has to mean.
   *
   * The cap on how many exist is enforced in code, not by Paddle. See
   * foundingSeatsLeft().
   */
  pro_founding: {
    priceId: process.env.PADDLE_PRO_FOUNDING_PRICE_ID!,
    amount: 1200,
    interval: 'month' as const,
    label: 'Pro Founding',
  },
  /**
   * The old $4.99 price, kept ONLY so an existing subscription can keep
   * billing against it. Nothing offers it: it is absent from the pricing
   * page and unreachable from checkout, and the guard in the checkout route
   * refuses it explicitly rather than relying on that.
   *
   * As of the price change there were zero subscriptions on it, so this is
   * insurance rather than a live path. It costs nothing to keep and would
   * cost a customer's trust to remove wrongly.
   */
  pro_legacy_499: {
    priceId: process.env.PADDLE_PRO_MONTHLY_PRICE_ID_LEGACY ?? '',
    amount: 499,
    interval: 'month' as const,
    label: 'Pro (legacy)',
  },
} as const

/** Plans a new customer may reach checkout for. Legacy is not one. */
export const SELLABLE_PLANS = ['pro_monthly', 'pro_annual', 'pro_founding'] as const
export type SellablePlan = (typeof SELLABLE_PLANS)[number]

export async function paddleRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.paddle.com${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Paddle API error ${res.status}: ${text}`)
  }
  return res.json()
}


/**
 * How many founding seats are left, counted at Paddle rather than here.
 *
 * ===================================================================
 * WHY PADDLE IS THE SOURCE OF TRUTH AND OUR OWN TABLE IS NOT
 * ===================================================================
 *
 * `profiles` only learns about a subscription when the webhook lands, so
 * between a completed payment and that webhook our own count is behind. Count
 * from the behind number and the fifty-first buyer gets a seat that was
 * already sold. Paddle knows the moment the subscription exists.
 *
 * ENFORCED AT CHECKOUT, WHICH IS THE ONLY CHOKE POINT. Every subscription has
 * to pass through the checkout route to exist, so refusing there is a real
 * gate and not a hidden button. A client-side check would be decoration: the
 * price id is in the page and anyone can post it back.
 *
 * THE RACE IS REAL AND BOUNDED. Two people checking out in the same second at
 * seat 49 both read 49 and both get through, so the true ceiling is fifty
 * plus however many checkouts are open at once, realistically fifty-one or
 * fifty-two. The alternative is reserving a seat before payment, and an
 * abandoned checkout then burns a seat forever. Selling one extra founding
 * subscription is a much smaller problem than a seat nobody can buy, so this
 * over-issues rather than leaking.
 *
 * FAILS CLOSED. If Paddle cannot be reached we report no seats left, because
 * the promise is "the first fifty" and honouring it wrongly is worse than a
 * founding buyer seeing the ordinary price during an outage.
 */
export const FOUNDING_SEATS = 50

/** Cached briefly: checkout is rare, but a page can ask more than once. */
let seatCache: { at: number; left: number } | null = null
const SEAT_CACHE_MS = 30_000

export async function foundingSeatsLeft(): Promise<number> {
  if (seatCache && Date.now() - seatCache.at < SEAT_CACHE_MS) return seatCache.left
  const priceId = PADDLE_PLANS.pro_founding.priceId
  if (!priceId) return 0
  try {
    // `status` excludes cancelled: a seat given up is a seat available again,
    // which is the reading most favourable to the next buyer and costs
    // nothing, since the price is profitable on its own.
    const res = await paddleRequest(
      `/subscriptions?price_id=${encodeURIComponent(priceId)}&status=active,trialing,past_due&per_page=100`
    )
    const taken = Array.isArray(res?.data) ? res.data.length : FOUNDING_SEATS
    const left = Math.max(0, FOUNDING_SEATS - taken)
    seatCache = { at: Date.now(), left }
    return left
  } catch (err) {
    console.error('[paddle] founding seat count failed, failing CLOSED:', err)
    return 0
  }
}
