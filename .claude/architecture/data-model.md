# Data model

Store: **Supabase (Postgres)**. Access goes through `src/lib/db/` and the Supabase
clients in `src/lib/supabase/`. Row Level Security uses `auth.uid()`; the auth
session is a normal Supabase session (see `auth.md`).

## Tables (referenced in `src/lib/db/`)

- `profiles` — user profile / plan state.
- `prompt_sessions` — a prompt-improvement session (`db/sessions.ts`).
- `prompt_improvements` — the rewrites produced in a session.
- `clarification_exchanges` — the clarify-loop question/answer turns.
- `usage_events` — usage records that drive quotas (`db/usage.ts`).
- `api_tokens` — the `dc_` bearer tokens for the extension / external clients
  (`db/api-tokens.ts`, with `validateToken` / `extractBearerToken`).

## Data access files

- `db/sessions.ts` — create/read prompt sessions and their improvements.
- `db/usage.ts` — record and count usage for rate/quota checks.
- `db/api-tokens.ts` — issue and validate `dc_` tokens; used by `/api/anon/analyze`
  and `/api/extension/issue-token`.

## Notes

- Quotas: `lib/limits.ts` defines the numbers; `lib/rate-limit.ts` does the throttling
  (in-memory today — flagged to move to Redis/Upstash before a big launch; see roadmap).
- Anonymous analyze calls do **not** write to the DB; only authenticated/token calls do.
- When changing a table shape, update the types in `@/types/database` too.
