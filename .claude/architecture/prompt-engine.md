# Prompt engine (v2 - diagnostic pipeline)

Where: `src/lib/engine/`. Entry point: `analyzePrompt()` in `index.ts`.
The file-header comments in each stage module are the source of truth; read them
before changing engine behavior. This doc is the map.

## What it does

A staged diagnostic pipeline, not a single rewrite call:

1. **diagnose.ts** (gpt-5.4-mini) - intent triage (9 classes), interpretation
   forks, rubric audit with evidence spans, failure forecast, already-good check.
2. **rewrite.ts** (mini for free, Gemini 3.5 Flash for Pro) - minimal edit +
   full restructure + reusable `{variable}` template.
3. **critic.ts** (Gemini, Pro Deep only) - real second call that attacks the
   draft; the critique is returned and SHOWN to the user.
4. **verify.ts** (used by `/api/prompts/verify`) - runs original vs improved on
   a real model, side-by-side outputs + a one-line contrast. Metered.

Model assignments live in **models.ts** - the only place model upgrades happen.
Rubrics (the curated per-intent knowledge) live in **rubrics.ts**.

## Result types

`AnalyzeResult` (types/index.ts) is a 3-way union: `clarifying` (with fork
`options` for one-click answers), `improved` (with `minimalEdit`, `template`,
`audit`, `critique`, `intent`), and `already_good` (honest no-rewrite path -
routes do NOT charge quota for it).

## Key rules baked into the engine

- **Questions only exist as interpretation forks.** The diagnose stage may ask
  only when 2+ concrete readings of the prompt would produce substantively
  different rewrites; the user answers by clicking a fork. Generic interview
  questions and junk-answer handling are gone by construction.
- **Clarify loop hard-capped at 2 turns** (`MAX_CLARIFY_TURNS` in index.ts).
- **Direct-improve threshold** (`DIRECT_IMPROVE_THRESHOLD = 75`) enforced in
  code, not left to the model.
- **Tone rules** live in rewrite.ts (`TONE_RULES`).

## Providers (not Anthropic)

- **OpenAI** via `openai-client.ts`. gpt-5.x models need
  `max_completion_tokens` + default temperature; the client handles this and
  adds 2x headroom for hidden reasoning tokens (else: empty content).
- **Gemini** via `gemini-client.ts` (cascade in models.ts `GEMINI_CASCADE`).
  Thinking tokens count against `maxOutputTokens`; the client adds headroom
  (else: truncated JSON, parse_failed). Pro rewrite/critic fall back to OpenAI
  mini if the whole cascade fails.
- `analyzePrompt()` is pure and portable (no Next/Supabase/HTTP). Provider
  calls are the only external seam.

## Eval harness (the regression gate)

`npx tsx src/lib/engine/eval.ts` - runs `__fixtures__/golden.ts` (16 cases
across intents) through the live pipeline; checks intent accuracy, ask/improve
decisions, already-good detection, and LLM-judge scores for question
groundedness and rewrite quality. Run it before and after ANY engine or prompt
change; it exits 1 below thresholds. Costs a few cents. Add a golden case
whenever a real session surprises the engine.

## Quota surface (see limits.ts)

Standard improvements: 5/48h free, unlimited Pro. Deep (critic pass): Pro,
100 / rolling 30d. Verification runs: Pro 100 / rolling 30d, free 3 lifetime
credits. `already_good` results are never charged.

## When editing

- Keep `analyzePrompt()` portable - do not add Next/Supabase/HTTP imports.
  New clients depend on that purity (see `roadmap.md`).
- Provider swaps go through `callLLM` / `callGemini`, not scattered per stage.
- Run the eval before shipping. If it fails, the change regressed the product.
