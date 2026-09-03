'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MarkedDocument } from '@/components/factcheck/MarkedDocument'
import { DocumentBody } from '@/components/factcheck/DocumentBody'
import { PrintReport } from '@/components/factcheck/PrintReport'
import { useCheckStream } from '@/components/factcheck/useCheckStream'
import { MAX_DOC_CHARS } from '@/lib/factcheck/types'
import { htmlToMarkdown, visibleLength } from '@/lib/factcheck/paste'

/**
 * Paste, then watch it get checked.
 *
 * THE ORDER IS THE DESIGN. Extraction is one fast call, so every claim appears
 * at once, marked "not checked", and the document is on screen and readable
 * within a few seconds. There is never a blank page behind a spinner, and
 * nothing is held back to be revealed at the end.
 *
 * After that each claim resolves on its own as its check returns, with a line
 * saying what is happening to it. A named action makes a wait feel like work.
 */
/**
 * The label for the phase where we cannot itemise anything.
 *
 * IT CHANGES ONCE, AND THE CHANGE IS THE POINT. A label that never moves for
 * fifteen seconds reads as a page that has stopped. One change tells a person
 * the thing is alive without pretending to know more than we do, and both
 * sentences are literally true of what is happening at the time: the whole
 * document goes to the model, and the model returns the statements worth
 * checking.
 *
 * Eight seconds, because the mean run is fifteen and the label should turn
 * near the middle rather than near either end. On a fast run it still turns
 * before the claims land; on a slow one it is not the last thing that moved.
 *
 * There is no third label. Two is enough to prove liveness and a third would
 * be a narration of a process that has not changed.
 */
const SECOND_LABEL_AT = 8_000

function ReadingLabel() {
  const [late, setLate] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setLate(true), SECOND_LABEL_AT)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="mb-4">
      <p
        className="claim-status text-[14px]"
        aria-live="polite"
        style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
      >
        {late ? 'Finding statements to check' : 'Reading your document'}
      </p>
      {/* The only moving thing on the page, and it claims nothing. It is gone
          the moment there are real claims, because from then on the honest
          signal is those claims resolving. */}
      <div className="reading-line mt-3 max-w-[220px]" aria-hidden="true" />
    </div>
  )
}

export function CheckClient() {
  const [text, setText] = useState('')
  const { state, run, reset } = useCheckStream()

  /**
   * Length excludes markdown link syntax, because that syntax is OUR
   * formatting and not the writer's prose. A 12,000 character article stays
   * 12,000 characters however many links it carries, and the counter under the
   * box shows the same number the limit is applied to.
   */
  const chars = visibleLength(text)
  const overLimit = chars > MAX_DOC_CHARS

  /**
   * A textarea receives only text/plain, so pasting a page out of a browser
   * dropped every link and the checker then reported "no source given" for an
   * article full of sources. The clipboard carries text/html too; this reads
   * that and keeps the hrefs as markdown.
   *
   * Falls through to the browser's own paste whenever there is no HTML on the
   * clipboard or the conversion yields nothing, so plain text keeps working
   * exactly as before.
   */
  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const html = e.clipboardData.getData('text/html')
    if (!html) return
    let md: string
    try {
      md = htmlToMarkdown(html)
    } catch {
      return
    }
    if (!md) return

    e.preventDefault()
    const el = e.currentTarget
    const start = el.selectionStart ?? text.length
    const end = el.selectionEnd ?? start
    const next = text.slice(0, start) + md + text.slice(end)
    setText(next)
    // Put the caret after what was pasted, the way a normal paste would.
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + md.length
    })
  }
  // `extracting` and `checking` both render their own view, so anything left
  // here is idle or an error and the box is always usable.

  /**
   * PHASE ONE. THEIR OWN DOCUMENT, IMMEDIATELY, AND ONE HONEST LABEL.
   *
   * Extraction is one model call over the whole document, measured at 15
   * seconds mean and 18.5 worst. For all of it we know nothing: not how many
   * claims there are, not where they are, not one thing worth itemising. So
   * there is nothing here that counts, because any number would be invented.
   *
   * What there IS, free, is the text they just pasted. Their own words on
   * screen unmarked read as a page waiting to be marked up, which is exactly
   * what it is. A spinner would make the same fifteen seconds read as nothing
   * happening, and a skeleton would make it read as a page failing to load.
   *
   * Nothing here is ever replaced. The same paragraph, in the same box, with
   * the same type, and the same link rendering, is what phase two marks up,
   * so the transition is marks appearing ON a page rather than a page
   * appearing. Both phases go through DocumentBody for exactly that reason.
   */
  if (state.kind === 'extracting') {
    return (
      <div>
        <ReadingLabel />
        {/* No marks yet, and the same renderer phase two uses, so the marks
            arrive ON this paragraph rather than replacing it. */}
        <DocumentBody text={text} />
      </div>
    )
  }

  if (state.kind === 'checking' || state.kind === 'done') {
    const live = state.kind === 'checking'
    return (
      <div>
        {/* The counter. Quiet, factual, and it stops existing when it is
            finished rather than sitting there saying 19 of 19. */}
        {live && (
          <p
            className="claim-status mb-4 text-[14px]"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
          >
            {state.checkable === 0
              ? 'Looking at your links'
              : `Checked ${state.checked} of ${state.checkable}`}
          </p>
        )}

        <MarkedDocument
          text={state.text}
          claims={state.claims}
          density={state.density}
          progress={live ? state.progress : undefined}
          live={live}
        />

        {/* Refusals, collapsed into one line at the end.
            Never streamed individually: they resolve instantly, so emitting
            them one by one would open the run with a wave of amber across half
            the document, and a reader would learn "this tool cannot check
            anything" before a single real answer arrived. */}
        {!live && state.refusals && <RefusalLine refusals={state.refusals} />}

        {/* We stopped ourselves. Everything above this line is real and stays.
            The sentence says what we did not get to, and says whose fault it
            is, because a reader who is not told will assume the silence is a
            verdict. */}
        {!live && state.outOfTime ? (
          <p
            className="mt-5 text-[14px] leading-relaxed rounded-xl p-3"
            style={{ background: 'var(--guess-bg)', color: 'var(--guess)' }}
          >
            We ran out of time on {state.outOfTime === 1 ? 'one source' : `${state.outOfTime} sources`} and
            stopped. Everything above is checked and nothing was charged for
            the part we missed. A shorter section will finish.
          </p>
        ) : null}

        {!live && state.failure && (
          <p
            className="mt-5 text-[14px] leading-relaxed rounded-xl p-3"
            style={{ background: 'var(--guess-bg)', color: 'var(--guess)' }}
          >
            We could not finish checking. That is our problem, not something
            about your writing. Nothing below is a judgement on the links we did
            not reach.
          </p>
        )}

        {!live && state.truncated && (
          <p
            className="mt-5 text-[14px] leading-relaxed rounded-xl p-3"
            style={{ background: 'var(--guess-bg)', color: 'var(--guess)' }}
          >
            {/* Never tell someone to split their own document. Say the cap.
                THE NUMBER HERE IS THE LINK COUNT, NEVER THE CLAIM COUNT. The
                claim count is the model's own, and it came back 91 on one run
                of a document and 24 on the next. A tool that finds
                contradictions cannot print one. Links we parse ourselves, so
                the number is the same every time and a reader who doubts it
                can count them. When there are no links there is no number we
                can stand behind, so we print none. */}
            {state.linkCount > 0 ? (
              <>
                This document has {state.linkCount}{' '}
                {state.linkCount === 1 ? 'link' : 'links'}. We checked the first{' '}
                {state.claims.length} claims.
              </>
            ) : (
              <>We checked the first {state.claims.length} statements. There were more.</>
            )}
          </p>
        )}

        {!live && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="text-[14px] px-4 py-2 rounded-full"
              style={{ background: 'var(--brand)', color: '#fff' }}
            >
              Check another
            </button>
            {/* The browser does the work. Nothing is uploaded, nothing is
                stored, and no route exists, so the promise that we save
                nothing is untouched by the report existing. */}
            <button
              type="button"
              onClick={() => window.print()}
              className="text-[14px] px-4 py-2 rounded-full"
              style={{ border: '1px solid var(--rule)', color: 'var(--ink)' }}
            >
              Save as PDF
            </button>
            <span className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>
              Nothing is uploaded. Your browser makes the file.
            </span>
          </div>
        )}

        {/* Hidden on screen, and the only thing on the page when printing. */}
        {!live && <PrintReport text={state.text} claims={state.claims} />}
      </div>
    )
  }

  return (
    <div>
      <label htmlFor="doc" className="sr-only">
        Paste your post
      </label>
      <textarea
        id="doc"
        value={text}
        onChange={e => setText(e.target.value)}
        onPaste={onPaste}
        rows={10}
        placeholder="Paste your post here."
        className="w-full rounded-2xl p-4 text-[15px] leading-[1.7] resize-y focus:outline-none focus:ring-2"
        style={{
          background: 'var(--card)',
          color: 'var(--ink)',
          border: `1px solid ${overLimit ? 'var(--brand-text)' : 'var(--rule)'}`,
        }}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => run(text)}
          disabled={!text.trim() || overLimit}
          className="text-[15px] px-5 py-2.5 rounded-full disabled:opacity-45 disabled:cursor-not-allowed"
          style={{ background: 'var(--brand)', color: '#fff' }}
        >
          Check my links
        </button>
        <span
          className="text-[13px]"
          style={{
            color: overLimit ? 'var(--brand-text)' : 'var(--ink-soft)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {chars.toLocaleString()} / {MAX_DOC_CHARS.toLocaleString()}
        </span>
      </div>

      {/* One quiet line, not a button and not a card. Someone arriving cold
          from a shared link needs a way in; someone who already knows should
          not have to step over it. */}
      <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        <Link href="/how-it-works" className="underline underline-offset-4">
          How we check a link, and what we found in 114 real numbers
        </Link>
      </p>

      {state.kind === 'error' && (
        <p
          className="mt-4 text-[14px] leading-relaxed rounded-xl p-3"
          style={{ background: 'var(--contradicted-bg)', color: 'var(--brand-text)' }}
        >
          {state.message}
        </p>
      )}
    </div>
  )
}

/**
 * One line for everything we could not open.
 *
 * This is a finding, not an apology. A paywall stops the writer's reader at
 * the same wall we hit, a dead link lands them on nothing, and a live
 * dashboard shows them a different number. Saying so needs no judgement and
 * cannot be a false accusation.
 */
function RefusalLine({
  refusals,
}: {
  refusals: { paywalled: number; dead: number; live: number; noSource: number }
}) {
  const parts: string[] = []
  if (refusals.paywalled) parts.push(`${refusals.paywalled} behind a paywall`)
  if (refusals.dead) parts.push(`${refusals.dead} dead`)
  if (refusals.live) parts.push(`${refusals.live} showing live data`)
  if (refusals.noSource) parts.push(`${refusals.noSource} with no link`)
  const total = refusals.paywalled + refusals.dead + refusals.live + refusals.noSource
  if (total === 0) return null

  return (
    <div
      className="mt-5 rounded-xl p-4"
      style={{ background: 'var(--guess-bg)', border: '1px solid var(--rule)' }}
    >
      <p className="text-[15px] leading-relaxed" style={{ color: 'var(--ink)' }}>
        {total} {total === 1 ? 'number' : 'numbers'} we could not check:{' '}
        {parts.join(', ')}.
      </p>
      <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        Your reader will hit the same wall. Where you can, link to the page the
        number came from.
      </p>
    </div>
  )
}
