import type { ExpertiseLevel, MemoryKind, MemorySource, MemoryStatus } from '@/types/database'

export type { ExpertiseLevel, MemoryKind, MemorySource, MemoryStatus }

/**
 * One standing memory: a single injectable sentence with a lifecycle.
 * `suggested` rows await user review (never injected); `active` rows are
 * selected into rewrites under the compile budget; `archived` rows are
 * kept but ignored.
 */
export interface Memory {
  id: string
  kind: MemoryKind
  content: string
  source: MemorySource
  status: MemoryStatus
  lastUsedAt: string | null
  createdAt: string
}

/**
 * The confirmed, user-facing shape of the Identity layer. This is what the
 * settings UI edits and what the compiler reads. `confirmed` gates whether
 * these facts are trusted enough to inject into a rewrite.
 */
export interface Identity {
  role: string | null
  company: string | null
  industry: string | null
  expertiseLevel: ExpertiseLevel | null
  languages: string[]
  toneNote: string | null
  confirmed: boolean
  /** The latest auto-extracted guess awaiting review, if any. */
  suggestion: IdentitySuggestion | null
}

/** A partial identity produced by auto-extraction, pending user confirmation. */
export interface IdentitySuggestion {
  role?: string | null
  company?: string | null
  industry?: string | null
  expertiseLevel?: ExpertiseLevel | null
  languages?: string[]
  toneNote?: string | null
}

export const EMPTY_IDENTITY: Identity = {
  role: null,
  company: null,
  industry: null,
  expertiseLevel: null,
  languages: [],
  toneNote: null,
  confirmed: false,
  suggestion: null,
}
