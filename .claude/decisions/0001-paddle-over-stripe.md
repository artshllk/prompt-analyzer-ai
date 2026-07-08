# 0001 — Billing is Paddle, not Stripe

## Context

Both `@stripe/stripe-js` + `stripe` and `@paddle/paddle-js` are installed, and
both `src/lib/stripe.ts` and `src/lib/paddle.ts` exist. This has caused confusion:
sessions have assumed Stripe billing and gone down the wrong path.

## Decision

**Paddle is the billing provider.** `src/lib/stripe.ts` is legacy and imported nowhere.

Verified from code:
- `src/lib/paddle.ts` is imported by the billing routes.
- `src/app/api/billing/checkout` and `.../portal` use Paddle.
- `src/app/api/webhooks/paddle` is the live webhook. There is no Stripe webhook wired.
- Env vars: `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRO_MONTHLY_PRICE_ID`,
  `PADDLE_PRO_ANNUAL_PRICE_ID`. The `STRIPE_*` env vars are unused leftovers.

## Why

Paddle acts as merchant of record (handles global tax/VAT), which suits a small,
solo-run product selling worldwide. That work was done; Stripe was the earlier
path and was left behind without cleanup.

## Tradeoff / open item

The dead Stripe dependency and its `STRIPE_*` env vars create false trails. Removing
`lib/stripe.ts`, the `stripe`/`@stripe/stripe-js` packages, and the Stripe env vars
is a safe cleanup worth doing. Tracked in `.claude/roadmap.md` backlog.

## Pricing (verified)

Pro is **$9.99/mo** (marketing + pricing pages). Free tier: 5 rewrites + 5
detections per rolling window, 7-day history (`src/lib/limits.ts`). Some older
strategy docs say "$5" or "25/mo" — those are stale. Trust `limits.ts` and the
marketing pages.
