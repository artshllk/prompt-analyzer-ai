# 0002 — The detector never reports a percentage

## Context

Most AI detectors output a single number like "94% AI". That number is a false
promise: it looks precise but is really a guess, and it invites people to treat it
as proof. Deepclario's detector is built to be honest instead.

## Decision

The detector **never reports a numeric percentage.** Instead:

- Deterministic statistical signals are computed from the text (pure math):
  burstiness, sentence-length variation, em/en-dash rate, transition-word rate,
  weighted AI-cliché score. See `src/lib/detector/signals.ts`.
- Those signals combine **deterministically** into a verdict band
  (likely-human / mixed / likely-ai) and a qualitative confidence **label**
  (low / moderate / high). See `verdictFromLeans` in `signals.ts`.
- The LLM (Gemini) is a **commentator, not a judge.** It only writes a short,
  plain-English explanation of *why*, given the actual signal values. It never
  decides the band and never produces a score.

See `src/lib/detector/index.ts` (its header comment states this clearly) and
`.claude/architecture/detector.md`.

## Why

- **Reproducibility:** the band is stable because it comes from math, not from a
  model that varies run to run. Only the prose explanation can differ.
- **Honesty and brand:** reporting signals openly, with a label and a disclaimer,
  matches Deepclario's editorial, transparency-over-magic stance. It also matches
  what the blog teaches (a detector is a "texture meter", not proof).
- **Defensible:** a false "94%" can wrongly accuse a real person. A band plus a
  disclaimer plus visible signals invites judgment, not blind trust.

## Do not

Do not add a percentage output, and do not let the LLM decide the verdict. If a
feature seems to need a number, surface the underlying signals instead.
