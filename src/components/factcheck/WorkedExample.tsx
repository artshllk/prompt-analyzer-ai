import Link from 'next/link'
import { CITATION_AUDIT, FLAG_AUDIT, outOfAudit } from '@/lib/citation-audit'

/**
 * One real mistake, shown the way the product shows it.
 *
 * WHY THIS EXISTS. The page used to describe the mechanism, which tells a
 * visitor what we do and never tells them why they should care. This is a real
 * error found on a real, well-known SEO site.
 *
 * NEITHER SIDE IS NAMED. The publisher who made the mistake is anonymous
 * because the error is public but naming them to sell a tool is a different
 * act from telling them privately, and we have not told them. The primary
 * source, who got it right, is anonymous for the plainer reason that they are
 * a real company who never agreed to appear in our marketing. We quote the
 * sentence, because the sentence is the example. We do not print the domain.
 *
 * Static and pre-rendered. No API call, no state, visible on first paint
 * before anyone types a word.
 *
 * COPY RULE, stricter here than anywhere else on the site: basic English, read
 * once and understood. The words "citation", "verify", "claim" and "coverage"
 * do not appear in the prose. It says link, check, number, source.
 *
 * ===================================================================
 * ONE CONTAINER SPLIT DOWN THE MIDDLE, NOT TWO CARDS WITH A GAP
 * ===================================================================
 *
 * Adapted from the diff-inspector mockup, and this is the part of it worth
 * having. Two separate cards read as two exhibits that happen to sit near each
 * other; one container split by a 1px rule reads as a single instrument
 * showing both halves of one comparison, which is what DESIGN.md means by
 * "side-by-side grid split by a central rule".
 *
 * Every structural slot in that mockup is used. What is NOT used is everything
 * it invented to fill them, because a mockup may invent and a page may not:
 *
 *   "Case ID #084-SEO"                no case numbering exists
 *   "Captured via Live Link Spider"   no crawler. Tavily extracts
 *   "Verified Match from Target DOM"  nothing here reads a DOM
 *   "Paragraph 8, Sentence 2"         position is not tracked
 *   "Article anchor text: ..."        not captured
 *   "Zero human opinion. Raw text"    a model judges, and the citation axis is
 *                                     a model call, not a string match
 *   the quote lead-ins                "According to recent search query
 *                                     research," and "our deep sample
 *                                     confirmed that" are fabricated fragments
 *                                     inside quotation marks, attributed to
 *                                     real publications
 *
 * The slots are filled from the audits instead, which is the same shape of
 * information and is true. See lib/citation-audit.ts.
 */

/**
 * The two diff marks, per DESIGN.md: a tinted fill with an underline rather
 * than a tooltip or a floating callout. The mockup's `border-b-2` is the same
 * idea and holds up better than a text-decoration at this size, so the rule is
 * a real border and the fill carries the hue.
 */
function Marked({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded font-semibold"
      style={{
        background: 'var(--diff-discrepancy-bg)',
        color: 'var(--diff-discrepancy-text)',
        borderBottom: '2px solid var(--diff-discrepancy)',
      }}
    >
      {children}
    </span>
  )
}

/** The mark on a number that the page really does carry. */
function Confirmed({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded font-semibold"
      style={{
        background: 'var(--diff-verified-bg)',
        color: 'var(--diff-verified-text)',
        borderBottom: '2px solid var(--diff-verified)',
      }}
    >
      {children}
    </span>
  )
}

/** The round status badge the mockup puts at the end of each column head. */
function StatusBadge({ confirm }: { confirm: boolean }) {
  return (
    <span
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
      style={{
        background: confirm ? 'var(--diff-verified-bg)' : 'var(--diff-discrepancy-bg)',
        color: confirm ? 'var(--diff-verified-text)' : 'var(--diff-discrepancy-text)',
      }}
      aria-hidden="true"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={confirm ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}
        />
      </svg>
    </span>
  )
}

/**
 * One half of the comparison. Both halves are the same component, so the two
 * sides cannot drift apart structurally the way two hand-written cards would.
 */
function Column({
  chip,
  subtitle,
  lead,
  confirm,
  finding,
  figures,
  children,
}: {
  chip: string
  subtitle: string
  lead: string
  confirm: boolean
  finding: string
  figures: string
  children: React.ReactNode
}) {
  const colour = confirm ? 'var(--diff-verified-text)' : 'var(--diff-discrepancy-text)'
  return (
    <div
      className="p-6 sm:p-7 flex flex-col justify-between"
      /* The source column steps down one tier. Both halves on identical white
         read as one wide block; one step apart, the eye knows there are two
         things being compared before it reads either. */
      style={{ background: confirm ? 'var(--surface)' : 'var(--surface-card)' }}
    >
      <div>
        <div
          className="flex items-center justify-between gap-2 pb-4 mb-5"
          style={{ borderBottom: '1px solid var(--border-warm)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.12em] font-semibold shrink-0"
              style={{
                background: confirm ? 'var(--diff-verified-bg)' : 'var(--diff-discrepancy-bg)',
                border: `1px solid ${confirm ? 'var(--diff-verified-line)' : 'var(--diff-discrepancy-line)'}`,
                color: colour,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {chip}
            </span>
            <span
              className="text-xs truncate"
              style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
            >
              {subtitle}
            </span>
          </div>
          <StatusBadge confirm={confirm} />
        </div>

        {/* Both columns carry a lead-in, so the two quotes start on the same
            line. Without it the eye travels diagonally to compare them, which
            is the work this layout exists to remove. */}
        <p
          className="text-[11px] uppercase tracking-[0.12em] mb-2 font-medium"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
        >
          {lead}
        </p>
        <blockquote
          className="m-0 text-base sm:text-lg leading-relaxed mb-6 wrap-break-word"
          style={{ color: 'var(--ink)' }}
        >
          {children}
        </blockquote>
      </div>

      {/* The annotation footer. The finding on the left, the figures on the
          right, so the two footers sit level and the swap reads straight
          across without going back into the prose. */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 pt-4 text-xs"
        style={{ borderTop: '1px solid var(--border-warm)', fontFamily: 'var(--font-mono)' }}
      >
        <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: colour }}>
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={
                confirm
                  ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  : 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
              }
            />
          </svg>
          {finding}
        </span>
        <span className="text-[11px] tabular-nums" style={{ color: 'var(--ink-soft)' }}>
          {figures}
        </span>
      </div>
    </div>
  )
}

/**
 * THE `onDark` PROP IS GONE with the dark mount it existed for. It switched
 * the header text between --inverse-on-surface and --ink, and there is now one
 * caller passing one value. A branch nobody exercises is a branch that rots.
 */
export function WorkedExample() {
  return (
    <figure className="m-0">
      {/* Header row: eyebrow and heading left, provenance right. The mockup
          fills the right slot with a capture method and a document
          description, both invented. This is the audit the finding came from,
          read from the counts in docs/citation-audit/flags-by-cause.md. */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.14em] font-semibold mb-2"
            style={{ color: 'var(--action)', fontFamily: 'var(--font-mono)' }}
          >
            A real example
          </p>
          <figcaption
            className="font-serif text-2xl sm:text-3xl md:text-[34px] leading-tight tracking-[-0.01em]"
            style={{ color: 'var(--ink)' }}
          >
            A big SEO site wrote this. It is still up.
          </figcaption>
        </div>
        <div
          className="sm:text-right text-[11px] leading-tight shrink-0"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
        >
          <span className="block">The figure is on the page, attached to something else.</span>
          <span className="block">
            {FLAG_AUDIT.contextMismatch} of {FLAG_AUDIT.claims} claims we audited.
          </span>
        </div>
      </div>

      {/* ONE container, split by a central rule. Not two cards with a gap. */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-warm)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-warm)]">
          <Column
            chip="Published article claim"
            subtitle="SEO blog article (2024)"
            lead="The article says"
            confirm={false}
            finding="Subjects swapped"
            figures="61.5% desktop · 34.4% mobile"
          >
            <Marked>61.5% of desktop searches</Marked> and{' '}
            <Marked>34.4% of mobile searches</Marked> end without a click.
          </Column>

          <Column
            chip="Original primary source"
            subtitle="Independent research post (2018)"
            lead="The page they link to says"
            confirm
            finding="What the page shows"
            figures="61.5% mobile · 34.3% desktop"
          >
            <Confirmed>61.5% of mobile searches</Confirmed> and{' '}
            <Confirmed>34.3% of desktop searches</Confirmed> end without a click.
          </Column>
        </div>

        {/* The takeaway bar, spanning both columns. It carries the no-link line
            too, which used to float underneath the whole block as a loose
            sentence with nothing holding it. */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5"
          style={{ background: 'var(--surface-subtle)', borderTop: '1px solid var(--border-warm)' }}
        >
          <div
            className="flex items-start sm:items-center gap-2.5 text-xs"
            style={{ color: 'var(--ink-soft)' }}
          >
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-warm)',
                color: 'var(--ink-soft)',
              }}
              aria-hidden="true"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <span>
              <strong className="font-semibold" style={{ color: 'var(--ink)' }}>
                The words are swapped, and one number is rounded differently.
              </strong>{' '}
              No spell check or editor would catch it. Half the numbers in posts
              like this have no link at all, and we list those too. It was{' '}
              {outOfAudit(CITATION_AUDIT.noSource)} in the articles we read.
            </span>
          </div>

          {/* The mockup's chip said "Zero human opinion. Raw text match." A
              model judges, so that is an overclaim twice over. A link to the
              page that explains the method claims nothing and is the thing a
              reader who wants more actually needs. */}
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded shrink-0 self-start sm:self-auto transition-colors hover:text-[var(--ink)]"
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-warm)',
              color: 'var(--ink-soft)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: 'var(--action)' }}
            />
            How we check a link
          </Link>
        </div>
      </div>
    </figure>
  )
}
