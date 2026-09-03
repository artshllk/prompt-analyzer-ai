'use client'

import { useMemo } from 'react'
import { buildDisplay, toDisplayRuns, type DisplayRun } from '@/lib/factcheck/display'

/**
 * The pasted document, rendered.
 *
 * BOTH PHASES RENDER THROUGH HERE, and that is the point. Phase one's whole
 * job is showing someone their document arrived intact, so it has to be the
 * same paragraph, the same box, the same type and the same link handling that
 * phase two then marks up. Anything else and the marks arrive on a page that
 * visibly reflows, which reads as the document being replaced rather than
 * annotated.
 *
 * Links render as links. `result.text` carries markdown syntax because claim
 * spans index into that exact string, so it is mapped to display coordinates
 * rather than stripped. See lib/factcheck/display.ts.
 */
export interface Mark {
  id: string
  start: number
  end: number
}

export function DocumentBody({
  text,
  marks = [],
  renderMark,
}: {
  text: string
  /** Claim spans in SOURCE coordinates. Translated here, never before. */
  marks?: Mark[]
  /**
   * How to draw a marked stretch, including one that is also a link.
   *
   * EVERY run carrying a claimId comes here, link or not, because the mark's
   * colour has to survive across a link or the stretch reads as two things.
   * An anchor cannot live inside a button, so when a run has both, the owner
   * renders an anchor wearing the mark's colours: the link keeps the
   * behaviour a reader already predicts, and every other part of the claim
   * stays clickable.
   *
   * Absent in phase one, where nothing is marked yet, which is why that phase
   * needs no claim machinery at all.
   */
  renderMark?: (run: DisplayRun, key: number) => React.ReactNode
}) {
  const runs = useMemo(() => toDisplayRuns(buildDisplay(text), marks), [text, marks])

  return (
    <div
      className="rounded-2xl p-4 sm:p-6"
      style={{ background: 'var(--card)', border: '1px solid var(--rule)' }}
    >
      <p
        className="text-[15px] sm:text-base leading-[1.9] whitespace-pre-wrap wrap-break-word"
        style={{ color: 'var(--ink)' }}
      >
        {runs.map((run, i) => {
          if (run.claimId && renderMark) return renderMark(run, i)
          if (run.href) return <PlainLink key={i} href={run.href} text={run.text} />
          return <span key={i}>{run.text}</span>
        })}
      </p>
    </div>
  )
}

/** An unmarked link. Inherits ink colour so it does not shout over the prose. */
export function PlainLink({ href, text }: { href: string; text: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="underline underline-offset-2 decoration-1 opacity-90 hover:opacity-100"
      style={{ color: 'inherit' }}
    >
      {text}
    </a>
  )
}
