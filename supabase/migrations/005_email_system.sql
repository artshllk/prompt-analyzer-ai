-- Email engagement system: preferences + send log.
-- Run in Supabase SQL editor or via supabase db push.

-- ============================================================
-- EMAIL PREFERENCES (on profiles)
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_weekly       BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_tips         BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_unsubscribed BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- SEND LOG
-- One row per email actually sent. dedupe_key is claimed BEFORE
-- sending (unique constraint), so no rule can ever double-send:
--   welcome:<user>            once ever
--   nudge:<user>              once ever
--   weekly:<user>:<iso-week>  once per week
--   tip:<user>:<iso-week>     once per week
--   winback:<user>:<n>        max twice (n = 1, 2)
-- ============================================================
CREATE TABLE IF NOT EXISTS emails_sent (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_type  TEXT NOT NULL,
  dedupe_key  TEXT NOT NULL UNIQUE,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS emails_sent_user_idx ON emails_sent(user_id);
CREATE INDEX IF NOT EXISTS emails_sent_type_idx ON emails_sent(email_type);

-- Service-role only: RLS enabled with no policies.
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;
