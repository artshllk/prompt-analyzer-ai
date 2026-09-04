'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { MarkedDocument } from '@/components/factcheck/MarkedDocument'
import { DocumentBody } from '@/components/factcheck/DocumentBody'
import { PrintReport } from '@/components/factcheck/PrintReport'
import { useCheckStream } from '@/components/factcheck/useCheckStream'
import { MAX_DOC_CHARS } from '@/lib/factcheck/types'
import { htmlToMarkdown, visibleLength } from '@/lib/factcheck/paste'
import { SAMPLE_DOCUMENT } from '@/lib/factcheck/sample'
import { FAQ_PRIVACY_ANCHOR } from '@/lib/faq'

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

/** The key the label shows before we know what machine is reading it. */
const MAC_KEY = '\u2318'

/** The platform does not change under a running tab, so there is nothing to
 *  subscribe to. Declared once so the store identity is stable. */
const subscribeToNothing = () => () => {}

const readModKey = () =>
  /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? MAC_KEY : 'Ctrl'

/**
 * What the toolbar's status slot says.
 *
 * The design had a green dot and "DOM Engine Ready" here. There is no DOM
 * engine, so the slot was going to be empty. This is the one status about the
 * current session that is both true and enforced on the server: the allowance
 * check at /api/factcheck/check returns 402 on the same number.
 *
 * Null for anonymous visitors. Their ceiling is a best-effort in-memory count
 * on a serverless instance that recycles, and a number we cannot enforce is
 * not one we print.
 */
export interface ChecksLeft {
  remaining: number
  limit: number
}

export function CheckClient({ checksLeft }: { checksLeft?: ChecksLeft | null } = {}) {
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
  const ready = text.trim().length > 0 && !overLimit
  const box = useRef<HTMLTextAreaElement>(null)

  /**
   * THE HINT HAS TO NAME THE KEY THAT ACTUALLY WORKS ON THIS MACHINE.
   *
   * The shortcut itself listens for either modifier, so it works everywhere.
   * The label cannot: printing the Mac symbol to somebody on Windows is a
   * small instruction that is simply false, and this is the page that argues
   * we do not print those.
   *
   * useSyncExternalStore rather than an effect, because the server has no
   * platform to read. It renders the server's value, hydrates against it, and
   * then swaps to the real one, so there is no mismatch and no setState in an
   * effect. The Mac symbol is the server value, so the only machine that sees
   * the label change is one where it was wrong.
   */
  const modKey = useSyncExternalStore(subscribeToNothing, readModKey, () => MAC_KEY)

  function submit() {
    if (!ready) return
    run(text)
  }

  /**
   * The button in the toolbar, and the only reason it is allowed to be there.
   * A prepared document with real links in it, so somebody who has never seen
   * this can watch a check run before deciding to paste their own work.
   */
  function loadSample() {
    setText(SAMPLE_DOCUMENT)
    /**
     * After the frame the value lands in, so this applies to the committed
     * text rather than to the empty box. Measured in a real browser: the
     * textarea ends up focused, with the caret on the first character and
     * scrolled to the top, so the first thing a reader sees of the sample is
     * its first line rather than its last.
     */
    requestAnimationFrame(() => {
      const el = box.current
      if (!el) return
      el.focus()
      el.setSelectionRange(0, 0)
      el.scrollTop = 0
    })
  }

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

  /**
   * THE CONSOLE. Restructured from docs/design/hero-console.html, which is the
   * approved design and is kept unmodified so the two can be compared.
   *
   * Four things in that file were removed because they were not true of this
   * product, and none of them is coming back:
   *
   *   "Import URL"          we take pasted text only. FAQ: can-i-give-you-a-url
   *   "headless chromium"   there is no fetcher here. Tavily extracts, which
   *                         is the whole reason we have no SSRF surface
   *   "DOM Engine Ready"    there is no DOM engine
   *   "v1.4"                invented, and it left with the pill above the box
   *
   * The pill went too. It pulsed, and nothing on this site pulses.
   *
   * Every remaining sentence is checked against the code in the same session
   * it was written, because a hero that overstates what the tool does is the
   * one page where being wrong costs the most.
   */
  return (
    <div>
      <form
        onSubmit={e => {
          e.preventDefault()
          submit()
        }}
        /* 8px, the radius DESIGN.md gives a large container. No drop
           shadow: depth here is the hairline, not a blur.

           The vermilion ring is on the CARD rather than on the textarea,
           because the whole console is the input zone and a 1px outline
           drawn around a borderless textarea inside a bordered card reads
           as a second box rather than as focus. */
        className="rounded-lg overflow-hidden border border-[var(--border-warm)] hover:border-[var(--color-rule-strong)] focus-within:border-[var(--action)] focus-within:shadow-[0_0_0_1px_var(--action)] transition-colors duration-200"
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs bg-[var(--surface-subtle)] border-b border-[var(--border-warm)]">
          <div className="flex items-center gap-1">
            {/* A label, not a control. It was one of three tabs; the other two
                are gone, so making this a button would be a click that does
                nothing. */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium bg-[var(--surface-card)] text-[var(--ink)] border border-[var(--border-warm)]">
              <svg
                className="w-3.5 h-3.5 text-[var(--ink-soft)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Paste article
            </span>
            <button
              type="button"
              onClick={loadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--surface-card)] transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Load a sample
            </button>
          </div>

          <div
            className="flex items-center gap-4 text-[11px]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {/* The check counter. Enforced: route.ts refuses with a 402 on the
                same allowance. Absent for anonymous visitors rather than
                guessed at. */}
            {checksLeft && (
              <span className="tabular-nums" style={{ color: 'var(--ink-soft)' }}>
                <span style={{ color: 'var(--ink)' }}>{checksLeft.remaining}</span> of{' '}
                {checksLeft.limit} checks left
              </span>
            )}

            {/* THE CEILING THE SERVER APPLIES, read from the constant it
                applies it from. A literal here is how the copy and the limit
                drift apart, which has happened four times on this site. */}
            <span
              className="tabular-nums font-medium"
              style={{ color: overLimit ? 'var(--brand-text)' : 'var(--ink-soft)' }}
            >
              {chars.toLocaleString()} / {MAX_DOC_CHARS.toLocaleString()} characters
            </span>
          </div>
        </div>

        {/* The box */}
        <div className="p-5 sm:p-6 bg-[var(--surface-card)]">
          <label htmlFor="doc" className="sr-only">
            Paste your post
          </label>
          <textarea
            id="doc"
            ref={box}
            value={text}
            onChange={e => setText(e.target.value)}
            onPaste={onPaste}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                submit()
              }
            }}
            rows={5}
            /* No statistic in the placeholder. A hero for a tool that checks
               numbers cannot put an unsourced one on the page as decoration. */
            placeholder="Paste your draft, newsletter or blog post here, links and all."
            className="w-full resize-y border-0 p-0 text-[15px] sm:text-base leading-relaxed bg-transparent text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none"
          />

          <div className="flex items-center gap-2 pt-4 mt-2 border-t border-[var(--border-warm)] text-xs text-[var(--ink-soft)]">
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            {/* Points AT the answer instead of describing the mechanism again.
                The old line named the sandbox we do not have. A second
                description of how text is handled is a second thing to keep
                true; a link into the FAQ is not. */}
            <span>
              We do not save your writing.{' '}
              <Link
                href={`/faq#${FAQ_PRIVACY_ANCHOR}`}
                className="underline underline-offset-4 hover:text-[var(--ink)] transition-colors"
              >
                How we handle it
              </Link>
            </span>
          </div>
        </div>

        {/* Action footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-[var(--surface-subtle)] border-t border-[var(--border-warm)]">
          <div className="flex items-start sm:items-center gap-2 text-xs text-[var(--ink-soft)] max-w-xl">
            <svg
              className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              We open every link in your text, so do not paste private ones. We
              do not judge your numbers. We show you the sentence from the page
              and let you decide.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 shrink-0">
            {/* The shortcut is real: the textarea listens for either modifier.
                The label names the one this machine has. */}
            <span
              className="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[var(--surface-card)] border border-[var(--border-warm)] text-[var(--ink-soft)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <kbd style={{ fontFamily: 'var(--font-sans)' }}>{modKey}</kbd> + Enter
            </span>
            {/*
              THE ONE DELIBERATE ACTION ON THE PAGE, so it is the one thing
              wearing the vermilion. It was --ink, which made the most
              important control on the site read as chrome.

              The two inset rims and the 2px ground shadow are DESIGN.md's
              "machined physical stamp": a light top edge, a dark bottom
              edge, and just enough shadow to sit the button on the surface
              rather than float above it. That 2px is the only blur left on
              this page.
            */}
            <button
              type="submit"
              disabled={!ready}
              /* 60%, not 45%. An empty box is the FIRST thing a visitor sees, so the
                 disabled state is the state this button is in at the moment it
                 matters most, and at 45% the primary action read as grey
                 chrome. It still has to look unavailable, so it is dimmed, but
                 it stays recognisably the vermilion. */
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--action)] hover:bg-[var(--action-hover)] active:scale-[0.98] transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[var(--action)]"
              style={{
                boxShadow:
                  'inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 1px 2px rgba(24, 24, 27, 0.08)',
              }}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Check my links
            </button>
          </div>
        </div>
      </form>

      {/* One quiet line, not a button and not a card. Someone arriving cold
          from a shared link needs a way in; someone who already knows should
          not have to step over it.

          THE 114 IS ON THE PAGE THIS POINTS AT. /how-it-works says "We checked
          114 numbers across 11 stats-heavy articles", and check:html asserts
          it, so the promise and the page cannot drift apart quietly. */}
      <div className="text-center mt-4">
        <Link
          href="/how-it-works"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
        >
          <span>How we check a link, and what we found in 114 real numbers</span>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>

      {state.kind === 'error' && (
        <p
          className="mt-4 text-[14px] leading-relaxed rounded-lg p-3"
          style={{
            background: 'var(--diff-discrepancy-bg)',
            border: '1px solid var(--border-warm)',
            color: 'var(--brand-text)',
          }}
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
