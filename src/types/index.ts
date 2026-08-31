export type { Tone, ImprovementTag, Tier, SessionStatus } from './database'

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
  /** Pro rewrites run on the stronger model. */
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
      audit?: RubricAudit
    }
  | {
      type: 'improved'
      /** The full restructured rewrite, with all markers stripped. */
      improvedPrompt: string
      /**
       * `improvedPrompt` split by where each word came from: the user's own
       * prompt, their answer to the clarifying question, or our assumption.
       * Concatenating `segments` reproduces `improvedPrompt` exactly.
       *
       * Optional because a rewrite whose markers came back unusable still
       * ships - as an unlabelled prompt, which is what the user got before
       * any of this existed. See lib/engine/segments.ts.
       */
      segments?: import('@/lib/engine/segments').Segment[]
      /** Light-touch variant: the user's own wording with only the gaps patched. */
      minimalEdit?: string
      /** Reusable {variable} template extracted from the rewrite. */
      template?: string
      explanation: string
      improvementTags: import('./database').ImprovementTag[]
      audit?: RubricAudit
      intent?: IntentClass
    }
  | {
      type: 'already_good'
      /** Why the prompt is already strong - specific, not flattering. */
      message: string
      /** 1-2 marginal tweaks worth considering anyway. */
      tweaks: string[]
      audit?: RubricAudit
    }
  | {
      /**
       * The input contains no request at all - a thank-you, a greeting, a
       * reaction. Distinct from a weak prompt: there is nothing to improve,
       * so we say so instead of inventing a task. Never charged.
       */
      type: 'no_task'
      message: string
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
