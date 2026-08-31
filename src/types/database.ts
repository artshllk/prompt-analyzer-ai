export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Tier = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'
export type SessionStatus = 'analyzing' | 'clarifying' | 'improving' | 'completed' | 'failed'
export type Tone = 'friendly' | 'professional' | 'persuasive' | 'concise' | 'creative'
export type ImprovementTag = 'context' | 'role' | 'action' | 'format' | 'constraints' | 'examples' | 'specificity'

/**
 * The closed set of extension counters. Migration 010.
 *
 * This list exists three times - here, in the allowlist in
 * /api/anon/event/route.ts, and as a CHECK constraint on the table - and all
 * three must agree. A name in one and not the others is data that is written
 * and silently dropped, which is the worst failure an analytics pipeline has,
 * because it looks like the feature is simply unused.
 */
export type ExtensionEvent =
  | 'improve_started'
  | 'improve_finished'
  | 'improve_failed'
  | 'question_shown'
  | 'question_answered'
  | 'question_skipped'
  | 'rewrite_accepted'
  | 'rewrite_edited'
  | 'rewrite_undone'

/** Which of the three chat products the counter came from. */
export type ExtensionSurface = 'chatgpt' | 'claude' | 'gemini'

// Row types as `type` aliases (not interfaces) - required for Supabase's Record<string, unknown> checks
export type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  preferred_tone: Tone
  use_case_tags: string[]
  tier: Tier
  /** Start of the current free-tier usage window. Null = none open. Migration 007. */
  window_started_at: string | null
  paddle_customer_id: string | null
  paddle_subscription_id: string | null
  subscription_status: SubscriptionStatus | null
  subscription_period_end: string | null
  onboarding_completed: boolean
  email_tips: boolean
  email_unsubscribed: boolean
  created_at: string
  updated_at: string
}

export type EmailSentRow = {
  id: string
  user_id: string
  email_type: string
  dedupe_key: string
  sent_at: string
}

export type PromptSessionRow = {
  id: string
  user_id: string
  original_prompt: string
  final_prompt: string | null
  tone: Tone
  status: SessionStatus
  /**
   * Retained, no longer read or written. The score was two model
   * self-reports and the "after" one was the rewrite model grading its own
   * rewrite, so it is gone from the product. The columns stay because they
   * hold real historical rows; dropping them would throw that away for
   * nothing. Nothing should start writing them again.
   */
  clarity_score_before: number | null
  clarity_score_after: number | null
  clarify_turns: number
  created_at: string
  updated_at: string
}

export type ClarificationExchangeRow = {
  id: string
  session_id: string
  turn: number
  ai_question: string
  user_answer: string | null
  confidence_before: number | null
  confidence_after: number | null
  created_at: string
}

export type PromptImprovementRow = {
  id: string
  session_id: string
  improved_prompt: string
  explanation: string
  improvement_tags: ImprovementTag[]
  /** Engine v2 extras (minimal edit, template, rubric audit, critique, intent). Migration 006. */
  analysis: Record<string, unknown> | null
  created_at: string
}

export type UsageEventRow = {
  id: string
  user_id: string
  event_type: string
  created_at: string
}

export type ApiTokenRow = {
  id: string
  user_id: string
  token_hash: string
  label: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

export type UserPromptPatternRow = {
  id: string
  user_id: string
  week_start: string
  prompts_count: number
  avg_clarity_before: number | null
  avg_clarity_after: number | null
  avg_improvement: number | null
  common_mistakes: Json
  top_improvement_tags: string[]
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at' | 'email_tips' | 'email_unsubscribed'> & {
          email_tips?: boolean
          email_unsubscribed?: boolean
        }
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      emails_sent: {
        Row: EmailSentRow
        Insert: Omit<EmailSentRow, 'id' | 'sent_at'> & { id?: string; sent_at?: string }
        Update: Partial<Omit<EmailSentRow, 'id' | 'sent_at'>>
        Relationships: []
      }
      prompt_sessions: {
        Row: PromptSessionRow
        Insert: Omit<PromptSessionRow, 'id' | 'created_at' | 'updated_at' | 'final_prompt' | 'clarity_score_after' | 'clarify_turns'> & {
          id?: string
          final_prompt?: string | null
          clarity_score_after?: number | null
          clarify_turns?: number
        }
        Update: Partial<Omit<PromptSessionRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      clarification_exchanges: {
        Row: ClarificationExchangeRow
        Insert: Omit<ClarificationExchangeRow, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<ClarificationExchangeRow, 'id' | 'created_at'>>
        Relationships: []
      }
      prompt_improvements: {
        Row: PromptImprovementRow
        // analysis stays optional on insert: the pre-migration fallback in
        // saveImprovement inserts without the column.
        Insert: Omit<PromptImprovementRow, 'id' | 'created_at' | 'analysis'> & {
          id?: string
          analysis?: Record<string, unknown> | null
        }
        Update: Partial<Omit<PromptImprovementRow, 'id' | 'created_at'>>
        Relationships: []
      }
      usage_events: {
        Row: UsageEventRow
        Insert: Omit<UsageEventRow, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<UsageEventRow, 'id' | 'created_at'>>
        Relationships: []
      }
      user_prompt_patterns: {
        Row: UserPromptPatternRow
        Insert: Omit<UserPromptPatternRow, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<UserPromptPatternRow, 'id' | 'created_at'>>
        Relationships: []
      }
      api_tokens: {
        Row: ApiTokenRow
        Insert: Omit<ApiTokenRow, 'id' | 'created_at' | 'last_used_at' | 'revoked_at' | 'label'> & {
          id?: string
          label?: string
          last_used_at?: string | null
          revoked_at?: string | null
        }
        Update: Partial<Omit<ApiTokenRow, 'id' | 'created_at'>>
        Relationships: []
      }
      pro_waitlist: {
        Row: { id: string; email: string; created_at: string }
        Insert: { email: string; id?: string; created_at?: string }
        Update: { email?: string }
        Relationships: []
      }
      /** What the user keeps answering when we ask what a prompt is missing. Migration 008. */
      user_memory: {
        Row: {
          id: string
          user_id: string
          label: string
          answer: string
          times_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          label: string
          answer: string
          id?: string
          times_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: { answer?: string; times_used?: number; updated_at?: string }
        Relationships: []
      }
      /**
       * Content-free counters for the browser extension. Migration 010.
       *
       * No user_id and no Relationships, which is the point rather than an
       * omission: nothing in this table can be joined back to a person. See
       * the migration for why that trade was made.
       */
      extension_events: {
        Row: {
          id: string
          event: ExtensionEvent
          tier: Tier | 'anon'
          surface: ExtensionSurface | null
          created_at: string
        }
        Insert: {
          event: ExtensionEvent
          id?: string
          tier?: Tier | 'anon'
          surface?: ExtensionSurface | null
          created_at?: string
        }
        /** Counters are append-only. Nothing edits one. */
        Update: never
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      /** Atomic insert-or-increment for user memory. Migration 009. */
      bump_memory: {
        Args: { p_user_id: string; p_label: string; p_answer: string }
        Returns: undefined
      }
    }
    Enums: Record<never, never>
  }
}
