-- Memory: what the user keeps telling us.
--
-- The engine already spots what a prompt is missing ("Goal", "Audience",
-- "Length") and asks. The user answers. Until now we folded that answer into
-- the prompt and threw it away - so the next time they wrote a vague marketing
-- prompt, we asked who it was for all over again, as if we had never met.
--
-- This remembers the ANSWER, not just the gap. "You usually say your audience
-- is engineering leads" is worth far more than "you usually forget audience",
-- and it is the difference between a tool and an assistant.
--
-- One row per (user, gap label). Answering the same gap again bumps the count
-- and refreshes the answer, so memory tracks what is currently true rather
-- than what was true once.

create table if not exists user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- The gap this answers: "Goal", "Audience", "Length". Normalised lowercase
  -- so "Audience" and "audience" are the same memory.
  label text not null,

  -- What they said last time. Short - these are tap-sized answers.
  answer text not null,

  -- How often they have given this answer. High count = a real habit, not a
  -- one-off. The engine only offers a memory it is confident about.
  times_used integer not null default 1,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, label)
);

create index if not exists user_memory_user_idx on user_memory (user_id);

comment on table user_memory is
  'What the user keeps answering when the engine asks what a prompt is missing. Fed back so the same question is never asked cold twice. User-visible and user-deletable in Settings.';

alter table user_memory enable row level security;

-- Users can only ever see and delete their own memory. Writes go through the
-- service role (the extension is token-authed, not cookie-authed).
create policy "own memory readable" on user_memory
  for select using (auth.uid() = user_id);

create policy "own memory deletable" on user_memory
  for delete using (auth.uid() = user_id);
