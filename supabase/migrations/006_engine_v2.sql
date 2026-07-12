-- Engine v2: the diagnostic pipeline attaches richer artifacts to each
-- improvement (minimal edit, reusable template, rubric audit with
-- evidence spans, deep-mode critique, intent class). One JSONB column
-- keeps the schema stable while the result shape iterates.

alter table prompt_improvements
  add column if not exists analysis jsonb;

comment on column prompt_improvements.analysis is
  'Engine v2 extras: { minimalEdit, template, audit: { intent, dimensions, findings, failureForecast }, critique, intent }';

-- usage_events gains two new event_type values used by the fair-use
-- meters: ''deep_rewrite'' (Pro critic pass, 100 / rolling 30d) and
-- ''verify_run'' (verification runs: Pro 100 / rolling 30d, free 3
-- lifetime credits). event_type is already free-text; no DDL needed.
