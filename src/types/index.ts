export type { Tone, ImprovementTag, Tier, SessionStatus } from './database'

export interface ClarityDimensions {
  goal_clarity: number
  context_sufficiency: number
  format_specification: number
  constraint_definition: number
  example_presence: number
}

export interface ClarityScore {
  total_score: number
  dimensions: ClarityDimensions
  gaps: string[]
  confidence: number
  can_improve_directly: boolean
}

export interface ClarifyingQuestion {
  question: string
  targets_gap: string
}

export interface Improvement {
  improved_prompt: string
  explanation: string
  improvement_tags: import('./database').ImprovementTag[]
  clarity_score_after: number
}

export interface QAPair {
  question: string
  answer: string
  turn: number
}

/**
 * Compiled Context Graph brief injected into the rewrite. Kept as small,
 * pre-rendered line lists (not raw records) so the engine spends minimal
 * tokens and only ever sees what the compiler chose to expose.
 */
export interface ContextBrief {
  /** Confirmed identity facts, e.g. "Role: senior product manager". */
  identity?: string[]
  /** Learned style rules from accepted edits (Pro only), e.g. "Shortens drafts ~30%". */
  styleHints?: string[]
  /** Active standing memories, selected under the compile token budget. */
  memories?: string[]
  /**
   * The memory rows behind `memories` - NOT injected into the prompt.
   * Powers last_used_at tracking and the "Context applied" UI.
   */
  usedMemories?: Array<{ id: string; content: string }>
}

/** What the analyze response tells the client about the injected context. */
export interface ContextApplied {
  identity: string[]
  memories: Array<{ id: string; content: string }>
  styleHints: string[]
}

export interface AnalyzeInput {
  prompt: string
  tone: import('./database').Tone
  priorAnswers: QAPair[]
  currentConfidence?: number
  /** Pro-only Deep Rewrite: stronger model, draft-critique-refine pass. */
  deep?: boolean
  /** Portable Context Graph brief. Null/absent for anonymous callers. */
  context?: ContextBrief | null
}

export type AnalyzeResult =
  | { type: 'clarifying'; question: string; targetsGap: string; confidenceSoFar: number; scoreBeforeImprovement: number }
  | { type: 'improved'; improvedPrompt: string; explanation: string; improvementTags: import('./database').ImprovementTag[]; clarityScoreAfter: number; scoreBeforeImprovement: number }

export interface UsageInfo {
  used: number
  limit: number | null // null = unlimited (pro)
  isAtLimit: boolean
  tier: import('./database').Tier
}

export interface SessionWithDetails {
  id: string
  originalPrompt: string
  finalPrompt: string | null
  tone: import('./database').Tone
  status: import('./database').SessionStatus
  clarityScoreBefore: number | null
  clarityScoreAfter: number | null
  clarifyTurns: number
  createdAt: string
  exchanges: Array<{
    turn: number
    question: string
    answer: string | null
  }>
  improvement: {
    improvedPrompt: string
    explanation: string
    improvementTags: import('./database').ImprovementTag[]
  } | null
}
