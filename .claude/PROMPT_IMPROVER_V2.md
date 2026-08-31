# Prompt Improver v2 — What Changed and How It Works

> **Partly historical. Read `decisions/0005-no-invented-numbers.md` first.**
>
> Three things this document describes were deleted after it was written:
> the clarity score, Deep Rewrite, and the weekly insights report. Anything
> below about scoring, "Deep Rewrite (Pro)", or the score-based pricing table
> is no longer true. The rest, the staged pipeline, one-question-or-none,
> interpretation forks, the already-good path, and prove-it verification,
> still describes the engine.

Plain-English guide to the new Prompt Improver. Written so anyone on the team
can understand it, not just engineers.

---

## The big idea

**Before:** we took your prompt and rewrote it. That's the same thing you get
for free if you paste your prompt into ChatGPT. No reason to come back.

**Now:** we act like an expert who reads your prompt, tells you what's missing,
shows you what will go wrong if you run it as-is, and then rewrites it — and can
even prove the new version is better by running both. That's something ChatGPT
does not do for you.

---

## What happens when you improve a prompt (step by step)

1. **We read and score it.** We figure out what kind of task it is (writing,
   coding, marketing, research, and so on) and grade it against what a *good*
   prompt for that task needs.

2. **We ask ONE smart question — only if we truly need to.** If your prompt
   could mean two or three different things, we show you those readings as
   buttons you can click. No more generic "who is your target audience?" It's
   always specific to what you actually wrote. If your prompt is clear, we skip
   the question entirely.

3. **We show what's missing, using your own words.** Each point quotes the exact
   part of your prompt that's weak, in simple language.

4. **We predict what will go wrong.** A short "run as-is, this is what happens"
   list. For example: *"It will pick a length for you — probably ~800 words of
   overview."*

5. **We give you two rewrites, not one:**
   - **Full rewrite** — the expert version, rebuilt properly.
   - **Minimal edit** — your own wording, only the gaps fixed. For people who
     want their prompt, just patched.

6. **We give you a reusable template.** The rewrite with `{blanks}` you can fill
   in next time — so you don't start from zero again.

7. **(Optional) We prove it.** Click "Prove it: run both prompts" and we run your
   original and the improved version on a real AI model, side by side, so you can
   *see* the difference.

---

## The honest "already good" path

If your prompt is already strong, we **say so** and don't rewrite it into noise.
We give 1–2 small optional tweaks instead — and **it doesn't cost you a credit.**
We only charge for rewrites we actually do. This is on purpose: it's what makes
the score trustworthy on every other prompt.

---

## Pro-only: Deep Rewrite

When a Pro user turns on **Deep Rewrite**, a second expert pass attacks the first
draft, finds its weak spots, and fixes them — and **you see what it caught.**
Watching an expert tear apart a good draft is the paid-tier "wow" moment.

---

## Before vs After

| Area | Before | After |
|---|---|---|
| **Core value** | Rewrote your prompt (same as ChatGPT) | Diagnoses, predicts failures, and proves improvement |
| **AI model** | One cheap, older model (gpt-4.1-nano) | Current-generation models, right-sized per step |
| **Questions** | Often generic ("who is your audience?"), same regardless of prompt | Specific readings of *your* prompt, as one-click buttons — or no question if it's clear |
| **Answering a question** | Type free text | Click an option (typing still allowed) |
| **Scoring** | One vague number you couldn't trust | Graded on real dimensions, each pointing to your exact words |
| **Failure warning** | None | "Run as-is, here's what goes wrong" predictions |
| **Rewrites given** | One | Two (full rewrite + minimal edit) |
| **Reusable template** | None | Yes — a `{fill-in-the-blank}` version |
| **Proof it's better** | "Trust us" | Run both prompts on a real model, side by side |
| **Already-good prompts** | Always rewritten anyway | Told honestly, no credit charged |
| **Deep Rewrite (Pro)** | Fake — "critique yourself" hidden in one call | Real second pass; the critique is shown to you |
| **Language level** | Expert/jargon tone | Plain English, understandable at a medium level |
| **Quality testing** | None (no way to know if changes helped) | Automated test suite scores every change |

---

## Free vs Pro — limits

| Feature | Free | Pro |
|---|---|---|
| **Prompt improvements** | 5 every 48 hours | Unlimited |
| **"Already good" verdicts** | Free (no credit used) | Free (no credit used) |
| **Two rewrites + template** | Yes | Yes |
| **Deep Rewrite** (2nd expert pass, visible critique) | No | Yes — up to 100 per month |
| **Prove-it verification runs** | 3 total (lifetime taste) | 100 per month |
| **History kept** | 7 days | Forever |

**Anonymous visitors** (not signed in) get 1 free try, then a sign-in prompt.

---

## Pricing

- **Pro:** $9.99/month list price, **$4.99/month** launch promo (or ~$3.99/month
  billed yearly).
- Free stays free. The 5-improvements-per-48-hours limit is unchanged.

---

## Why this is worth paying for (and coming back to)

- You learn something every time — a way your prompt could be misread, and a
  concrete problem it would have caused. ChatGPT gives you none of that.
- You leave with a **reusable template**, not a one-time answer.
- You can **see the proof** instead of taking our word for it.
- The whole thing feels like it *understands* you, because the questions are
  built from your actual prompt — never a checklist.

---

## Small UX details we fixed

- The rewrite types out once when it arrives. Switching between "Full rewrite"
  and "Minimal edit" now shows instantly — no slow re-typing of text you've
  already seen.
- We no longer show the AI model name in results — users don't need it.
- All questions and options use plain, simple English, with no business or
  technical jargon.

---

## For engineers (quick pointers)

- Engine lives in `src/lib/engine/` — staged pipeline behind `analyzePrompt()`:
  `diagnose.ts` → `rewrite.ts` → `critic.ts` (Pro), plus `verify.ts`.
- Model choices are all in `models.ts` (one place to upgrade).
- Per-task grading rules ("the moat") are in `rubrics.ts`.
- Quotas/limits in `src/lib/limits.ts`.
- Quality gate: `npx tsx src/lib/engine/eval.ts` — run before and after any
  engine or prompt change. It scores intent accuracy, question quality, and
  rewrite quality against a golden set and fails if quality drops.
- Full architecture map: `.claude/architecture/prompt-engine.md`.
- **Action items for launch:** run migration `006_engine_v2.sql` in Supabase,
  and confirm the Paddle dashboard monthly price is $4.99 (code now says 499¢).
