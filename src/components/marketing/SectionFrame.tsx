import type { ReactNode } from 'react'

/**
 * The manuscript section shell.
 *
 * Every section on the landing page is one page of a proofed manuscript: a
 * running head (title left, folio right) over a dashed rule, then a two column
 * body with the section number and an editor's note in the gutter and the
 * content in the measure. Five sections share this so the rhythm is one
 * component rather than five hand-tuned copies.
 *
 * Grounds alternate between the parchment itself (`plain`) and a translucent
 * inset tint (`inset`), so the mottled paper shows through both. Sections are
 * separated by a hairline rather than a colour jump.
 *
 * The gutter collapses below md: on a phone the note would push the content
 * under the fold for a sentence nobody came for.
 */
export function SectionFrame({
  index,
  total,
  head,
  note,
  tier = 'plain',
  id,
  children,
}: {
  index: number
  total: number
  /** The running head, set in mono caps. */
  head: string
  /** The editor's note in the gutter. Serif italic, one sentence. */
  note?: string
  tier?: 'plain' | 'inset'
  id?: string
  children: ReactNode
}) {
  const folio = `${index} / ${total}`
  const section = `§ ${String(index).padStart(2, '0')}`
  return (
    <section
      id={id}
      className="px-4 sm:px-6 md:px-[50px] pt-6 md:pt-10 pb-12 md:pb-24"
      style={{
        background: tier === 'inset' ? 'var(--surface-inset)' : 'transparent',
        borderTop: index === 1 ? undefined : '1px solid var(--rule-ground)',
      }}
    >
      <div className="max-w-[1180px] mx-auto">
        <div
          className="flex justify-between pb-2.5 text-[10px] uppercase tracking-[0.16em]"
          style={{
            borderBottom: '1px dashed var(--rule-ground)',
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>{head}</span>
          <span className="tabular-nums">{folio}</span>
        </div>

        <div className="grid md:grid-cols-[168px_minmax(0,1fr)] gap-x-10 gap-y-6 pt-10 md:pt-16">
          <aside className="md:pt-2">
            <div
              className="text-[11px] tracking-[0.12em] uppercase"
              style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
            >
              {section}
            </div>
            {note && (
              <p
                className="font-serif mt-3.5 text-[15px] leading-[1.45] hidden md:block"
                style={{ color: 'var(--ink-soft)', fontStyle: 'italic', textWrap: 'pretty' }}
              >
                {note}
              </p>
            )}
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  )
}

/** The highlighter mark behind a phrase in a heading. Amber, never crimson. */
export function Mark({ children }: { children: ReactNode }) {
  return <span className="mark">{children}</span>
}
