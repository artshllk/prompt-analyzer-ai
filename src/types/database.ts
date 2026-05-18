export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Tier = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'
export type SessionStatus = 'analyzing' | 'clarifying' | 'improving' | 'completed' | 'failed'
export type Tone = 'friendly' | 'professional' | 'persuasive' | 'concise' | 'creative'
export type ImprovementTag = 'context' | 'role' | 'action' | 'format' | 'constraints' | 'examples' | 'specificity'

// Row types as `type` aliases (not interfaces) - required for Supabase's Record<string, unknown> checks
export type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  preferred_tone: Tone
  use_case_tags: string[]
  tier: Tier
  paddle_customer_id: string | null
  paddle_subscription_id: string | null
  subscription_status: SubscriptionStatus | null
  subscription_period_end: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export type PromptSessionRow = {
  id: string
  user_id: string
  original_prompt: string
  final_prompt: string | null
  tone: Tone
  status: SessionStatus
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
  created_at: string
}

export type UsageEventRow = {
  id: string
  user_id: string
  event_type: string
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
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>>
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
        Insert: Omit<PromptImprovementRow, 'id' | 'created_at'> & { id?: string }
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
      pro_waitlist: {
        Row: { id: string; email: string; created_at: string }
        Insert: { email: string; id?: string; created_at?: string }
        Update: { email?: string }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
  }
}
