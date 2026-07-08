-- Context Graph (Phase 2: Memories)
-- A list-shaped store for everything the graph knows beyond the fixed
-- identity profile. Each row is ONE injectable sentence with a lifecycle:
-- suggested (awaiting user review) -> active (injected) -> archived.
-- Identity stays in context_identity (form-shaped, fixed cardinality);
-- memories accumulate and are selected under a token budget at compile.

CREATE TABLE IF NOT EXISTS context_memories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- preference: how to write for me (tone, format, audience defaults)
  -- fact:       durable truths beyond identity ("we sell to hospitals")
  -- style_rule: graduated signal-derived rules from the Style layer
  kind         TEXT NOT NULL CHECK (kind IN ('preference','fact','style_rule')),
  content      TEXT NOT NULL,      -- one injectable sentence, length capped in the API
  source       TEXT NOT NULL CHECK (source IN ('user','extracted','signal')),
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suggested','archived')),
  confidence   REAL,               -- null for user-authored
  evidence     JSONB,              -- provenance: {sessionIds, clarifyQuestion, signalStats}
  last_used_at TIMESTAMPTZ,        -- powers "used in this rewrite" + recency selection
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_memories_user
  ON context_memories(user_id, status, kind, created_at DESC);

CREATE TRIGGER context_memories_updated_at
  BEFORE UPDATE ON context_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE context_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_all_own_memories"
  ON context_memories FOR ALL USING (auth.uid() = user_id);

-- One style signal per session: copy-after-edit must update the session's
-- signal, not stack a duplicate. Sessionless signals stay append-only.
CREATE UNIQUE INDEX IF NOT EXISTS idx_style_signals_session
  ON context_style_signals(session_id) WHERE session_id IS NOT NULL;
