-- 012: measure how often we stay quiet.
--
-- The engine is supposed to ask at most one question, and to ask nothing at
-- all when the prompt only has one sensible reading. Staying quiet is the
-- feature, so it has to be measurable: without a counter for "we had nothing
-- to ask", the only thing we could see was how often we DID ask, which reads
-- the same whether the engine is being disciplined or simply broken.
--
--   silence rate = question_none / (question_none + question_shown)
--
-- 'web' joins the surface list because the on-site tool is becoming the
-- homepage hero, and a silence rate that only counts the extension would
-- measure half the product.

alter table extension_events drop constraint if exists extension_events_event_check;
alter table extension_events add constraint extension_events_event_check
  check (event in (
    'improve_started',      -- they pressed the key or the chip
    'improve_finished',     -- a rewrite landed in the box
    'improve_failed',       -- it did not
    'question_shown',       -- the prompt was ambiguous and we asked
    'question_answered',    -- they picked a reading
    'question_skipped',     -- they dismissed it and took the rewrite anyway
    'question_none',        -- one sensible reading, so we said nothing
    'rewrite_accepted',     -- the box emptied while holding our untouched text
    'rewrite_edited',       -- they changed our text before sending it
    'rewrite_undone'        -- they took their own words back
  ));

alter table extension_events drop constraint if exists extension_events_surface_check;
alter table extension_events add constraint extension_events_surface_check
  check (surface in ('chatgpt', 'claude', 'gemini', 'web'));
