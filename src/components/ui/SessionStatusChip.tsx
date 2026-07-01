import { statusOf, STATUS_META } from '@/lib/session-status'

/**
 * Small status pill for a prompt session. Derives the status from the
 * session data (see statusOf) so history and dashboard always agree.
 * When the session was improved, the score delta reads better than the
 * label, so callers can pass `showDeltaWhenImproved` to render the
 * before → after +lift instead of the "Improved" chip.
 */

interface SessionLike {
  status: string
  clarityScoreBefore: number | null
  clarityScoreAfter: number | null
  createdAt: string
}

export function SessionStatusChip({ session }: { session: SessionLike }) {
  const derived = statusOf(session)
  const meta = STATUS_META[derived]

  // For an improved session, the delta is the headline; show it inline.
  if (derived === 'improved' && session.clarityScoreBefore != null && session.clarityScoreAfter != null) {
    const lift = session.clarityScoreAfter - session.clarityScoreBefore
    return (
      <span className="inline-flex items-center gap-2 text-sm tabular-nums">
        <span style={{ color: 'var(--color-paper-mute)' }}>{session.clarityScoreBefore}</span>
        <span style={{ color: 'var(--color-paper-mute)' }}>→</span>
        <span style={{ color: 'var(--color-paper)' }}>{session.clarityScoreAfter}</span>
        {lift > 0 && <span style={{ color: '#5FBE8C' }}>+{lift}</span>}
      </span>
    )
  }

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
