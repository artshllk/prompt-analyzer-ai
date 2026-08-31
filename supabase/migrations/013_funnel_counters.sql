-- 013: the funnel.
--
-- Four counts, in order. Everything worth knowing about whether this product
-- works is a ratio between two of them:
--
--   tool_run          someone improved a prompt
--   tool_run_repeat   the same visitor came back and did it again
--   compare_clicked   they asked to see what actually changes
--   compare_completed both answers landed
--
--   return rate      = tool_run_repeat / tool_run
--   compare interest = compare_clicked / tool_run
--   compare success  = compare_completed / compare_clicked
--
-- Still content-free, still no identifier. "Same visitor" is a flag the
-- client sets from its own local storage and then forgets; nothing here can
-- link two rows to one person, which is the whole reason this table is
-- allowed to be written by an unauthenticated endpoint.

alter table extension_events drop constraint if exists extension_events_event_check;
alter table extension_events add constraint extension_events_event_check
  check (event in (
    'improve_started',
    'improve_finished',
    'improve_failed',
    'question_shown',
    'question_answered',
    'question_skipped',
    'question_none',
    'rewrite_accepted',
    'rewrite_edited',
    'rewrite_undone',
    'tool_run',
    'tool_run_repeat',
    'compare_clicked',
    'compare_completed'
  ));
