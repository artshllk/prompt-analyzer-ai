-- Extension / API tokens. Opaque random tokens tied to a user.
-- The plaintext token is shown to the user exactly once (at issuance);
-- we store only a SHA-256 hash so a DB leak doesn't compromise tokens.
CREATE TABLE api_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  label         TEXT NOT NULL DEFAULT 'Browser extension',
  last_used_at  TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_tokens_user_id ON api_tokens(user_id);
CREATE INDEX idx_api_tokens_hash ON api_tokens(token_hash) WHERE revoked_at IS NULL;

ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

-- Users can see/manage only their own tokens. Token *validation* runs through
-- the service role on the server, so the lookup-by-hash path bypasses RLS.
CREATE POLICY "users_own_tokens" ON api_tokens FOR ALL USING (auth.uid() = user_id);
