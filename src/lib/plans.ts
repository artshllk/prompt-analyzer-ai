/**
 * The plans as a person sees them.
 *
 * DISPLAY ONLY, AND NO PRICE IDS. This is imported by client components, and
 * lib/paddle.ts reads server-only environment variables, so importing that
 * into the browser would ship `undefined` price ids into the bundle.
 *
 * The cents here must match the cents in paddle.ts, which is what actually
 * charges the card. pricing-copy.test.ts asserts they agree, because these
 * two files are on opposite sides of the client/server boundary and nothing
 * else makes them stay in step.
 */

import { FACTCHECK_FREE_LIMIT, PRO_FACTCHECK_LIMIT, PRO_DETECT_LIMIT } from './limits'

export interface PlanChoice {
  /** The key posted to /api/billing/checkout. Must exist in SELLABLE_PLANS. */
  plan: 'pro_founding' | 'pro_monthly' | 'pro_annual'
  name: string
  /** Whole currency units, as displayed. */
  price: string
  cadence: string
  /** One line under the price. Never a number the server does not enforce. */
  note: string
}

export const PRO_INCLUDES = [
  `${PRO_FACTCHECK_LIMIT} source checks a month`,
  `${PRO_DETECT_LIMIT} AI text detections a month`,
  'Unlimited prompt improvements',
  'History kept forever',
]

export const FREE_INCLUDES = `${FACTCHECK_FREE_LIMIT} source checks a month`

/**
 * Founding first, and only while seats remain.
 *
 * The order is the recommendation. Showing $19 above $12 would be asking
 * someone to notice the cheaper option for themselves.
 */
export function planChoices(foundingLeft: number): PlanChoice[] {
  const founding: PlanChoice[] =
    foundingLeft > 0
      ? [
          {
            plan: 'pro_founding',
            name: 'Founding',
            price: '12',
            cadence: 'a month',
            note:
              foundingLeft === 1
                ? 'One place left. This price never rises.'
                : `${foundingLeft} places left. This price never rises.`,
          },
        ]
      : []

  return [
    ...founding,
    { plan: 'pro_monthly', name: 'Monthly', price: '19', cadence: 'a month', note: 'Cancel anytime.' },
    { plan: 'pro_annual', name: 'Yearly', price: '190', cadence: 'a year', note: 'Two months free.' },
  ]
}
