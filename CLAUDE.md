@AGENTS.md

# Deepclario — project guide

This file is the always-loaded map. Keep it short. Deeper knowledge lives in
`.claude/` and is read on demand. When something here needs more detail, follow
the pointer instead of expanding this file.

## What Deepclario is

Pivoting. One product being built, two frozen or secondary.

- **Fact checker (being built).** Paste a document, get every checkable claim
  marked verified, unverifiable or contradicted, plus a report you can attach
  when you send the work on. `/check`. The governing rule is that a false
  "contradicted" kills the product: absence of evidence is always
  unverifiable, never contradicted.
- **AI text detector** — reports the signals that say text reads as AI-written.
  Never a percentage. `/detector`.
- **Prompt improver — FROZEN.** See the section below. Still works at
  `/playground`, off the nav, not being developed.
- **Token counter** — counts tokens (`gpt-tokenizer`). Logic exists, no page.

Backed by a large SEO blog (`/blog`, 56 posts) and a free prompt library
(`/prompts`). Note the blog is entirely prompt-engineering content, so it
feeds the frozen product and not the new one: do not count it as distribution
for the fact checker. Audience is smart but non-technical. Pre-revenue. Live at
deepclario.com. Two-person team: Art Shllaku, Agon.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase
(DB + auth) · Paddle (billing) · Vercel (host) · Resend (email) · Sentry.
Prompt engine calls **OpenAI + Gemini**. Detector explanations use **Gemini**.

## THE PROMPT IMPROVER IS FROZEN

**No changes, no features, no extension work, without an explicit decision to
revisit it.** That includes `src/lib/engine/`, `src/components/marketing/DemoChat.tsx`,
`/playground`, `/api/anon/{analyze,sharpen,fork,explain,verify}` and all of
`extension/`.

Why: no prompt improver has public individual-paid revenue, a near identical
Show HN in April 2026 drew 23 points and no demand signal, and 90 days of
Search Console showed 31 clicks on 5,360 impressions at average position 29.9,
with every top query being someone learning about prompts or hunting a free
scoring tool. Those people do not buy.

It is frozen, not deleted. It still works at `/playground`, and it stays there
because 48 links across 42 files point at it, including one inside an email
already delivered (`lib/email/templates.ts:169`). No code change reaches an
inbox. Moving or redirecting the route breaks those links and gains nothing.

It is off the nav and off the footer. Its anonymous ceiling is its own budget
bucket, set low, so a legacy page cannot cost real money or starve the current
product.

## Load-bearing facts (do not get these wrong)

These are verified from code and get re-derived or mistaken every session.

- **Billing is Paddle, not Stripe.** `lib/paddle.ts` is wired to checkout/portal
  and `webhooks/paddle`. `lib/stripe.ts` is imported nowhere — legacy/dead. See
  `.claude/decisions/0001-paddle-over-stripe.md`.
- **The detector never reports a percentage.** Deterministic signals compute the
  verdict band; the LLM only writes the plain-English explanation. It reports
  signals openly and a confidence _label_, never "94% AI". See
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
- **Source checker limits: 2 a day anonymous per IP, 10 a day signed in, plus
  the global daily bucket.** The signed-in count lives in `usage_events` as
  `factcheck_run` (no new table). The anonymous one is in-memory and BEST
  EFFORT, since serverless instances recycle; the global bucket in
  `anon-budget.ts` is what actually bounds the bill and it fails closed. Before
  this, a signed-in caller had no per-user ceiling at all.
- **Pro is $4.99/mo right now, a launch discount from $9.99 (Paddle).** The
  launch flag is `LAUNCH` in `components/marketing/EditorialPricing.tsx`; Paddle
  charges 499¢ (`lib/paddle.ts`). Free tier: 10 improvements per rolling 24h
  (`USAGE_DAILY_LIMIT`), 5 detections per 24h, 7-day history (`lib/limits.ts`).
  Anything saying 25-a-month or a flat $9.99 is stale.
- **Auth: Google Identity Services + `signInWithIdToken`**, not Supabase OAuth
  redirect — so the consent screen shows Deepclario, never supabase.co. See
  `.claude/decisions/0003-auth-gis-no-supabase-co.md`.
- **Design is paper and markup, light only.** Warm paper ground, ink text, one
  brand red, and three meaning colours that are never decoration: `--machine`
  blue, `--guess` amber, `--confirm` green. There is no dark mode and none is
  planned. See `.claude/decisions/0006-paper-and-markup.md`, which supersedes
  0004. Any doc still saying "editorial dark" is stale.
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

## What happens when Supabase is down

The three gates fail in different directions, on purpose, and the combination
has a hole in it. Written down because it is not visible from any one file.

| Gate | On a DB error | Why |
|---|---|---|
| Anonymous daily cap | **closed** | The model still bills. A limiter a script walks past is not a cost control. |
| Signed-in free quota | **open** | Locking out a real user over our own infrastructure is worse than one extra rewrite. |
| `analyzePrompt()` | unaffected | It has no DB access at all. Verified: zero supabase/db/next imports across its whole graph. |

So an outage refuses anonymous visitors and leaves signed-in users uncapped.

**The hole.** `resolveCaller()` reads `tier` from `profiles`, and
`validateToken()` reads `api_tokens` then `profiles`. **Tier cannot be known
without Postgres on either path.** Worse, `tier: profile?.tier ?? 'free'`
makes a failed read indistinguishable from a genuine free account, so during a
Postgres-only outage (Auth up, Postgres down) every signed-in caller resolves
as free, the quota check fails open, and they are uncapped. Sign-up needs
Auth, not Postgres, so in that specific failure someone can still create an
account and walk straight through.

**"Free fails closed, only Pro fails open" is therefore not implementable
today.** During the outage there is no way to tell Pro from free.

**Fixed.** `resolveCaller()` now returns three states, not two: `anonymous`,
`known`, and `unknown`. `unknown` means we proved who they are and could not
read their entitlement, and it is refused with a 503 `identity_unavailable`
and an honest message. Never a 402: a quota response would blame the user for
our outage and push them toward paying to fix something upgrading would not
fix. `validateToken` carries `tier: null` for the same case rather than
`?? 'free'`.

Anonymous stays anonymous, because that path already fails closed.

## When we have paying customers

The fix above costs Pro users their service during a Supabase outage. That is
free today because there are zero Pro users. It stops being free the moment
there is one, and this is the note for that day.

**The design that actually works: put `tier` in the access token.** Supabase
supports a custom access token hook that embeds claims in the signed JWT.
Tier then becomes verifiable with no database at all, so during an outage Pro
can be let through while free and anonymous fail closed, which is the version
of this that everyone wants.

**Do not reach for it without solving the stale-claim problem first.** A JWT
carries whatever was true when it was issued. Someone who upgrades is still
holding a token that says `free` until it refreshes, so they pay and then keep
hitting the free limit. That bug lands on the first person who ever pays, which
is the worst possible moment for it. Any version of this needs a forced token
refresh on the Paddle webhook, and a fallback that re-reads the database when a
token says `free` but the request is behaving like Pro. Both are more work than
the hook itself.

Until then, option 1 stands: unknown is refused, and Pro takes the outage with
everyone else.

## Deferred: streaming the claim extraction

`/check` streams its CITATION checks one claim at a time, but extraction is
still a single blocking call over the whole document, about **7.5 seconds**
before anything appears. During it the page shows the user's own pasted text in
the reading view under "Reading your document", so the wait is a page waiting
to be marked up rather than a spinner.

Streaming extraction would drop the perceived wait to roughly **1 second**.
It is deliberately NOT built, and this is the note for the day it is.

**Why it was deferred.** It is not strictly better. Claims can only be counted
once extraction finishes, so the citation-density banner would move from first
position to last, and that banner is the thing that stops a low-citation
document reading as a broken tool. Losing it costs more than 6.5 seconds gains.
It also touches `streamLLM` in the shared engine client, which the frozen
prompt improver uses, and nobody has used the fact checker yet.

**Build it when a real user mentions the wait, or when latency shows up in the
counters.** Not before.

**How it would work.** `callLLM` already builds the `response_format` block, so
adding schema support to `streamLLM` is about five lines. The work is a partial
JSON scanner that pulls balanced `{...}` objects out of the growing `claims`
array as tokens arrive, tracking brace depth while respecting strings and
escapes. `segments.ts` is the same shape and already has a 3,000-iteration fuzz
test to copy.

**Three things that will bite, in order of how quietly they fail:**

1. **Truncated tails under `strict: false`.** Structured Outputs are not strict
   here, so a run can end mid-object. The scanner must emit what closed and
   drop the rest, never throw. Same rule as the marker parser: malformed model
   output degrades to clean output, never to visible junk.
2. **The 20-claim cap must be enforced as objects arrive**, not on a finished
   array. `MAX_CLAIMS_PER_DOC` is a cost control on model-controlled input, and
   a streaming reader that only checks the total at the end has already paid
   for claim 200.
3. **The density banner ordering.** `citationDensity()` needs every claim, so a
   streaming extractor cannot show it first. Either hold the banner until the
   stream closes, which is the regression described above, or compute a running
   estimate and accept that the number moves while the reader watches. Neither
   is obviously right, and this is the actual design decision, not the parser.

## A freeze does not cover privacy or security

The prompt improver and the extension are frozen: no features, no changes. That
freeze covers PRODUCT work. It does not cover privacy fixes, security fixes, or
anything that makes a published promise true.

Those land wherever they need to, frozen or not. `src/lib/engine/` is frozen and
its model clients were logging user text; the fix went in without ceremony,
because a leak in shared code is not a feature request.

If a change is needed to keep a promise the site already makes, it is not
covered by the freeze. Make it, and say in the commit why.

## Error reporting must never capture request bodies

`src/lib/observability.ts` is a Sentry wrapper that is wired but INERT:
`@sentry/nextjs` is not installed and `NEXT_PUBLIC_SENTRY_DSN` is not set, so
`captureError()` is a no-op in production today. One env var and one `npm
install` switch it on.

**The FAQ says "we save nothing" about text pasted into the source checker.**
That is a published promise, and it is only true while nothing writes that text
anywhere. Error reporting is the easiest place for it to leak, because a leak
there looks like diagnostics.

**It already happened once.** Both model clients passed a provider error body
into `captureError`, and a provider error body echoes the offending input
straight back (content filters and `invalid_request` both do it). Enabling
Sentry would have shipped users' documents to a third party as "context". Fixed:
they now pass `detailLength`, a number.

If you ever turn it on:

- Pass lengths, status codes, model names and counts. **Never text.**
- Do not enable `sendDefaultPii`, Replay, or any integration that serialises a
  request.
- If you need the body to debug something, reproduce it locally with your own
  input.
- If you decide to capture bodies anyway, **change the FAQ first.** The order
  matters: the promise is already published.

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

## Production database

.env.local points at the production Supabase project and carries a service-role key.
Treat production as READ-ONLY at all times.

- Never INSERT, UPDATE, DELETE or call a mutating RPC against production.
- To check whether a migration landed, use information_schema and pg_constraint.
  Never probe by writing a row.
- Never write a row to "test" something, even if you plan to delete it after.
  The cleanup delete is riskier than the thing it cleans up.
- Migrations are applied by a human in the Supabase SQL Editor. Never by you,
  and never via supabase db push.
- If you believe a write to production is genuinely necessary, stop and ask.
