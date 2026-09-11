import { CITATION_AUDIT, outOfAudit, shareOfAudit } from '@/lib/citation-audit'
import { Mark } from '@/components/marketing/SectionFrame'

/**
 * What happens when we cannot check a link.
 *
 * Content only. The section shell (ground, running head, gutter note) is
 * SectionFrame in (marketing)/page.tsx, so this renders inside the measure.
 *
 * The four states and their wording match readability.ts and severity.ts.
 * THE FOOTER NUMBER IS A COUNT, NOT A RATE, read from lib/citation-audit.ts.
 * A card may only carry a number the audit measured.
 *
 * The icons are gone. Four decorative glyphs in the corner of four cards were
 * the one thing on the page that read as a feature grid; the position chip
 * in mono does the telling-apart now.
 */

const STATES: { chip: string; label: string; body: string; count: number }[] = [
  {
    chip: '01',
    label: 'No link at all',
    body: 'Nothing to open, so nothing to check. This is the largest group in every article we have read, and the one writers are most surprised by.',
    count: CITATION_AUDIT.noSource,
  },
  {
    chip: '02',
    label: 'Behind a paywall',
    body: 'We are stopped at the same wall your reader is stopped at. The link is real and it still does not let anyone check you.',
    count: CITATION_AUDIT.paywalled,
  },
  {
    chip: '03',
    label: 'Dead link',
    body: 'The page is gone. Your reader clicks it and lands on nothing, or on a product page that never carried the number.',
    count: CITATION_AUDIT.dead,
  },
  {
    chip: '04',
    label: 'Live dashboard',
    body: 'The page only ever shows today. The number your reader sees is not the number you wrote, and neither of you is wrong.',
    count: CITATION_AUDIT.live,
  },
]

export function CannotCheck() {
  return (
    <div>
      <p className="eyebrow">When we cannot check</p>
      <h2
        className="font-serif mt-3 text-[28px] md:text-[40px] leading-[1.1] tracking-[-0.015em]"
        style={{ color: 'var(--ink)' }}
      >
        We tell you <Mark>which kind of nothing.</Mark>
      </h2>
      <p
        className="mt-4 text-[15px] leading-[1.7] max-w-[620px]"
        style={{ color: 'var(--ink-soft)', textWrap: 'pretty' }}
      >
        Not every link can be opened. Each one gets a reason, and each reason is something
        your reader will hit too. The counts are from{' '}
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
          {CITATION_AUDIT.statistics}
        </span>{' '}
        numbers we read across{' '}
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
          {CITATION_AUDIT.articles}
        </span>{' '}
        articles.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
        {STATES.map(s => (
          <div
            key={s.label}
            className="rounded-lg flex flex-col"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-warm)' }}
          >
            <div className="p-5 flex-1">
              <span
                className="inline-block text-[10px] tracking-[0.12em] px-[7px] py-[3px] rounded-[3px]"
                style={{
                  color: 'var(--ink-soft)',
                  border: '1px solid var(--border-warm)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {s.chip}
              </span>
              <h3 className="mt-4 text-[16px] leading-snug" style={{ color: 'var(--ink)', fontWeight: 600 }}>
                {s.label}
              </h3>
              <p
                className="mt-2 text-[14px] leading-[1.6]"
                style={{ color: 'var(--ink-soft)', textWrap: 'pretty' }}
              >
                {s.body}
              </p>
            </div>
            <div
              className="flex items-baseline justify-between gap-3 px-5 py-3"
              style={{ borderTop: '1px solid var(--border-warm)', fontFamily: 'var(--font-mono)' }}
            >
              <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--ink-soft)' }}>
                In our audit
              </span>
              <span className="text-[12px] tabular-nums" style={{ color: 'var(--ink)' }}>
                {outOfAudit(s.count)}{' '}
                <span style={{ color: 'var(--ink-soft)' }}>{shareOfAudit(s.count)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
