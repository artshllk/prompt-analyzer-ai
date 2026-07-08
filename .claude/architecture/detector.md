# AI detector

Where: `src/lib/detector/`. Entry point: `index.ts` (its header comment is the
source of truth). See also `.claude/decisions/0002-detector-no-percentage.md`.

## The core principle

Deterministic signals decide the verdict. The LLM only explains it. **Never a
percentage.** This is a product decision, not an implementation detail — do not
change it without an explicit call.

## Pipeline

1. **Compute signals** (`signals.ts`) — pure math on the text. No model involved.
2. **Combine into a verdict band** deterministically: `likely-human` / `mixed` /
   `likely-ai`, plus a confidence *label* (`low` / `moderate` / `high`). See
   `computeLeans` and `verdictFromLeans` in `signals.ts`.
3. **Gemini writes the explanation** (`callGemini`) — 1 to 3 short sentences in
   plain language, referencing the actual signal values. The LLM is a commentator
   on data we computed, not a judge of the text. Its output is only prose plus
   per-signal notes (`signalNotes`); it never sets the band.

Because the band is deterministic, it is stable and reproducible. Only the prose
can vary between runs.

## The signals (`signals.ts`)

- **Burstiness** — variation in sentence length (stddev, and coefficient of
  variation). Humans mix long and short; AI is more even. Low burstiness leans AI.
- **Em/en-dash rate** per 100 words — heavy use is a strong AI signal.
- **Transition-word rate** per 100 words — heavy use leans AI.
- **AI-cliché score** — weighted count of cliché phrases (`cliches.ts`).

Signals are reported openly to the user, alongside a disclaimer. The honesty is the
point (it matches what the blog teaches about detectors).

## Result shape (`DetectorResult`)

`band`, `confidenceLabel`, `reasoning` (the prose), `disclaimer`, `signals`,
`signalNotes`. There is deliberately no numeric score field.

## Files

- `index.ts` — orchestrator. `signals.ts` — the math. `model-score.ts` — model lean.
- `cliches.ts` — cliché phrase list/weights. `sentences.ts` — sentence splitting.
- `eval.ts` + `__fixtures__/` — evaluation harness and test fixtures.
