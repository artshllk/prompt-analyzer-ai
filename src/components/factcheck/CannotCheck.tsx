import { CITATION_AUDIT, outOfAudit, shareOfAudit } from '@/lib/citation-audit'

/**
 * What happens when we cannot check a link.
 *
 * THIS WAS MISSING FROM THE HOMEPAGE ENTIRELY, and it is the most
 * differentiating thing on the site. It only appeared in the results panel
 * after somebody had already pasted an article, so the one idea nobody else
 * has was invisible to everyone who had not already committed.
 *
 * It is also the honest part. Every other checker either judges a source it
 * could not read or says nothing at all. Saying WHICH KIND of nothing is the
 * whole argument, and it costs no judgement to say, so it can never be a false
 * accusation.
 *
 * The four states and their wording match readability.ts and severity.ts, so
 * the promise on this page is word for word what the product does.
 *
 * ===================================================================
 * THE FOOTER NUMBER IS A COUNT, NOT A RATE
 * ===================================================================
 *
 * Each card ends with how often this happened in the citation audit, read from
 * `lib/citation-audit.ts`, which is read from `docs/citation-audit/coverage.md`.
 * They are stated as "55 of 114" with the percentage after it, because a
 * reader can check a count against the published table and cannot check a
 * percentage against anything.
 *
 * A card may only carry a number the audit measured. There is no cell here for
 * an HTTP status, a DNS result or a refresh interval, because the audit
 * counted none of those and a plausible-looking one would be the sixth
 * copy-versus-reality bug on this site rather than the first of a new kind.
 */

const STATES: {
  /** Position, so the chip is a label that cannot be wrong. */
  chip: string
  label: string
  body: string
  /** How many of the audited statistics landed here. */
  count: number
  icon: () => React.ReactElement
}[] = [
  {
    chip: '01',
    label: 'No link at all',
    body: 'Nothing to open, so nothing to check. This is the largest group in every article we have read, and the one writers are most surprised by.',
    count: CITATION_AUDIT.noSource,
    icon: NoLinkIcon,
  },
  {
    chip: '02',
    label: 'Behind a paywall',
    body: 'We are stopped at the same wall your reader is stopped at. The link is real and it still does not let anyone check you.',
    count: CITATION_AUDIT.paywalled,
    icon: LockIcon,
  },
  {
    chip: '03',
    label: 'Dead link',
    body: 'The page is gone. Your reader clicks it and lands on nothing, or on a product page that never carried the number.',
    count: CITATION_AUDIT.dead,
    icon: DeadIcon,
  },
  {
    chip: '04',
    label: 'Live dashboard',
    body: 'The page only ever shows today. The number your reader sees is not the number you wrote, and neither of you is wrong.',
    count: CITATION_AUDIT.live,
    icon: LiveIcon,
  },
]

export function CannotCheck() {
  return (
    <section
      className="px-6 md:px-10 py-20 md:py-28"
      /* surface, the page ground. It sits between two surface-subtle bands,
         so it needs no rule of its own: the ground changes on both edges. */
      style={{ background: 'var(--surface)' }}
    >
      <div className="max-w-[1180px] mx-auto">
        <div className="max-w-2xl mb-10 md:mb-12">
          <p className="eyebrow mb-4">When we cannot check</p>
          <h2
            className="display text-3xl md:text-4xl leading-[1.1]"
            style={{ color: 'var(--ink)' }}
          >
            We tell you which kind of nothing.
          </h2>
          <p className="mt-4 text-[15px] leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>
            Not every link can be opened. Each one gets a reason, and each reason
            is something your reader will hit too. The counts are from{' '}
            {CITATION_AUDIT.statistics} numbers we read across{' '}
            {CITATION_AUDIT.articles} articles.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {STATES.map(s => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="rounded-lg flex flex-col"
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-warm)',
                }}
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="text-[11px] tracking-[0.12em]"
                      style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
                    >
                      {s.chip}
                    </span>
                    <span style={{ color: 'var(--guess-accent)' }} aria-hidden="true">
                      <Icon />
                    </span>
                  </div>
                  <h3
                    className="mt-4 text-[16px] leading-snug"
                    style={{ color: 'var(--ink)', fontWeight: 600 }}
                  >
                    {s.label}
                  </h3>
                  <p
                    className="mt-2 text-[14px] leading-[1.6]"
                    style={{ color: 'var(--ink-soft)' }}
                  >
                    {s.body}
                  </p>
                </div>
                <div
                  className="flex items-baseline justify-between gap-3 px-5 py-3"
                  style={{ borderTop: '1px solid var(--border-warm)' }}
                >
                  <span
                    className="text-[10px] uppercase tracking-[0.12em]"
                    style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
                  >
                    In our audit
                  </span>
                  <span
                    className="text-[12px] tabular-nums"
                    style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}
                  >
                    {outOfAudit(s.count)}{' '}
                    <span style={{ color: 'var(--ink-soft)' }}>{shareOfAudit(s.count)}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* Four distinct marks, so the cards are told apart before they are read. */

function NoLinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-2 2a4 4 0 105.656 5.656M3 3l18 18"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  )
}

function DeadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 14L21 3m0 0h-6m6 0v6M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"
      />
    </svg>
  )
}

function LiveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l2.5 2.5M12 21a9 9 0 110-18 9 9 0 010 18z"
      />
    </svg>
  )
}
