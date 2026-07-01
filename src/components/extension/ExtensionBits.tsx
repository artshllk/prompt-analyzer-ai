/**
 * Small presentational pieces for the /extension redesign: benefit cards,
 * step chips, and trust chips. Server components (no interactivity) styled
 * with the existing editorial tokens.
 */

export function BenefitCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="card-editorial p-6 md:p-7">
      <div
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
        style={{
          background: 'var(--color-accent-soft)',
          color: 'var(--color-accent-bright)',
          border: '1px solid rgba(91,143,237,0.25)',
        }}
        aria-hidden
      >
        {icon}
      </div>
      <h3 className="text-base font-medium mb-1.5" style={{ color: 'var(--color-paper)' }}>
        {title}
      </h3>
      <p className="text-sm leading-[1.55]" style={{ color: 'var(--color-paper-mute)' }}>
        {body}
      </p>
    </div>
  )
}

export function StepChip({ n, label }: { n: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold tabular-nums shrink-0"
        style={{
          background: 'var(--color-accent-soft)',
          color: 'var(--color-accent-bright)',
          border: '1px solid rgba(91,143,237,0.25)',
        }}
      >
        {n}
      </span>
      <span className="text-sm md:text-base" style={{ color: 'var(--color-paper)' }}>
        {label}
      </span>
    </div>
  )
}

export function TrustChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px]"
      style={{ color: 'var(--color-paper-mute)', border: '1px solid var(--color-rule-strong)' }}
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </span>
  )
}

/* Simple stroked icons for the benefit cards. */
export const IconInPlace = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 13L8.5 10.5L10.5 12.5L14 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconOneClick = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M8 3.5V9M8 9L5 12.5L6.5 14L10 17L15.5 12.5L12 10L10.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconPrivate = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="4" y="8.5" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 8.5V6.5C7 4.84 8.34 3.5 10 3.5C11.66 3.5 13 4.84 13 6.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
