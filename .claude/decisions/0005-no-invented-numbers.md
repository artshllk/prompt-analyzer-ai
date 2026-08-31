# 0005 — No invented numbers in the product

## Context

The product showed a clarity score: "Clarity 22 → 87". It looked like a
measurement. It was not one.

- `scoreBeforeImprovement` was produced by the diagnose model.
- `clarityScoreAfter` was produced by the **rewrite model, scoring its own
  rewrite**, with a prompt that told it "do not flatter your own work".
- The famous 22 → 87 on the homepage was hardcoded fiction in
  `components/marketing/refinement/scenarios.ts`.

It was also broken. `recordExtensionSession()` writes both score columns as
NULL on every session the shipping path creates. That meant:

- `statusOf()` could never return `improved`, so every session chip in History
  and Dashboard eventually read "Abandoned".
- The Dashboard's "Average clarity" and "Average lift" cards were always empty.
- The weekly report email's subject line always said "+0 clarity".

Deep Rewrite had a different problem: it worked, it was Pro-gated, and **no
client ever sent `deep: true`**. Its quota helpers had zero call sites. No
paying customer could reach a feature the pricing page sold.

## Decision

**No number is shown to a user unless it is countable and checkable.**

- The clarity score is deleted from every surface: engine result types, the
  rewrite schema and system prompt, the DB mappers, History, Dashboard, the
  demo, the hero animation, the win-back email, and the VS Code client.
- Deep Rewrite is deleted outright, not parked. `critic.ts`, `CRITIC_SCHEMA`,
  the `deep` flag, the 402 gate and the two blog posts are gone.
- The weekly insights report, both the Monday email and the in-app `/insights`
  page, is deleted. Both were built on the same scores.

## What stays

The **diagnostic score stays internal**, in `diag.score`. It gates two
decisions inside `lib/engine/index.ts` and never leaves the file: whether the
prompt is already good enough to leave alone, and whether we are unsure enough
to ask a question (`DIRECT_IMPROVE_THRESHOLD`). Nothing renders it.

`prompt_sessions.clarity_score_before/after` are retained in the database and
no longer read or written. They hold real historical rows; dropping them would
destroy that for nothing. See the note on `PromptSessionRow`.

## The replacement

Not a different score. A count: **"N added, M of them guesses."** It is
checkable because the user can see each added constraint labelled in the
rewrite and remove any of them. Count constraints, not text spans.

## Do not

- Do not reintroduce a clarity score, a percentage, or a 0-100 quality rating
  anywhere a user can see it.
- Do not sell a feature on the pricing page that no client can reach. That is
  what made Deep Rewrite a problem rather than merely unused.
