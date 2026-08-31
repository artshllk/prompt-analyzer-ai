/**
 * Derives a human, honest status for a prompt session from its data.
 *
 * The DB stores a raw status ('clarifying' | 'completed' | ...), but the
 * UI needs a clearer story:
 *
 *   improved      - a rewrite came back. The good outcome.
 *   needs-answer  - clarifying question is waiting, and it's recent enough
 *                   to still be worth resuming.
 *   abandoned     - a question was asked but never answered, and the
 *                   session has gone stale. Honest, not "in progress".
 *   failed        - the engine errored out.
 *
 * Pure config (no server imports) so both server pages and client
 * components can use it.
 */

export type DerivedStatus = 'improved' | 'needs-answer' | 'abandoned' | 'failed'

/** How long an unanswered clarifying session stays "needs your answer"
 *  before we call it abandoned. */
export const STALE_AFTER_HOURS = 24

interface StatusInput {
  status: string
  /** The rewrite we produced. Null means we never got that far. */
  finalPrompt: string | null
  createdAt: string
}

/**
 * "Improved" used to mean "has an after-score". The shipping path writes
 * that column as null on every session, so this function could never
 * return 'improved' and every real session eventually rendered as
 * "Abandoned". The honest signal is whether a rewrite came back.
 */
export function statusOf(session: StatusInput): DerivedStatus {
  if (session.finalPrompt != null && session.finalPrompt.trim() !== '') return 'improved'
  if (session.status === 'failed') return 'failed'

  // Unanswered clarifying session: recent => resumable, old => abandoned.
  const ageMs = Date.now() - new Date(session.createdAt).getTime()
  const stale = ageMs > STALE_AFTER_HOURS * 3_600_000
  return stale ? 'abandoned' : 'needs-answer'
}

interface StatusMeta {
  label: string
  /** Text/accent color. */
  color: string
  /** Faint background tint for the chip. */
  bg: string
  /** Border color. */
  border: string
}

/** Presentation for each derived status. Colors are chosen to read at a
 *  glance: green = done, amber = action needed, muted = abandoned,
 *  red = failed. */
export const STATUS_META: Record<DerivedStatus, StatusMeta> = {
  improved: {
    label: 'Improved',
    color: '#5FBE8C',
    bg: 'rgba(95,190,140,0.10)',
    border: 'rgba(95,190,140,0.28)',
  },
  'needs-answer': {
    label: 'Needs your answer',
    color: '#E0B23C',
    bg: 'rgba(224,178,60,0.10)',
    border: 'rgba(224,178,60,0.28)',
  },
  abandoned: {
    label: 'Abandoned',
    color: 'var(--color-paper-mute)',
    bg: 'transparent',
    border: 'var(--color-rule-strong)',
  },
  failed: {
    label: 'Failed',
    color: '#C25E5E',
    bg: 'rgba(194,94,94,0.10)',
    border: 'rgba(194,94,94,0.28)',
  },
}
