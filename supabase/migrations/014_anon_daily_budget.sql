-- 014: a global daily ceiling on anonymous model calls.
--
-- WHY THE PER-IP LIMIT IS NOT A COST CONTROL
--
-- lib/rate-limit.ts is an in-memory Map inside the serverless process. It is
-- not shared between instances, it is wiped on every cold start and every
-- deploy, and its 10k-key eviction means a flood of distinct IPs resets
-- everyone's bucket. Rotating IPs is trivial. It is good burst protection for
-- one impatient person and no protection at all against a script.
--
-- Putting an unauthenticated LLM call in the hero of a public site without a
-- shared ceiling is an unbounded bill. This is the ceiling. One row per day,
-- one atomic increment per anonymous run, shared by every instance because it
-- lives in the database rather than in a process.
--
-- Deliberately NOT per-IP, per-session or per-anything: those are all
-- spoofable and all of them need a way to identify the caller, which this
-- endpoint specifically does not have. A single global number cannot be
-- gamed, and the failure mode when it trips is "come back tomorrow" for
-- anonymous visitors while every signed-in user carries on unaffected.

create table if not exists anon_daily_usage (
  day  date primary key,
  runs integer not null default 0
);

comment on table anon_daily_usage is
  'Global daily count of anonymous model runs. No user id, no IP, no prompt: one integer per day. Written only by the bump_anon_runs RPC through the service role.';

-- Service-role only. Anonymous requests carry no session, so RLS has nothing
-- to check and the routes use the service client.
alter table anon_daily_usage enable row level security;

/*
 * Atomic increment. Doing this as select-then-update would let two concurrent
 * requests read the same number and both pass a cap they jointly break, which
 * is exactly the traffic shape this exists to survive.
 */
create or replace function bump_anon_runs(p_day date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_runs integer;
begin
  insert into anon_daily_usage (day, runs)
  values (p_day, 1)
  on conflict (day) do update set runs = anon_daily_usage.runs + 1
  returning runs into v_runs;
  return v_runs;
end;
$$;

revoke all on function bump_anon_runs(date) from public, anon, authenticated;

-- Rows are tiny and there is one a day, but nothing reads beyond the last
-- couple of weeks, so old ones can go whenever it is convenient.
create index if not exists anon_daily_usage_day_idx on anon_daily_usage (day desc);
