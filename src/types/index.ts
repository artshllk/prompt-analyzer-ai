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

export interface AnalyzeInput {
  prompt: string
  tone: import('./database').Tone
  priorAnswers: QAPair[]
  currentConfidence?: number
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
