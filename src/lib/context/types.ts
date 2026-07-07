import type { ExpertiseLevel } from '@/types/database'

export type { ExpertiseLevel }

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
