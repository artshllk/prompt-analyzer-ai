# Billing

Provider: **Paddle** (merchant of record). See
`.claude/decisions/0001-paddle-over-stripe.md` for why, and why Stripe is dead.

## Pieces

- `src/lib/paddle.ts` — the Paddle helper. The only billing lib actually imported.
- `src/app/api/billing/checkout/route.ts` — starts a Paddle checkout.
- `src/app/api/billing/portal/route.ts` — customer portal link.
- `src/app/api/webhooks/paddle/route.ts` — the live webhook (subscription events).
- Env: `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRO_MONTHLY_PRICE_ID`,
  `PADDLE_PRO_ANNUAL_PRICE_ID`.

## Plans (verified from code)

- **Free:** 5 rewrites + 5 detections per rolling window, 7-day history
  (`src/lib/limits.ts`: `REWRITE_FREE_LIMIT`, `DETECT_FREE_LIMIT`, `HISTORY_FREE_DAYS`).
- **Pro:** $9.99/mo (marketing + pricing pages). Unlocks Deep Rewrite, higher/removed
  limits, and full history.

## The Pro gate at the API

`/api/anon/analyze` accepts an optional `dc_` Bearer token. No token means an
anonymous, IP-rate-limited call with no DB write. A valid token
(`validateToken` in `lib/db/api-tokens.ts`) upgrades the call to the user's plan
and honors Pro-only options like `deep`.

## Notes

- **Stripe is legacy.** `lib/stripe.ts` and the `STRIPE_*` env vars are unused.
  Do not wire new billing through Stripe. Removing it is a tracked cleanup.
- Owner note: Art's own account is Pro via SQL (no `paddle_customer_id`), so billing
  flows hit the no-subscription path for him by design. Keep that in mind when
  testing billing as the owner.
