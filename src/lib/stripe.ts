import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const PLANS = {
  pro_monthly: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    amount: 500, // $5.00
    interval: 'month' as const,
    label: 'Pro Monthly',
  },
  pro_annual: {
    priceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
    amount: 4800, // $48.00
    interval: 'year' as const,
    label: 'Pro Annual',
  },
} as const
