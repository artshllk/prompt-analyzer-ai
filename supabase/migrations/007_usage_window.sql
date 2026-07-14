-- Time-window usage gating, replacing the "5 rewrites per rolling 48h" quota.
--
-- Free users get a burst window of unlimited improving, then a cooldown,
-- repeating. This matches how people actually work (a focused session, then
-- away for hours) and how ChatGPT/Claude gate their own free tiers. A real
-- user sharpening three prompts never touches it; only someone hammering the
-- tool does, which is exactly who should feel it.
--
-- window_started_at is the moment the CURRENT window opened. Null means the
-- user has never improved a prompt (or has been reset). The route reads it,
-- decides allow/block, and rolls it forward when a stale window expires.

alter table profiles
  add column if not exists window_started_at timestamptz;

comment on column profiles.window_started_at is
  'Start of the current free-tier usage window. Null = no window open. Free users may improve freely for WINDOW_HOURS from this moment, then wait COOLDOWN_HOURS before a new window opens. Ignored for pro.';

-- Read on every free-tier sharpen, so keep the lookup cheap.
create index if not exists profiles_window_started_at_idx
  on profiles (window_started_at)
  where window_started_at is not null;
