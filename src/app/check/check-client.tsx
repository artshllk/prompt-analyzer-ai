'use client'

import { useState } from 'react'
import { MarkedDocument } from '@/components/factcheck/MarkedDocument'
import { useCheckStream } from '@/components/factcheck/useCheckStream'
import { MAX_DOC_CHARS } from '@/lib/factcheck/types'

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
export function CheckClient() {
  const [text, setText] = useState('')
  const { state, run, reset } = useCheckStream()

  const chars = text.length
  const overLimit = chars > MAX_DOC_CHARS
  const busy = state.kind === 'extracting' || state.kind === 'checking'

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
            This post had {state.foundCount} numbers in it. We show the first{' '}
            {state.claims.length}. Try one section at a time to see the rest.
          </p>
        )}

        {!live && (
          <div className="mt-6">
            <button
              type="button"
              onClick={reset}
              className="text-[14px] px-4 py-2 rounded-full"
              style={{ background: 'var(--brand)', color: '#fff' }}
            >
              Check another
            </button>
          </div>
        )}
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
        rows={10}
        placeholder="Paste your post here."
        disabled={busy}
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
          disabled={busy || !text.trim() || overLimit}
          className="text-[15px] px-5 py-2.5 rounded-full disabled:opacity-45 disabled:cursor-not-allowed"
          style={{ background: 'var(--brand)', color: '#fff' }}
        >
          {state.kind === 'extracting' ? 'Reading your post' : 'Check my links'}
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
