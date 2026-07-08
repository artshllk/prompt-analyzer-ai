# Architecture overview

High-level shape of the app. For each area there is a focused doc in this folder.

## Request flow

Browser or extension → Next.js App Router (route groups under `src/app/`) →
API routes under `src/app/api/` → shared logic in `src/lib/` → Supabase (data)
and external LLMs (OpenAI, Gemini). Vercel hosts everything; cron runs the
scheduled email jobs.

## Route groups (`src/app/`)

- `(marketing)/` — public marketing pages (home, pricing, faq).
- `(app)/` — the signed-in product surface (dashboard, history, insights, settings).
- `(auth)/` — login and auth screens.
- `(legal)/` — privacy, terms, refund.
- Plus non-grouped routes: `blog/`, `detector/`, `playground/`, `prompts/`,
  `tools/`, `extension/`, `rss.xml/`.

## API routes (`src/app/api/`)

- `anon/analyze` — the portable prompt-analysis endpoint. Optional `dc_` Bearer
  token upgrades an anonymous call to Pro. This is the seam every new client uses.
- `detector/analyze` — runs the AI detector.
- `billing/checkout`, `billing/portal`, `webhooks/paddle` — Paddle billing.
- `extension/issue-token` — mints a `dc_` token for the extension/connect flow.
- `prompts/*`, `insights/weekly`, `cron/emails`, `email/*`, `waitlist`,
  `account/delete`, `anon/capture-email`.

## Shared logic (`src/lib/`)

- `engine/` — the prompt improver. See `prompt-engine.md`.
- `detector/` — AI detection. See `detector.md`.
- `db/` — Supabase data access. See `data-model.md`.
- `paddle.ts` — billing. See `billing.md`.
- `limits.ts`, `rate-limit.ts` — quotas and throttling.
- `tokens.ts` — token counting (`gpt-tokenizer`).
- `blog-posts.ts`, `prompt-library.ts` — content registries. See `blog-system.md`.
- `email/`, `observability.ts` (Sentry), `og-image.tsx`, `supabase/`, `auth/`.

## Key architectural property

`analyzePrompt()` in `lib/engine/index.ts` is **pure and portable** — no Next,
Supabase, or HTTP dependencies. The HTTP, auth, rate-limit, and billing layers wrap
it. This is why new clients (VS Code extension, MCP server) are cheap: they are
thin UIs over the same engine and `/api/anon/analyze`. See `roadmap.md`.
