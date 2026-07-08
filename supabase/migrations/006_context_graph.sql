-- Context Graph (Phase 1: Identity layer + Style-signal capture)
-- The portable context layer DeepClario builds automatically. Phase 1
-- ships the Identity layer (free taste) and the raw Style signal capture
-- (Pro), which later phases distill into learned style rules.

-- ============================================================
-- IDENTITY LAYER  (one row per user, slow-changing)
-- ============================================================
-- Fields are populated by auto-extraction but only trusted once the user
-- confirms them (confirmed = true). The engine injects ONLY confirmed
-- identity, so an unreviewed guess can never silently steer a rewrite.
CREATE TABLE IF NOT EXISTS context_identity (
  user_id          UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role             TEXT,
  company          TEXT,
  industry         TEXT,
  expertise_level  TEXT CHECK (expertise_level IN ('beginner','intermediate','advanced','expert') OR expertise_level IS NULL),
  languages        TEXT[] NOT NULL DEFAULT '{}',
  tone_note        TEXT,   -- free-text voice note beyond the five canned tones
  extra            JSONB  NOT NULL DEFAULT '{}',
  -- The most recent auto-extracted suggestion awaiting review, if any.
  -- Kept separate from the confirmed columns so a pending guess never
  -- pollutes the trusted profile.
  suggestion       JSONB,
  confirmed        BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER context_identity_updated_at
  BEFORE UPDATE ON context_identity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STYLE SIGNALS  (append-only capture of accepted outputs)
-- ============================================================
-- The Style layer learns from what the user ACTUALLY used, not what they
-- said they wanted: each row is one AI draft paired with the version the
-- user accepted (possibly edited). Later phases distill the deltas
-- (shortening, em-dash removal, etc.) into durable style rules.
CREATE TABLE IF NOT EXISTS context_style_signals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES prompt_sessions(id) ON DELETE SET NULL,
  ai_draft    TEXT NOT NULL,
  user_final  TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web','extension')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_style_signals_user
  ON context_style_signals(user_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY  (same per-user isolation as every other table)
-- ============================================================
ALTER TABLE context_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_style_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_all_own_identity"
  ON context_identity FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_all_own_style_signals"
  ON context_style_signals FOR ALL USING (auth.uid() = user_id);
