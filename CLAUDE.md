@AGENTS.md

# Deepclario — project guide

This file is the always-loaded map. Keep it short. Deeper knowledge lives in
`.claude/` and is read on demand. When something here needs more detail, follow
the pointer instead of expanding this file.

## What Deepclario is

A web toolkit for people who use ChatGPT, Claude, and Gemini. Four tools:

- **Prompt improver** — scores a rough prompt and rewrites it with CRAFT
  (Context, Role, Action, Format, Tone). `/playground`, `/tools/*`.
- **Deep rewrite** — Pro-only multi-pass rewrite (draft → critique → refine).
- **AI text detector** — scores how likely text is AI-written. `/detector`.
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
- **The prompt engine uses OpenAI + Gemini, not Anthropic.** See `architecture/prompt-engine.md`.
- **`analyzePrompt()` in `lib/engine/index.ts` is a pure, portable function** — no
  Next/Supabase/HTTP deps. This is why new clients (VS Code, MCP) are cheap. See `roadmap.md`.
- **Pro is $9.99/mo (Paddle).** Free tier: 5 rewrites + 5 detections per window,
  7-day history (`lib/limits.ts`). Older docs say $5 / 25-a-month — those are stale;
  trust `limits.ts` and the marketing pages.
- **Auth: Google Identity Services + `signInWithIdToken`**, not Supabase OAuth
  redirect — so the consent screen shows Deepclario, never supabase.co. See
  `.claude/decisions/0003-auth-gis-no-supabase-co.md`.
- **Design is locked: editorial dark, no 3D.** `three`/`react-three-fiber` are
  installed but 3D hero treatments are rejected. See `decisions/0004-design-aesthetic-locked.md`.
- **The blog runs off `lib/blog-posts.ts`.** Adding a `BLOG_POSTS` entry auto-updates
  the index, sitemap, and RSS. Posts are React pages, not markdown. See
  `architecture/blog-system.md` and `workflows/add-blog-post.md`.

## Repo map

- `src/lib/engine/` — prompt engine (OpenAI + Gemini clients, CRAFT, clarify loop, deep rewrite).
- `src/lib/detector/` — AI detection (deterministic signals + Gemini explanation).
- `src/lib/db/` — Supabase data access: `sessions`, `usage`, `api-tokens`.
- `src/lib/{paddle,limits,rate-limit,tokens}.ts` — billing, quotas, throttling, token counting.
- `src/app/(marketing|app|auth|legal)/` — route groups. `blog/`, `detector/`, `playground/`, `prompts/`, `tools/`, `extension/`.
- `src/app/api/` — anon analyze, detector, billing, webhooks/paddle, extension token, cron, email.
- `extension/` — browser extension source (v0.5.0). Also versioned zips on the Desktop.

## Commands

- `npm run dev` — local dev. `npm run build` — production build (real verification).
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
