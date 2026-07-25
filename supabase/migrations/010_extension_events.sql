-- What the extension actually does, in counters.
--
-- 0.9.0 is live and nothing measures it. The two questions that decide whether
-- this product works - do people press the key, and do they keep the rewrite -
-- are both currently unanswerable. The extension already computes the second
-- one and throws it away: syncChip sees the box go empty while it still holds
-- our unedited output (the user sent it) and undoSharpen sees them take it
-- back, and neither is recorded anywhere.
--
-- WHY NOT usage_events
-- That table's user_id is NOT NULL with a foreign key to profiles. Anonymous
-- users cannot appear in it, and anonymous is most of a new install's life -
-- five free tries before we ask for anything. Measuring only signed-in users
-- would miss the exact part of the funnel that is in question.
--
-- WHAT THIS DELIBERATELY DOES NOT STORE
-- No user id. No prompt text, ever. No IP, not even bucketed. No session or
-- install identifier, so nothing here can be joined back into a person or a
-- sequence of one person's actions.
--
-- That is a real cost: it means we can count how many improves were accepted
-- but never follow one user's path through the funnel. It is the right trade.
-- The extension page promises "we only see a prompt when you press the key",
-- and a pseudonymous id attached to every action a user takes on chatgpt.com
-- would make that promise false in spirit while staying true in letter. The
-- questions we actually need answered are ratios, and ratios only need counts.

create table if not exists extension_events (
  id uuid primary key default gen_random_uuid(),

  -- Constrained on purpose. This endpoint is unauthenticated by necessity
  -- (anonymous users are the point), so the set of storable strings is closed
  -- rather than free text. Nothing a caller sends can end up in the table
  -- unless it is named here.
  event text not null check (event in (
    'improve_started',      -- they pressed the key or the chip
    'improve_finished',     -- a rewrite landed in the box
    'improve_failed',       -- it did not
    'question_shown',       -- the prompt was ambiguous and we asked
    'question_answered',    -- they picked or typed a reading
    'question_skipped',     -- they dismissed it and took the rewrite anyway
    'rewrite_accepted',     -- the box emptied while holding our untouched text
    'rewrite_edited',       -- they changed our text before sending it
    'rewrite_undone'        -- they took their own words back
  )),

  -- anon | free | pro. Which tier behaves how is worth knowing and identifies
  -- nobody.
  tier text not null default 'anon' check (tier in ('anon', 'free', 'pro')),

  -- chatgpt | claude | gemini. The three hosts are already declared in the
  -- manifest, so this reveals nothing the install did not.
  surface text check (surface in ('chatgpt', 'claude', 'gemini')),

  created_at timestamptz not null default now()
);

-- Every query against this is "how many of X in the last N days", so the index
-- leads with time.
create index if not exists extension_events_at_idx on extension_events (created_at desc);
create index if not exists extension_events_event_at_idx on extension_events (event, created_at desc);

comment on table extension_events is
  'Content-free counters for the browser extension. No user id, no prompt text, no IP, no install id - aggregate ratios only. Written by POST /api/anon/event through the service role.';

alter table extension_events enable row level security;

-- No policies, by design. RLS is on and nothing grants access, so the anon key
-- can neither read nor write this table. Inserts go through the service role
-- in the API route, which bypasses RLS - the same shape as every other
-- token-authed write in this schema. Reads are for us, in the SQL editor.
