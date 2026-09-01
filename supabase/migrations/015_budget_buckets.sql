-- 015: give each product its own daily ceiling.
--
-- WHY
--
-- 014 created one integer per day for the whole site. That was right when
-- there was one anonymous model call to protect. There are now two products
-- with wildly different unit costs, and one shared counter is wrong in three
-- separate ways:
--
--   1. Unit price. A prompt rewrite is about $0.015. A document fact-check is
--      $0.08 to $0.74 depending on how many claims it contains. A counter of
--      "runs" cannot tell those apart, so a cap calibrated for one is either
--      useless or ruinous for the other.
--   2. Cross-product outage. Both guards fail closed, on purpose. With one
--      counter, a busy day on the frozen prompt improver takes the new
--      product offline, and vice versa.
--   3. Attribution. With one integer you cannot answer "which product spent
--      the money", which is the only question worth asking of this table.
--
-- So: add a bucket dimension. Same shape, same guarantees, one more column.
--
-- Still content-free. No user id, no IP, no prompt text. A bucket name and an
-- integer. The reason 014's docstring says "there is nothing per-caller to
-- game" still holds, because a bucket is a product, not a person.

alter table anon_daily_usage
  add column if not exists bucket text not null default 'improver';

comment on column anon_daily_usage.bucket is
  'Which product spent the run. Defaults to improver so every pre-existing row keeps its original meaning.';

-- The primary key moves from (day) to (day, bucket). Existing rows all carry
-- the default bucket, so this is a widening, not a rewrite: nothing is lost
-- and every historical number keeps meaning what it meant.
alter table anon_daily_usage drop constraint if exists anon_daily_usage_pkey;
alter table anon_daily_usage add primary key (day, bucket);

/*
 * Same increment-then-check as 014, one parameter wider.
 *
 * Read-then-write would let two concurrent requests see the same number and
 * both pass a cap they jointly break, which is exactly the traffic shape this
 * exists to survive. The RPC returns the POST-increment count so the caller
 * checks a number that is already true.
 */
create or replace function bump_anon_runs(p_day date, p_bucket text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_runs integer;
begin
  insert into anon_daily_usage (day, bucket, runs)
  values (p_day, p_bucket, 1)
  on conflict (day, bucket) do update set runs = anon_daily_usage.runs + 1
  returning runs into v_runs;
  return v_runs;
end;
$$;

revoke all on function bump_anon_runs(date, text) from public, anon, authenticated;

-- The one-argument version from 014 is dropped only AFTER the new one exists,
-- so there is no window where neither is callable. Deploy the code that passes
-- a bucket before running this line, or roll them together.
drop function if exists bump_anon_runs(date);

create index if not exists anon_daily_usage_day_idx on anon_daily_usage (day desc);
