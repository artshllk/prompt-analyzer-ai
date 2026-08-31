# Deploy runbook: migrations 011 to 014

Written for one deploy. Four migrations, one environment variable, one guard
that has never run in production.

Sections 6a to 6c are post-deploy checks, not optional. Two of these
migrations fail silently by design, so "no data" and "wrong constraint" look
identical from the outside.

> **Checked against the live database on 2026-08-31: 012, 013 and 014 are
> already applied. Only 011 is outstanding.**
>
> `bump_anon_runs` resolves, `anon_daily_usage` exists, and an
> `event = 'tool_run'` / `surface = 'web'` insert is accepted, which is only
> possible if both 012 and 013 landed and landed in the right order.
> `profiles.email_weekly` is still present, so 011 has not run.
>
> That removes the two riskiest items from this deploy. 014 is not a
> prerequisite any more, and the 012-before-013 ordering hazard is already
> settled. **Re-run the checks in section 6b anyway**: they cost one query and
> they are the only thing that distinguishes "recording correctly" from
> "silently rejecting everything".

---

## 1. The four migrations at a glance

| | Change | Side of deploy | Destructive | Applied? |
|---|---|---|---|---|
| **014** | Creates `anon_daily_usage` + `bump_anon_runs()` | BEFORE (required) | No | **Already applied** |
| **012** | Widens two CHECK constraints on `extension_events` | BEFORE, before 013 | No | **Already applied** |
| **013** | Widens the same event CHECK again | BEFORE, after 012 | No | **Already applied** |
| **011** | `DROP COLUMN profiles.email_weekly` | **AFTER** (required) | **Yes** | **Outstanding** |

Order as designed: **014, 012, 013, then deploy, then 011.** In practice the
first three are done, so this deploy is: **deploy, then 011 whenever you
like.** The detail below is kept because it is what you need if any of them
has to be re-run or rolled back.

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

**Run 2 must be a SECOND PROMPT, not an answer to the first.** One user action
costs one budget unit, so answering a clarifying question does not spend
another. Use a different prompt:

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

**Run 4, the signed-in bypass. This is the one that used to fail.** The cap is
consumed only on the anonymous branch, so a signed-in visitor should sail past
it while the cap is still set to 1 and the counter is already over.

*Browser, cookie session. This is the path that was broken:*

1. With the server still running on `ANON_DAILY_GLOBAL_CAP=1`, open
   `http://localhost:3000/login` and sign in.
2. Go back to `http://localhost:3000`.
3. Improve a prompt.
4. **Expect a normal rewrite, not "back tomorrow".** If you get the capacity
   message while signed in, `resolveCaller` is not seeing your cookie.
5. Open DevTools, Network tab, find the `analyze` request. It should be `200`,
   and the JSON should carry `"anon": false` and `"tier": "free"` or
   `"tier": "pro"`. `"anon": true` while signed in means the fix is not live.
6. Improve a prompt twice more, then check the quota is now real for you:

```sql
select count(*) from usage_events
where user_id = 'YOUR_USER_ID'
  and event_type = 'prompt_analyzed'
  and created_at > now() - interval '24 hours';
-- expect: one row per improvement. Before this fix it was always zero.
```

7. And that the work reached History. Visit `http://localhost:3000/history`,
   or:

```sql
select created_at, left(original_prompt, 40) as prompt, final_prompt is not null as has_rewrite
from prompt_sessions
where user_id = 'YOUR_USER_ID'
order by created_at desc limit 5;
-- expect: a row per improvement, has_rewrite = true.
-- Before this fix the website wrote nothing here at all.
```

*Extension path, bearer token from `/extension/connect`:*

```bash
curl -s -o /dev/null -w 'bearer: %{http_code}\n' -X POST http://localhost:3000/api/anon/analyze \
  -H 'Content-Type: application/json' -H "Authorization: Bearer dc_YOUR_TOKEN" \
  -d '{"prompt":"write a launch email","tone":"professional"}'
# expect: 200
```

Both credentials now go through the same `resolveCaller()` in
`lib/auth/caller.ts`, so if one works and the other does not, the problem is
the credential, not the route.

**Run 5, a prompt that asks a question, at cap 1.** This is the case that was
broken: the question spent the only unit and the answer was refused, so the
user got a question they could never answer. Reset the counter first
(`delete from anon_daily_usage where day = (now() at time zone 'utc')::date;`),
then in the browser send `write about coffee`, click one of the readings, and
confirm you get a rewrite rather than the capacity message.

### Clean up, every time

```sql
-- Put the counter back where you found it, or clear the day entirely.
delete from anon_daily_usage where day = (now() at time zone 'utc')::date;
```

Then stop the local server. There is nothing to unset: the cap override only
ever existed in that one process.

---

## 5. Fixed before this deploy: signed-in web visitors

This was a blocker when the runbook was first written. It is fixed, and the
fix is in the same deploy, so the section is kept as a record of what to
re-test if any of it regresses.

`/api/anon/analyze`, `sharpen` and `fork` identified a caller by
`Authorization: Bearer dc_...` and nothing else. Only the extension sends one.
A browser session is a Supabase cookie, so a signed-in visitor using the tool
on the website was anonymous to all three routes:

- they consumed the global anonymous budget and were blocked by it
- their free-plan quota was never checked or recorded
- their sessions never reached History

All four routes now call `resolveCaller()` from `lib/auth/caller.ts`, which
tries the bearer token and falls back to the cookie session. `verify` had its
own copy of that logic and now shares this one.

Two things changed alongside it:

- **The website was enforcing the wrong limit.** `analyze` used
  `REWRITE_FREE_LIMIT`, 5 per 48 hours, which `limits.ts` marks `@deprecated`.
  The live policy is 10 per rolling 24 hours, which is what the pricing page
  and the FAQ promise. It did not matter while no web user was ever recognised
  as signed in. It would have from the moment this fix landed, so `analyze`
  now runs the same `decideUsage()` policy as the extension route.
- **`recordExtensionSession` is now `recordSession`.** The website calls it
  too, so the old name was describing a constraint that no longer exists.

Re-test all of this with Run 4 in section 4.

## 6. The order, one more time

```
1. Apply 014                      DONE (verified 2026-08-31)
2. Apply 012                      DONE
3. Apply 013                      DONE
4. Set ANON_DAILY_GLOBAL_CAP=150  (Production scope, then redeploy)
5. Deploy
6. Post-deploy checks, below
7. Apply 011                      (any time after step 6, no rush)
```

### 6a. The cost guard is counting

One anonymous run on the live site (a private window, so no cookie), then:

```sql
select * from anon_daily_usage;
-- expect: today's date, runs = 1
```

If the row is missing, 014 did not apply and every anonymous visitor is
currently seeing "back tomorrow".

### 6b. The funnel counters are actually recording

**Do not skip this one.** 012 and 013 fail silently by design: the CHECK
constraint rejects the insert and `/api/anon/event` returns 204 regardless,
because that endpoint is built so it can never interfere with the product.
A constraint applied in the wrong order looks exactly like no traffic. Without
this query you would watch an empty dashboard for a week and conclude nobody
was using the tool.

Improve one prompt on the live site, then:

```sql
select event, surface, count(*) from extension_events
where created_at > now() - interval '1 hour'
group by event, surface order by 1;
```

**You must see `tool_run` with `surface = 'web'`.**

| What you see | What it means |
|---|---|
| `tool_run` / `web` | Both migrations landed correctly. |
| Nothing at all | 012 never applied, so `surface = 'web'` fails the surface CHECK and every website counter is rejected. |
| `question_none` but no `tool_run` | 013 either never applied, or ran before 012 and was narrowed back. Re-run 013. |
| Rows only with `chatgpt`/`claude`/`gemini` | The extension is writing and the website is not. Same cause as row two: 012. |

If anything is missing, fix the constraint and re-check. Nothing is lost
except the counters for the window, and no user ever sees an error.

### 6c. A signed-in visitor is recognised

In a normal window, signed in, improve one prompt. Then:

```sql
select count(*) from usage_events
where event_type = 'prompt_analyzed' and created_at > now() - interval '1 hour';
-- expect: at least 1

select count(*) from prompt_sessions where created_at > now() - interval '1 hour';
-- expect: at least 1
```

Both were always zero for website traffic before this deploy. If they are
still zero, `resolveCaller` is not seeing the cookie in production and
signed-in users are sharing the anonymous cap.
