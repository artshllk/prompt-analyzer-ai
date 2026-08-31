@AGENTS.md

# Deepclario — project guide

This file is the always-loaded map. Keep it short. Deeper knowledge lives in
`.claude/` and is read on demand. When something here needs more detail, follow
the pointer instead of expanding this file.

## What Deepclario is

A web toolkit for people who use ChatGPT, Claude, and Gemini. Four tools:

- **Prompt improver** — rewrites a rough prompt, asking one question first when
  two readings would give different answers. `/playground`, the homepage hero,
  and the extension.
- **AI text detector** — reports the signals that say text reads as AI-written.
  Never a percentage. `/detector`.
- **Token counter** — counts tokens (`gpt-tokenizer`). Logic exists; no public page yet.

Backed by a large SEO blog (`/blog`, 37+ posts), a free prompt library
(`/prompts`), and a browser extension. Audience is smart but non-technical.
Pre-revenue. Live at deepclario.com. Two-person team: Art Shllaku, Agon.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase
(DB + auth) · Paddle (billing) · Vercel (host) · Resend (email) · Sentry.
Prompt engine calls **OpenAI + Gemini**. Detector explanations use **Gemini**.

## Load-bearing facts (do not get these wrong)

These are verified from code and get re-derived or mistaken every session.

- **Billing is Paddle, not Stripe.** `lib/paddle.ts` is wired to checkout/portal
  and `webhooks/paddle`. `lib/stripe.ts` is imported nowhere — legacy/dead. See
  `.claude/decisions/0001-paddle-over-stripe.md`.
- **The detector never reports a percentage.** Deterministic signals compute the
  verdict band; the LLM only writes the plain-English explanation. It reports
  signals openly and a confidence *label*, never "94% AI". See
  `.claude/decisions/0002-detector-no-percentage.md` and `architecture/detector.md`.
- **There is no clarity score, and Deep Rewrite does not exist.** Both were
  deleted. The score was two model self-reports (the "after" number was the
  rewrite model grading its own rewrite) and the shipping path never wrote it,
  so three surfaces silently showed zeros. Deep Rewrite had no client. See
  `.claude/decisions/0005-no-invented-numbers.md`. Do not reintroduce either.
- **There are two engine pipelines.** `analyzePrompt()` (structured JSON, used by
  the web tool) and `streamSharpen()` (plain-text stream, used by the extension).
  A change to rewrite behavior usually has to land in both.
- **The prompt engine uses OpenAI + Gemini, not Anthropic.** See `architecture/prompt-engine.md`.
- **`analyzePrompt()` in `lib/engine/index.ts` is a pure, portable function** — no
  Next/Supabase/HTTP deps. This is why new clients (VS Code, MCP) are cheap. See `roadmap.md`.
- **Pro is $4.99/mo right now, a launch discount from $9.99 (Paddle).** The
  launch flag is `LAUNCH` in `components/marketing/EditorialPricing.tsx`; Paddle
  charges 499¢ (`lib/paddle.ts`). Free tier: 10 improvements per rolling 24h
  (`USAGE_DAILY_LIMIT`), 5 detections per 24h, 7-day history (`lib/limits.ts`).
  Anything saying 25-a-month or a flat $9.99 is stale.
- **Auth: Google Identity Services + `signInWithIdToken`**, not Supabase OAuth
  redirect — so the consent screen shows Deepclario, never supabase.co. See
  `.claude/decisions/0003-auth-gis-no-supabase-co.md`.
- **Design is locked: editorial dark, no 3D.** `three`/`react-three-fiber` are
  installed but 3D hero treatments are rejected. See `decisions/0004-design-aesthetic-locked.md`.
- **The blog runs off `lib/blog-posts.ts`.** Adding a `BLOG_POSTS` entry auto-updates
  the index, sitemap, and RSS. Posts are React pages, not markdown. See
  `architecture/blog-system.md` and `workflows/add-blog-post.md`.

## Repo map

- `src/lib/engine/` — prompt engine. `index.ts` (staged pipeline) and `sharpen.ts` (streaming fast path).
- `src/lib/detector/` — AI detection (deterministic signals + Gemini explanation).
- `src/lib/db/` — Supabase data access: `sessions`, `usage`, `api-tokens`.
- `src/lib/{paddle,limits,rate-limit,tokens}.ts` — billing, quotas, throttling, token counting.
- `src/app/(marketing|app|auth|legal)/` — route groups. `blog/`, `detector/`, `playground/`, `prompts/`, `extension/`. There is no `tools/`; those URLs 404 on purpose.
- `src/app/api/` — anon analyze/sharpen/fork/explain/verify, detector, billing, webhooks/paddle, extension token, cron, email.
- `extension/` — browser extension source (v0.5.0). Also versioned zips on the Desktop.

## Unapplied migrations

Checked against the live database on 2026-08-31: **`012`, `013` and `014` are
applied. Only `011` is outstanding**, and it can wait as long as you like
because nothing in the new code touches `profiles.email_weekly`.

`014` is the load-bearing one: it creates the RPC behind the global anonymous
daily cap, and that guard fails closed, so without it every anonymous run
returns `daily_capacity`. It is in place.

Full procedure, including what to re-check and how to roll back:
`docs/deploy-runbook.md`.

## Commands

- `npm run dev` — local dev. `npm run build` — production build (real verification).
- `npm test` — unit suite (parser, coercers, pipeline guard). No network, no cost.
- `npx tsc --noEmit` — typecheck. `npm run lint` — eslint.
- Verify a change by building or driving the affected flow, not just typecheck.

## Working rules

Full detail in `.claude/conventions.md`. The essentials:

- **Voice (user-facing copy):** simple, plain English; no em-dashes mid-sentence;
  no AI-writing tells; Deepclario must never read as AI-written. This is the brand.
- **Commits:** under Art's name only. **Never** add a `Co-Authored-By: Claude`
  trailer. Branch off `main`; don't commit to `main` directly. Prefer `git revert`
  over history rewrites.
- **Blog work:** see `workflows/add-blog-post.md`. Match the existing post pattern
  and register in `BLOG_POSTS`.

## Where to look next

- Architecture deep-dives: `.claude/architecture/`
- Why a choice was made: `.claude/decisions/`
- How to do a recurring task: `.claude/workflows/` (or the `/new-blog-post`, `/verify-blog` commands)
- Roadmap and the VS Code / MCP plan: `.claude/roadmap.md`
