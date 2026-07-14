-- Atomic insert-or-increment for user memory.
--
-- The first version read times_used, added one, and wrote it back. That is not
-- atomic: when a user answers two gaps in the same request (or two requests
-- land together), both reads see the same old count and both write the same
-- new one, so a repeat silently fails to count. Since times_used is exactly
-- what decides whether we trust a memory enough to offer it back, an
-- undercount means we forget habits the user actually has.
--
-- ON CONFLICT lets Postgres do it in one statement, using the
-- unique (user_id, label) index from migration 008.

create or replace function bump_memory(
  p_user_id uuid,
  p_label text,
  p_answer text
) returns void
language sql
security definer
set search_path = public
as $$
  insert into user_memory (user_id, label, answer)
  values (p_user_id, p_label, p_answer)
  on conflict (user_id, label) do update
    set answer     = excluded.answer,
        times_used = user_memory.times_used + 1,
        updated_at = now();
$$;

comment on function bump_memory is
  'Insert a memory, or refresh its answer and increment times_used. Atomic - see migration 009.';
