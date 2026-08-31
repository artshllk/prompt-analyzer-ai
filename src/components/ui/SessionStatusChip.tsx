import { statusOf, STATUS_META } from '@/lib/session-status'

/**
 * Small status pill for a prompt session. Derives the status from the
 * session data (see statusOf) so history and dashboard always agree.
 *
 * This used to render a "22 → 87 +65" delta for improved sessions. Both
 * numbers were model self-reports, the second one produced by the rewrite
 * model marking its own work, and neither was ever written by the path
 * that actually ships. The chip says what happened instead.
 */

interface SessionLike {
  status: string
  finalPrompt: string | null
  createdAt: string
}

export function SessionStatusChip({ session }: { session: SessionLike }) {
  const derived = statusOf(session)
  const meta = STATUS_META[derived]

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-[0.02em] whitespace-nowrap"
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
    >
      {derived === 'needs-answer' && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: meta.color }}
          aria-hidden
        />
      )}
      {meta.label}
    </span>
  )
}
