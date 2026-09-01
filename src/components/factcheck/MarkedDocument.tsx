'use client'

import { useMemo, useState } from 'react'
import { toRenderRuns, unanchoredClaims, countByState } from '@/lib/factcheck/spans'
import type { Claim, ClaimState } from '@/lib/factcheck/types'

/**
 * The document, with its checkable claims marked.
 *
 * COLOUR CARRIES MEANING, AND THE MEANINGS ARE NOT SYMMETRICAL.
 *
 * Amber is the resting state and it is safe. Red accuses the writer of
 * something and it is not. So red never appears without evidence attached,
 * and the component enforces that rather than trusting whatever produced the
 * verdict: a contradicted claim with no evidence renders amber, because a red
 * mark the reader cannot check is just our opinion in an alarming colour.
 *
 * This is a rewrite of LabelledPrompt, not a reuse of it. That component's
 * control is hardcoded to one state and its whole model is "remove the thing
 * you did not ask for". Here nothing is removed. The document is the writer's
 * and we annotate it, we do not edit it.
 */

const STYLE: Record<ClaimState, { fg: string; bg: string; label: string }> = {
  verified: {
    fg: 'var(--confirm)',
    bg: 'var(--confirm-bg)',
    label: 'Verified',
  },
  unverifiable: {
    fg: 'var(--guess)',
    bg: 'var(--guess-bg)',
    label: 'Unverifiable',
  },
  contradicted: {
    fg: 'var(--contradicted)',
    bg: 'var(--contradicted-bg)',
    label: 'Contradicted',
  },
}

/**
 * What a claim is allowed to look like.
 *
 * The one place the governing rule is enforced in the UI: a `contradicted`
 * verdict with no evidence is downgraded to `unverifiable` before anything is
 * painted. Belt and braces over judge.ts, because this is the last gate before
 * a colour reaches a person.
 */
function displayState(claim: Claim): ClaimState {
  if (claim.verdict.state === 'contradicted' && claim.verdict.evidence.length === 0) {
    return 'unverifiable'
  }
  return claim.verdict.state
}

export function MarkedDocument({ text, claims }: { text: string; claims: Claim[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  const runs = useMemo(() => toRenderRuns(text, claims), [text, claims])
  const listed = useMemo(() => unanchoredClaims(claims), [claims])
  const counts = useMemo(() => countByState(claims), [claims])
  const byId = useMemo(() => new Map(claims.map(c => [c.id, c])), [claims])

  const open = openId ? byId.get(openId) ?? null : null

  return (
    <div>
      <Summary counts={counts} />

      <div
        className="mt-5 rounded-2xl p-4 sm:p-6"
        style={{ background: 'var(--card)', border: '1px solid var(--rule)' }}
      >
        <p
          className="text-[15px] sm:text-base leading-[1.9] whitespace-pre-wrap wrap-break-word"
          style={{ color: 'var(--ink)' }}
        >
          {runs.map((run, i) => {
            if (!run.claimId) return <span key={i}>{run.text}</span>
            const claim = byId.get(run.claimId)
            if (!claim) return <span key={i}>{run.text}</span>
            const state = displayState(claim)
            const s = STYLE[state]
            const isOpen = openId === claim.id
            return (
              <button
                key={i}
                type="button"
                onClick={() => setOpenId(isOpen ? null : claim.id)}
                aria-expanded={isOpen}
                aria-label={`${s.label}: ${claim.claimText}`}
                /* Inline, so it sits in the paragraph rather than breaking it.
                   -my-1 py-1 grows the hit area without pushing the line
                   height around mid-paragraph. */
                className="inline text-left -my-1 py-1 px-1 rounded-md transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{
                  background: s.bg,
                  color: s.fg,
                  boxShadow: isOpen
                    ? `inset 0 0 0 2px ${s.fg}`
                    : `inset 0 0 0 1px ${s.fg}33`,
                }}
              >
                {run.text}
              </button>
            )
          })}
        </p>
      </div>

      {open && <EvidencePanel claim={open} onClose={() => setOpenId(null)} />}

      {listed.length > 0 && <UnplacedList claims={listed} />}
    </div>
  )
}

function Summary({
  counts,
}: {
  counts: { verified: number; unverifiable: number; contradicted: number; total: number }
}) {
  if (counts.total === 0) {
    return (
      <p className="text-[15px]" style={{ color: 'var(--ink-soft)' }}>
        No checkable claims found. That is a real answer, not a failure: this
        document does not assert anything a reader could look up.
      </p>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <span
        className="text-[15px]"
        style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}
      >
        {counts.total} checkable {counts.total === 1 ? 'claim' : 'claims'}
      </span>
      {counts.contradicted > 0 && (
        <Tally n={counts.contradicted} label="contradicted" state="contradicted" />
      )}
      {counts.verified > 0 && <Tally n={counts.verified} label="verified" state="verified" />}
      {counts.unverifiable > 0 && (
        <Tally n={counts.unverifiable} label="not checked yet" state="unverifiable" />
      )}
    </div>
  )
}

function Tally({ n, label, state }: { n: number; label: string; state: ClaimState }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[13px]"
      style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
    >
      <span
        className="inline-block w-2.5 h-2.5 rounded-sm"
        style={{ background: STYLE[state].fg }}
        aria-hidden
      />
      {n} {label}
    </span>
  )
}

function EvidencePanel({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  const state = displayState(claim)
  const s = STYLE[state]
  return (
    <div
      className="mt-4 rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--card)', border: `1px solid ${s.fg}` }}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className="text-[12px] uppercase tracking-[0.12em]"
          style={{ color: s.fg, fontFamily: 'var(--font-mono)' }}
        >
          {s.label}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-[13px] underline underline-offset-4 opacity-70 hover:opacity-100"
          style={{ color: 'var(--ink-soft)' }}
        >
          Close
        </button>
      </div>

      <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--ink)' }}>
        {claim.claimText}
      </p>

      {claim.verdict.note && (
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          {claim.verdict.note}
        </p>
      )}

      {claim.verdict.evidence.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {claim.verdict.evidence.map((e, i) => (
            <li
              key={i}
              className="text-[14px] leading-relaxed pl-3"
              style={{ borderLeft: `2px solid ${s.fg}`, color: 'var(--ink)' }}
            >
              <span className="block">{e.quote}</span>
              <a
                href={e.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-1 inline-block text-[13px] underline underline-offset-4 wrap-break-word"
                style={{ color: 'var(--brand-text)' }}
              >
                {e.title || e.url}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        /* No evidence is the honest state right now, and saying which KIND of
           nothing matters: "we looked and found nothing" and "nobody has
           looked yet" are different facts about the same amber mark. */
        <p className="mt-4 text-[14px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          {claim.verdict.reason === 'not_checked'
            ? 'Nothing has checked this yet. It is listed so you know it is the kind of thing a reader could challenge.'
            : 'No source was found that settles this either way. That is not evidence it is wrong.'}
        </p>
      )}
    </div>
  )
}

function UnplacedList({ claims }: { claims: Claim[] }) {
  return (
    <div className="mt-6">
      <p className="eyebrow mb-3">Also found, but not marked above</p>
      <p className="text-[13px] mb-3 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        We could not match these to an exact place in your text, so they are
        listed rather than highlighted. Marking the wrong sentence would be
        worse than not marking one.
      </p>
      <ul className="space-y-2">
        {claims.map(c => (
          <li
            key={c.id}
            className="text-[14px] leading-relaxed pl-3"
            style={{
              borderLeft: `2px solid ${STYLE[displayState(c)].fg}`,
              color: 'var(--ink)',
            }}
          >
            {c.claimText}
          </li>
        ))}
      </ul>
    </div>
  )
}
