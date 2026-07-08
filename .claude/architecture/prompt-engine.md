# Prompt engine

Where: `src/lib/engine/`. Entry point: `analyzePrompt()` in `index.ts`.
The file-header comments in `index.ts` are the source of truth; read them before
changing engine behavior. This doc is the map.

## What it does

Takes a rough prompt, scores it, optionally asks up to a few clarifying questions,
then returns an improved prompt built on the CRAFT framework
(Context, Role, Action, Format, Tone).

## Providers (not Anthropic)

- **OpenAI** via `openai-client.ts`. Default model `gpt-4.1-nano` (cheap, fast).
- **Gemini** via `gemini-client.ts`. Also used by the detector for explanations.
- `analyzePrompt()` is pure and portable (no Next/Supabase/HTTP). Provider calls
  are the only external seam.

## Key rules baked into the engine

- **Clarify loop is hard-capped at 3 turns** (`MAX_CLARIFY_TURNS`). Each question is
  a gate the user can abandon, so the model is biased toward shipping a strong
  rewrite as soon as it has enough context.
- **Junk-answer detection.** If a clarification answer is junk ("blablabla", a single
  random word, "idk"), it must add zero confidence, so an impatient user does not get
  a worse rewrite than they would have with no clarifications. See the JUNK-ANSWER
  section in `index.ts`.
- **Direct-improve threshold** (`DIRECT_IMPROVE_THRESHOLD = 75`): a strong-enough
  prompt skips clarification and goes straight to rewrite.
- **Tone rules**: `friendly`, `professional`, `persuasive`, `concise`, `creative`,
  each with an explicit style rule (`TONE_RULES`).

## Deep rewrite (Pro tier)

- Model `gpt-4.1-mini` (`DEEP_MODEL`), `DEEP_MAX_OUTPUT_TOKENS = 1400`.
- Runs an explicit draft → critique → refine pass before answering. Costs more per
  call and runs a little slower; that is the paid quality tier.
- Gated to validated Pro tokens on `/api/anon/analyze`.

## Schemas

Structured output schemas live in `schemas.ts` (e.g. `STEP_SCHEMA`). Types come
from `@/types` and `@/types/database`.

## When editing

- Keep `analyzePrompt()` portable — do not add Next/Supabase/HTTP imports to it.
  New clients depend on that purity (see `roadmap.md`).
- Provider swaps go through `callLLM` / `callGemini`, not scattered across the file.
