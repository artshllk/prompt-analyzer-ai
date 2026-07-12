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
  /** Pro-only Deep Rewrite: stronger model, draft-critique-refine pass. */
  deep?: boolean
  /** Pro rewrites run on the stronger model even when deep is off. */
  pro?: boolean
}

/** The prompt's task family. Drives which rubric and rewrite strategy apply. */
export type IntentClass =
  | 'writing'
  | 'coding'
  | 'marketing'
  | 'research'
  | 'data-analysis'
  | 'education'
  | 'image-generation'
  | 'system-prompt'
  | 'general'

/** One plausible reading of an ambiguous prompt, offered as a clickable answer. */
export interface ForkOption {
  label: string
  summary: string
}

export interface RubricFinding {
  dimension: string
  severity: 'critical' | 'moderate' | 'minor'
  /** Exact phrase quoted from the user's prompt, or null when the problem is an absence. */
  evidence: string | null
  note: string
}

export interface RubricAudit {
  intent: IntentClass
  dimensions: Array<{ name: string; score: number }>
  findings: RubricFinding[]
  /** Concrete predictions of what goes wrong if the prompt runs as-is. */
  failureForecast: string[]
}

export type AnalyzeResult =
  | {
      type: 'clarifying'
      question: string
      targetsGap: string
      /** Interpretation forks rendered as one-click answers. */
      options?: ForkOption[]
      confidenceSoFar: number
      scoreBeforeImprovement: number
      audit?: RubricAudit
    }
  | {
      type: 'improved'
      /** The full restructured rewrite (refined by the critic in deep mode). */
      improvedPrompt: string
      /** Light-touch variant: the user's own wording with only the gaps patched. */
      minimalEdit?: string
      /** Reusable {variable} template extracted from the rewrite. */
      template?: string
      explanation: string
      improvementTags: import('./database').ImprovementTag[]
      clarityScoreAfter: number
      scoreBeforeImprovement: number
      audit?: RubricAudit
      /** Deep mode only: the critic's attack on the first draft, shown to the user. */
      critique?: string
      intent?: IntentClass
    }
  | {
      type: 'already_good'
      /** Why the prompt is already strong - specific, not flattering. */
      message: string
      /** 1-2 marginal tweaks worth considering anyway. */
      tweaks: string[]
      scoreBeforeImprovement: number
      audit?: RubricAudit
    }

export interface VerifyResult {
  originalOutput: string
  improvedOutput: string
  /** One or two sentences naming the most important behavioral difference. */
  contrast: string
  model: string
}

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
