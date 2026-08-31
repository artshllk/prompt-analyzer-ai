# Deploy runbook: migrations 011 to 014

Written for one deploy. Four migrations, one environment variable, one guard
that has never run in production.

Read the blocker at the bottom before you start. It changes what the cost
guard does to signed-in visitors, and it is a code change, not a migration.

---

## 1. The four migrations at a glance

| | Change | Side of deploy | Destructive | Reversible |
|---|---|---|---|---|
| **014** | Creates `anon_daily_usage` + `bump_anon_runs()` | **BEFORE** (required) | No | Schema yes, counters lost |
| **012** | Widens two CHECK constraints on `extension_events` | BEFORE (recommended) | No | Only after deleting new rows |
| **013** | Widens the same event CHECK again | BEFORE, **after 012** | No | Only after deleting new rows |
| **011** | `DROP COLUMN profiles.email_weekly` | **AFTER** (required) | **Yes** | Schema yes, opt-outs lost |

Order: **014, 012, 013 → deploy → 011.**

---

## 2. Each one in detail

### 014 anon_daily_budget: additive, BEFORE, required

```sql
create table if not exists anon_daily_usage (day date primary key, runs integer not null default 0);
create or replace function bump_anon_runs(p_day date) returns integer ...
```

**Why before.** The new code calls `bump_anon_runs` on every anonymous run, and
the guard **fails closed**. If the function does not exist, `consumeAnonRun()`
returns `allowed: false` and every anonymous visitor gets
`{"error":"daily_capacity"}`. The homepage tool is dead until you apply it.

**Wrong time, early:** nothing. The currently live code never calls this
function. A table and a function sitting unused are harmless.

**Wrong time, late:** every anonymous visitor sees "that is today's free runs
used up" for the entire window between deploy and migration. Signed-in
extension users are unaffected; see the blocker for web users.

**Reversible:** `drop function bump_anon_runs(date); drop table anon_daily_usage;`
You lose the daily counters, which are low value. Do not do this while the new
code is live, because that puts you straight back into the fail-closed state.

### 012 silence_rate: additive, BEFORE, run this one before 013

Drops and re-adds `extension_events_event_check` (adding `question_none`) and
`extension_events_surface_check` (adding `'web'`).

**Why before.** Harmless either way, but applied late the new code sends
`question_none` and `surface: 'web'`, the constraint rejects the insert, and
`/api/anon/event` swallows it because that route always returns 204 by design.
You lose the counters silently and nothing tells you.

**012 is the only migration that widens `surface_check`.** Skip it and every
counter from the website fails, because `lib/track.ts` sends `surface: 'web'`.
013 does not fix this.

**Wrong time, early:** nothing. Old code never sends those values.

**Reversible:** re-add the narrower constraint, but the `ALTER` fails if rows
already exist with the new values. Delete them first.

### 013 funnel_counters: additive, BEFORE, must run AFTER 012

Drops and re-adds `extension_events_event_check` with four more events:
`tool_run`, `tool_run_repeat`, `compare_clicked`, `compare_completed`.

**ORDER HAZARD.** 012 and 013 both rebuild the same constraint, and 013's list
is a strict superset of 012's. Run them out of order and 012 will narrow the
constraint back, silently dropping the four funnel events. There is no error:
the inserts just start failing and the route keeps returning 204.

**Run 012, then 013.** If you already ran them backwards, re-run 013 on its
own and then re-run only the `surface_check` half of 012.

**Wrong time, late:** funnel counters are lost until applied. Nothing breaks.

### 011 remove_weekly_report: DESTRUCTIVE, AFTER, required

```sql
ALTER TABLE profiles DROP COLUMN IF EXISTS email_weekly;
```

**Why after.** The code live right now reads and writes this column:
`api/cron/emails/route.ts:50` selects it, `:132` gates the weekly send on it,
and `api/email/unsubscribe/route.ts:27` writes it. Drop it first and the daily
cron throws on its next run and the weekly unsubscribe link 500s.

**Wrong time, early:** the cron breaks for every email type, not just weekly.
Welcome, activation nudge, tips and win-back all go through the same query.

**Wrong time, late:** nothing. The new code never touches the column, and
nothing inserts into `profiles` directly, so a leftover `NOT NULL DEFAULT TRUE`
column is inert. **This one can wait as long as you like.** If you are nervous,
deploy, watch for a day, then drop it.

**Reversible:** `ALTER TABLE profiles ADD COLUMN email_weekly BOOLEAN NOT NULL DEFAULT TRUE;`
restores the schema but not the data. Anyone who had opted out of the weekly
report comes back as opted in, to a feature that no longer exists and no
longer sends. Harmless in practice, but it is a real one-way door on that
preference, which is why it is the only migration marked destructive.

---

## 3. ANON_DAILY_GLOBAL_CAP

**Where.** Vercel dashboard → your project → Settings → Environment Variables →
add `ANON_DAILY_GLOBAL_CAP`, scope **Production**. Or:

```
vercel env add ANON_DAILY_GLOBAL_CAP production
```

Server-only, so no `NEXT_PUBLIC_` prefix. Read per request in
`anonDailyCap()`. **Vercel applies env changes to new deployments only, so
redeploy after setting it.**

**If it is missing: nothing breaks.** It falls back to 500 a day. Missing is a
safe default, not a failure.

**The values that surprise people.** Anything not a positive finite number
falls back to 500. That includes `0`, `-5`, `""` and `abc`. Verified:

```
(unset) -> 500     "0"  -> 500     "1"   -> 1
""      -> 500     "-5" -> 500     "150" -> 150
"abc"   -> 500     "2.7"-> 2       "500" -> 500
```

**You cannot switch the tool off by setting this to 0.** It silently becomes
500. To stop anonymous runs entirely you would need a code change.

**Recommended: 150.**

`models.ts` puts a full free session (diagnose plus rewrite) at $0.01 to $0.02.

| Cap | Worst case per day | Worst case per month |
|---|---|---|
| 150 | $1.50 to $3 | $45 to $90 |
| 500 (default) | $5 to $10 | $150 to $300 |

500 is a lot of exposure for something pre-revenue. 150 is still far above the
real traffic of a site with 11 extension users, and it is one dashboard edit to
raise once you can see the number. Check what you are actually using:

```sql
select day, runs from anon_daily_usage order by day desc limit 14;
```

If you are regularly above 100, raise it. If you are under 20, you could lower
it further.

---

## 4. Testing the cost guard

**Read this first.** The counter is global and shared. Every test run consumes
production budget for that UTC day, and if you set the cap to 1 *in production*
you block every anonymous visitor until midnight UTC. Test locally against the
same database, and reset the row afterwards.

`.env.local` already points at the hosted Supabase project, so a local server
exercises the real table with no deploy and no risk of leaving `cap=1` live.

### Before you start

```sql
-- 1. Confirm 014 landed.
select to_regclass('public.anon_daily_usage');            -- expect: anon_daily_usage
select proname from pg_proc where proname = 'bump_anon_runs';  -- expect: one row

-- 2. Note where the counter is now, so you can put it back.
select * from anon_daily_usage where day = (now() at time zone 'utc')::date;
```

### Run the test

```bash
cd /Users/artshllaku/Desktop/ai-project
npm run build
ANON_DAILY_GLOBAL_CAP=1 PORT=3000 npm run start
```

The inline variable overrides `.env.local` for this process only. Nothing about
production changes.

**Run 1, expect 200 and a real rewrite:**

```bash
curl -s -o /dev/null -w 'run 1: %{http_code}\n' -X POST http://localhost:3000/api/anon/analyze \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"write a launch email for my app","tone":"professional"}'
```

**Run 2, expect 429 and the named error:**

```bash
curl -s -w '\nrun 2: %{http_code}\n' -X POST http://localhost:3000/api/anon/analyze \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"write a cover letter","tone":"professional"}'
# expect: {"error":"daily_capacity","resetAt":"...T00:00:00.000Z"}  429
```

**Run 3, the graceful state, which is the point of the test.** Open
`http://localhost:3000` in a browser, type anything, press send. You should get
"That is today's free runs used up, across everyone", an explanation that it
resets at midnight UTC, and a "Create a free account" button. You should not
get an error, a spinner that never ends, or a blank panel.

**Confirm the fail-closed path too.** Stop the server, point
`SUPABASE_SERVICE_ROLE_KEY` at something invalid, restart, and try once. You
should get the same graceful "back tomorrow" state rather than a 500. This is
the branch that runs if Supabase is ever unreachable, and it is the reason the
guard fails closed.

**Signed-in bypass: see the blocker below. This currently does not work on the
web, and the test will fail.** For the extension path, with a `dc_` token from
`/extension/connect`:

```bash
curl -s -o /dev/null -w 'bearer: %{http_code}\n' -X POST http://localhost:3000/api/anon/analyze \
  -H 'Content-Type: application/json' -H "Authorization: Bearer dc_YOUR_TOKEN" \
  -d '{"prompt":"write a launch email","tone":"professional"}'
# expect: 200, because the cap is only consumed on the anonymous branch
```

### Clean up, every time

```sql
-- Put the counter back where you found it, or clear the day entirely.
delete from anon_daily_usage where day = (now() at time zone 'utc')::date;
```

Then stop the local server. There is nothing to unset: the cap override only
ever existed in that one process.

---

## 5. Blocker: signed-in web visitors are not exempt from the cap

Found while writing this runbook. It is a code change, not a migration, and it
is not fixed.

`/api/anon/analyze` identifies a caller by `Authorization: Bearer dc_...` and
nothing else. The web tool (`DemoChat`) sends `Content-Type` only, because a
browser session is a Supabase cookie and there is no bearer token to send.

So a signed-in visitor using the homepage tool is **anonymous to that route**:

- They consume the global anonymous budget.
- They are blocked by it when it trips, on the page they are signed into.
- Their free-plan quota is never checked or recorded, because the usage write
  at `route.ts:168` is gated on `if (auth ...)`.
- Their sessions never reach History from the web path.

This was always true, and it did not matter much while the tool was behind a
modal. Putting it in the hero and adding a cap that blocks is what makes it
matter now.

`/api/anon/verify` already has the fix: a `resolveCaller()` helper that tries
the bearer token and falls back to the cookie session. `analyze`, `sharpen` and
`fork` need the same twelve lines.

**Until that lands, expect the "signed-in users are unaffected" test to fail on
the web.** It holds for the extension, which does send a bearer token.

My recommendation is to fix `analyze` before this deploy, since it is small,
already-written-once, and the alternative is shipping a cap that can lock
signed-in users out of your homepage.

---

## 6. The order, one more time

```
1. Apply 014                      (or the hero is dead on arrival)
2. Apply 012                      (surface_check lives only here)
3. Apply 013                      (must follow 012, not precede it)
4. Set ANON_DAILY_GLOBAL_CAP=150  (Production scope)
5. Deploy
6. Smoke test: one anonymous run on the live site, then
   select * from anon_daily_usage;   -- expect runs = 1
7. Apply 011                      (any time after step 5, no rush)
```
