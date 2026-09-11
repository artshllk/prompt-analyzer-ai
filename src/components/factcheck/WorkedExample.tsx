import Link from 'next/link'
import { CITATION_AUDIT, FLAG_AUDIT, outOfAudit } from '@/lib/citation-audit'
import { Mark } from '@/components/marketing/SectionFrame'

/**
 * One real mistake, shown the way the product shows it.
 *
 * NEITHER SIDE IS NAMED. See the previous revision for why; nothing about that
 * has changed. The sentence is the example. We do not print the domain.
 *
 * TWO CARDS, EQUAL WIDTH, and this is a reversal of the "one container split
 * by a rule" decision. The manuscript redesign treats each side as a pasted-in
 * clipping: a mono label strip across the top (the archivist's caption), the
 * quoted sentence set in the serif with the numbers marked, and a footer row
 * with the finding and the figures. One summary line runs under both, the way
 * an editor writes the verdict under two clippings.
 *
 * COLOUR RULE. The article's numbers carry the crimson tint and underline
 * because the source does not support them, and crimson is never decoration.
 * The source's numbers carry the amber highlighter: this is what was checked
 * and what the page really says. There is no green on this page.
 *
 * COPY RULE unchanged: link, check, number, source. Never citation, verify,
 * claim, coverage.
 */

function Marked({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="px-[3px] text-[0.8em] font-medium"
      style={{
        fontFamily: 'var(--font-mono)',
        background: 'var(--diff-discrepancy-bg)',
        borderBottom: '2px solid var(--diff-discrepancy)',
      }}
    >
      {children}
    </span>
  )
}

function Checked({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="px-[3px] text-[0.8em] font-medium"
      style={{
        fontFamily: 'var(--font-mono)',
        background: 'var(--guess-bg)',
        borderBottom: '2px solid var(--guess-accent)',
      }}
    >
      {children}
    </span>
  )
}

function Clipping({
  label,
  provenance,
  lead,
  finding,
  figures,
  tone,
  children,
}: {
  label: string
  provenance: string
  lead: string
  finding: string
  figures: string
  tone: 'discrepancy' | 'checked'
  children: React.ReactNode
}) {
  const colour = tone === 'discrepancy' ? 'var(--diff-discrepancy-text)' : 'var(--guess)'
  return (
    <div
      className="rounded-lg flex flex-col"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-warm)' }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-2 text-[10px] uppercase tracking-[0.12em] rounded-t-lg"
        style={{
          background: 'var(--surface-subtle)',
          borderBottom: '1px solid var(--border-warm)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span className="font-medium" style={{ color: 'var(--ink)' }}>{label}</span>
        <span className="truncate" style={{ color: 'var(--ink-soft)' }}>{provenance}</span>
      </div>

      <div className="px-6 pt-6 pb-5 flex-1">
        <p
          className="text-[11px] uppercase tracking-[0.12em]"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
        >
          {lead}
        </p>
        <blockquote
          className="font-serif m-0 mt-3.5 text-[20px] md:text-[24px] leading-[1.45] font-normal"
          style={{ color: 'var(--ink)', textWrap: 'pretty' }}
        >
          “{children}”
        </blockquote>
      </div>

      <div
        className="flex items-center justify-between gap-3 px-6 py-3 text-[11px]"
        style={{ borderTop: '1px solid var(--border-warm)', fontFamily: 'var(--font-mono)' }}
      >
        <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: colour }}>
          <svg className="w-[13px] h-[13px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={
                tone === 'checked'
                  ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  : 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
              }
            />
          </svg>
          {finding}
        </span>
        <span className="tabular-nums" style={{ color: 'var(--ink-soft)' }}>{figures}</span>
      </div>
    </div>
  )
}

export function WorkedExample() {
  return (
    <figure className="m-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.14em] font-medium"
            style={{ color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}
          >
            A real example
          </p>
          <figcaption
            className="font-serif mt-3 text-[28px] md:text-[40px] leading-[1.1] tracking-[-0.015em] text-balance md:min-w-[640px]"
            style={{ color: 'var(--ink)' }}
          >
            A big SEO site wrote this. <Mark>It is still up.</Mark>
          </figcaption>
        </div>
        <div
          className="md:text-right text-[11px] leading-[1.5] shrink-0 md:max-w-[280px]"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
        >
          <span className="block">The figure is on the page, attached to something else.</span>
          <span className="block">
            <span style={{ color: 'var(--ink)' }}>{FLAG_AUDIT.contextMismatch}</span> of{' '}
            <span style={{ color: 'var(--ink)' }}>{FLAG_AUDIT.claims}</span> claims we audited.
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-8">
        <Clipping
          label="Published article claim"
          provenance="SEO blog article · 2024"
          lead="The article says"
          finding="Subjects swapped"
          figures="61.5% desktop · 34.4% mobile"
          tone="discrepancy"
        >
          <Marked>61.5%</Marked> of desktop searches and <Marked>34.4%</Marked> of mobile
          searches end without a click.
        </Clipping>
        <Clipping
          label="Original primary source"
          provenance="Independent research post · 2018"
          lead="The page they link to says"
          finding="What the page shows"
          figures="61.5% mobile · 34.3% desktop"
          tone="checked"
        >
          <Checked>61.5%</Checked> of mobile searches and <Checked>34.3%</Checked> of desktop
          searches end without a click.
        </Clipping>
      </div>

      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5 pt-4"
        style={{ borderTop: '1px solid var(--border-warm)' }}
      >
        <p
          className="m-0 text-[14px] leading-[1.6] max-w-[760px]"
          style={{ color: 'var(--ink-soft)', textWrap: 'pretty' }}
        >
          <strong className="font-semibold" style={{ color: 'var(--ink)' }}>
            The words are swapped, and one number is rounded differently.
          </strong>{' '}
          No spell check or editor would catch it. Half the numbers in posts like this have no
          link at all, and we list those too. It was{' '}
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
            {outOfAudit(CITATION_AUDIT.noSource)}
          </span>{' '}
          in the articles we read.
        </p>
        <Link
          href="/how-it-works"
          className="inline-flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded shrink-0 self-start sm:self-auto"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-warm)',
            color: 'var(--brand-text)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--brand)' }} />
          How we check a link
        </Link>
      </div>
    </figure>
  )
}
