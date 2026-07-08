# Workflow: ship a change

The default loop for any code or content change. Keeps commits clean and every
commit build-valid.

## 1. Branch

- Work on a branch off `main`. Never commit directly to `main`.
- Name it for the change: `feat/...`, `content/...`, `fix/...`.

## 2. Make the change

- Match surrounding code style and comment density (see `conventions.md`).
- Keep `analyzePrompt()` portable; keep the detector percentage-free; keep billing
  on Paddle. (The three easy-to-break invariants — see `decisions/`.)

## 3. Verify (typecheck is not enough)

- `npx tsc --noEmit` — necessary, not sufficient.
- `npm run build` — the real check that it compiles and prerenders.
- Or drive the affected flow. For blog changes, run `/verify-blog`.
- Fix anything the build reports before committing.

## 4. Commit

- Under Art's name only: `Art Shllaku <artshllaku48@gmail.com>`.
- **Never** add a `Co-Authored-By: Claude` trailer.
- Clear message; group related work into logical commits.
- Commit/push only when Art asks, or when he says "ship it" / "commit it".

## 5. PR

- Push the branch, open a PR against `main` with `gh`.
- PR body: what changed, why, and how it was verified.
- Prefer `git revert` over rewriting history if something needs undoing.

## 6. After merge

- Sync local `main`.
- If the change touched something in `.claude/decisions/` scope (a real
  architectural or product choice), add or update a decision record.
