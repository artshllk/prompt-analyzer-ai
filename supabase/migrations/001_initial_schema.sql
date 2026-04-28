-- PromptCraft Initial Schema
-- Run this in Supabase SQL editor or via supabase db push

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   TEXT NOT NULL,
  full_name               TEXT,
  avatar_url              TEXT,
  preferred_tone          TEXT NOT NULL DEFAULT 'professional'
                            CHECK (preferred_tone IN ('friendly','professional','persuasive','concise','creative')),
  use_case_tags           TEXT[] NOT NULL DEFAULT '{}',
  tier                    TEXT NOT NULL DEFAULT 'free'
                            CHECK (tier IN ('free','pro')),
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  subscription_status     TEXT
                            CHECK (subscription_status IN ('active','canceled','past_due','trialing') OR subscription_status IS NULL),
  subscription_period_end TIMESTAMPTZ,
  onboarding_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PROMPT SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS prompt_sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_prompt      TEXT NOT NULL,
  final_prompt         TEXT,
  tone                 TEXT NOT NULL
                         CHECK (tone IN ('friendly','professional','persuasive','concise','creative')),
  status               TEXT NOT NULL DEFAULT 'analyzing'
                         CHECK (status IN ('analyzing','clarifying','improving','completed','failed')),
  clarity_score_before INT CHECK (clarity_score_before BETWEEN 0 AND 100),
  clarity_score_after  INT CHECK (clarity_score_after BETWEEN 0 AND 100),
  clarify_turns        INT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_sessions_user_id ON prompt_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_sessions_created_at ON prompt_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_sessions_user_created ON prompt_sessions(user_id, created_at DESC);

CREATE TRIGGER prompt_sessions_updated_at
  BEFORE UPDATE ON prompt_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CLARIFICATION EXCHANGES
-- ============================================================
CREATE TABLE IF NOT EXISTS clarification_exchanges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES prompt_sessions(id) ON DELETE CASCADE,
  turn              INT NOT NULL CHECK (turn >= 1 AND turn <= 3),
  ai_question       TEXT NOT NULL,
  user_answer       TEXT,
  confidence_before INT CHECK (confidence_before BETWEEN 0 AND 100),
  confidence_after  INT CHECK (confidence_after BETWEEN 0 AND 100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, turn)
);

CREATE INDEX IF NOT EXISTS idx_clarification_session ON clarification_exchanges(session_id);

-- ============================================================
-- PROMPT IMPROVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS prompt_improvements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID UNIQUE NOT NULL REFERENCES prompt_sessions(id) ON DELETE CASCADE,
  improved_prompt   TEXT NOT NULL,
  explanation       TEXT NOT NULL,
  improvement_tags  TEXT[] NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USAGE EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL DEFAULT 'prompt_analyzed',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_month ON usage_events(user_id, created_at DESC);

-- ============================================================
-- USER PROMPT PATTERNS (weekly aggregates)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_prompt_patterns (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start           DATE NOT NULL,
  prompts_count        INT NOT NULL DEFAULT 0,
  avg_clarity_before   FLOAT,
  avg_clarity_after    FLOAT,
  avg_improvement      FLOAT,
  common_mistakes      JSONB NOT NULL DEFAULT '{}',
  top_improvement_tags TEXT[] NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_patterns_user_week ON user_prompt_patterns(user_id, week_start DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clarification_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompt_patterns ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "users_select_own_profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Prompt sessions
CREATE POLICY "users_all_own_sessions"
  ON prompt_sessions FOR ALL USING (auth.uid() = user_id);

-- Clarification exchanges (via session ownership)
CREATE POLICY "users_all_own_exchanges"
  ON clarification_exchanges FOR ALL
  USING (
    session_id IN (
      SELECT id FROM prompt_sessions WHERE user_id = auth.uid()
    )
  );

-- Improvements (via session ownership)
CREATE POLICY "users_all_own_improvements"
  ON prompt_improvements FOR ALL
  USING (
    session_id IN (
      SELECT id FROM prompt_sessions WHERE user_id = auth.uid()
    )
  );

-- Usage events
CREATE POLICY "users_all_own_usage"
  ON usage_events FOR ALL USING (auth.uid() = user_id);

-- Patterns
CREATE POLICY "users_all_own_patterns"
  ON user_prompt_patterns FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTION: monthly usage count
-- ============================================================
CREATE OR REPLACE FUNCTION get_monthly_usage(p_user_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INT
  FROM usage_events
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', NOW())
    AND event_type = 'prompt_analyzed';
$$;
