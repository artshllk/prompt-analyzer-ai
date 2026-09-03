'use client'

import { useMemo, useState } from 'react'
import {
  resolveOverlaps,
  unanchoredClaims,
  firstPartyClaims,
  countByVerdict,
  citationsToFix,
  nothingToCheck,
} from '@/lib/factcheck/spans'
import { rankFlags } from '@/lib/factcheck/flags'
import { DocumentBody } from '@/components/factcheck/DocumentBody'
import { groupFindings, summaryLines, FINDINGS_SHOWN } from '@/lib/factcheck/severity'
import type { Finding, GroupedFindings } from '@/lib/factcheck/severity'
import type { Claim, ClaimVerdict, CitationDensity } from '@/lib/factcheck/types'

/**
 * The document, with its checkable claims marked on two axes.
 *
 * COLOUR IS ONE AXIS AND ONLY ONE. Fill colour says whether the claim is
 * true. Underline says whether the source the writer cited actually shows it.
 * Two colours on one span would break the rule the whole design system rests
 * on, that colour carries exactly one meaning, and it would make the most
 * common real defect (a TRUE claim behind a link that does not show it) into
 * an unreadable smear of green and red.
 *
 * Dotted underline is the copy editor's "check this reference". It is a
 * different gesture from "this is wrong", which is what it means, and being a
 * line rather than a hue it survives colourblindness.
 *
 * COLOUR NEVER ACCUSES WITHOUT EVIDENCE. displayVerdict() downgrades an
 * evidence-free contradiction to unchecked before anything is painted. That is
 * belt and braces over judge.ts, because this is the last gate before a colour
 * reaches a person, and a red mark the reader cannot check is just our opinion
 * in an alarming colour.
 */

const STYLE: Record<ClaimVerdict, { fg: string; bg: string; label: string }> = {
  verified: { fg: 'var(--confirm)', bg: 'var(--confirm-bg)', label: 'Verified' },
  unchecked: { fg: 'var(--guess)', bg: 'var(--guess-bg)', label: 'Not checked' },
  contradicted: {
    fg: 'var(--contradicted)',
    bg: 'var(--contradicted-bg)',
    label: 'Contradicted',
  },
}

/** The last gate before a colour reaches a person. */
function displayVerdict(claim: Claim): ClaimVerdict {
  if (claim.judgement.verdict === 'contradicted' && claim.judgement.evidence.length === 0) {
    return 'unchecked'
  }
  return claim.judgement.verdict
}

/**
 * The citation axis as a line rather than a colour.
 *
 * `not_applicable` gets nothing at all. An absent line is the correct
 * rendering of "there was nothing to check", and drawing something would
 * imply we looked.
 */
function underlineFor(claim: Claim): string | undefined {
  switch (claim.citation.check) {
    case 'supports':
      return 'underline solid 1.5px'
    case 'does_not_contain':
      return 'underline dotted 2px'
    case 'source_unreachable':
      return 'underline dashed 1.5px'
    default:
      return undefined
  }
}

export function MarkedDocument({
  text,
  claims,
  density,
  progress,
  live,
}: {
  text: string
  claims: Claim[]
  density: CitationDensity
  /** Which claims are mid-check, and what is happening to them. */
  progress?: Record<string, { stage: string; host?: string }>
  /** True while the stream is still running. Suppresses end-of-run summaries. */
  live?: boolean
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  /**
   * When there is nothing to check, there is nothing to mark. Summary says so
   * in words; painting twenty uncheckable lines underneath would contradict
   * it and give the reader a wall to scroll past anyway.
   */
  const empty = useMemo(() => nothingToCheck(claims), [claims])
  // Memoised, not a bare conditional: a new array identity on every render
  // would defeat every useMemo below that depends on it.
  const marked = useMemo(() => (empty ? [] : claims), [empty, claims])
  /**
   * Spans in SOURCE coordinates. DocumentBody translates them, because the
   * source string is what the extractor anchored against and mutating it
   * would move every mark.
   */
  const markSpans = useMemo(
    () =>
      resolveOverlaps(marked)
        .filter(c => c.span)
        .map(c => ({ id: c.id, start: c.span!.start, end: c.span!.end })),
    [marked]
  )
  const flags = useMemo(() => rankFlags(marked, text.length), [marked, text])
  const findings = useMemo(() => groupFindings(marked), [marked])
  const listed = useMemo(() => unanchoredClaims(marked), [marked])
  const mine = useMemo(() => firstPartyClaims(marked), [marked])
  const byId = useMemo(() => new Map(claims.map(c => [c.id, c])), [claims])

  const open = openId ? byId.get(openId) ?? null : null

  return (
    <div>
      <DensityBanner density={density} />
      <Summary claims={claims} />

      <div className="mt-5">
        <DocumentBody
          text={text}
          marks={markSpans}
          renderMark={(run, i) => {
            const claim = byId.get(run.claimId!)
            if (!claim) return <span key={i}>{run.text}</span>
            const v = displayVerdict(claim)
            const s = STYLE[v]
            const isOpen = openId === claim.id
            const skin = {
              background: s.bg,
              color: s.fg,
              textDecoration: underlineFor(claim),
              textUnderlineOffset: '3px',
              boxShadow: isOpen ? `inset 0 0 0 2px ${s.fg}` : `inset 0 0 0 1px ${s.fg}33`,
            }
            /* Inline, so it sits in the paragraph rather than breaking it.
               -my-1 py-1 grows the hit area without pushing the line height
               around mid-paragraph. */
            const shape = 'claim-mark inline text-left -my-1 py-1 px-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1'

            // A link inside the claim. The anchor wins the click and wears the
            // mark's colours, so the stretch still reads as one thing.
            if (run.href) {
              return (
                <a
                  key={i}
                  href={run.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={shape}
                  style={skin}
                >
                  {run.text}
                </a>
              )
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => setOpenId(isOpen ? null : claim.id)}
                aria-expanded={isOpen}
                aria-label={`${s.label}: ${claim.claimText}`}
                className={shape}
                style={skin}
              >
                {run.text}
              </button>
            )
          }}
        />
      </div>

      {progress && <NowChecking claims={claims} progress={progress} />}

      {open && <ClaimPanel claim={open} onClose={() => setOpenId(null)} />}

      {/* Findings are an end-of-run summary. Showing them while claims are
          still resolving would let the counts jump around under the reader,
          which reads as the tool changing its mind. */}
      {!live && findings.total > 0 && <Findings findings={findings} />}
      {flags.shown.length > 0 && <WorthChecking flags={flags} />}
      {!live && listed.length > 0 && <UnplacedList claims={listed} />}
      {!live && mine.length > 0 && <FirstPartyList claims={mine} />}
    </div>
  )
}

/**
 * What is happening right now, in words rather than a spinner.
 *
 * A named action makes a wait feel like work being done, and a spinner makes
 * it feel like nothing being done. "Opening ahrefs.com" also tells the reader
 * something true and specific that they can check against their own document.
 *
 * Host only, never the URL. "Opening ahrefs.com" is a sentence a person reads;
 * "Opening https://ahrefs.com/blog/seo-statistics/?utm_source=..." is noise
 * they have to skip.
 *
 * The host is named ONCE, on the line that opens it. The next line is
 * "Reading the page", not "Reading ahrefs.com", because by then the reader
 * knows which page and repeating the host turns a sequence of steps into a
 * chant. Only the six-second line names it again, and that one has to: at
 * that point the host is the useful part, because it is the thing that is
 * slow.
 */
function NowChecking({
  claims,
  progress,
}: {
  claims: Claim[]
  progress: Record<string, { stage: string; host?: string }>
}) {
  const active = claims
    .filter(c => progress[c.id])
    .slice(0, 3)
    .map(c => ({ claim: c, ...progress[c.id] }))
  if (active.length === 0) return null

  return (
    <ul className="mt-4 space-y-1">
      {active.map(({ claim, stage, host }) => (
        <li
          key={claim.id}
          className="claim-status text-[13px]"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
        >
          {stage === 'slow'
            ? `${host} is slow to respond`
            : stage === 'reading'
              ? 'Reading the page'
              : `Opening ${host}`}
        </li>
      ))}
    </ul>
  )
}

/**
 * What this tool can do with this document, said BEFORE any result.
 *
 * The measured split is stark and it is the third time it has turned up: four
 * citation-heavy publishers at 82% linked against two aggregator posts at 12%,
 * and a stats post at 100% against a case study at 16%. A writer whose
 * document sits at the bottom of that range will otherwise conclude the tool
 * is broken, when what is actually true is that their document does not link
 * its sources. Setting the expectation first costs one division and is the
 * difference between an honest tool and a disappointing one.
 */
function DensityBanner({ density }: { density: CitationDensity }) {
  const checkable = density.linked + density.named + density.none
  if (checkable === 0) return null
  const pct = Math.round(density.ratio * 100)

  const line =
    density.band === 'well_cited'
      ? `This document links ${pct}% of its checkable claims. We can check most of them directly.`
      : density.band === 'mixed'
        ? `This document links ${pct}% of its checkable claims. We can check those directly and search for the rest.`
        : `This document links ${pct}% of its checkable claims. We can only check a few directly. For the rest we have to go looking, and finding nothing will not mean they are wrong.`

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--machine-bg)', border: '1px solid var(--rule)' }}
    >
      <p className="text-[14px] leading-relaxed" style={{ color: 'var(--machine)' }}>
        {line}
      </p>
      {density.firstParty > 0 && (
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          {density.firstParty} more {density.firstParty === 1 ? 'claim is' : 'claims are'} your
          own {density.firstParty === 1 ? 'figure' : 'figures'}, which nobody outside can check.
          Listed at the bottom, not marked.
        </p>
      )}
    </div>
  )
}

function Summary({ claims }: { claims: Claim[] }) {
  const counts = useMemo(() => countByVerdict(claims), [claims])
  const toFix = useMemo(() => citationsToFix(claims), [claims])
  const empty = useMemo(() => nothingToCheck(claims), [claims])

  // No figures and no sources anywhere. Saying so is a real answer; marking
  // twenty uncheckable lines is a wall.
  if (empty) {
    return (
      <p className="mt-5 text-[15px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        This reads like marketing copy rather than an article with sources. We
        found no numbers and no citations, so there is nothing here for us to
        check.
      </p>
    )
  }

  if (counts.total === 0) {
    return (
      <p className="mt-5 text-[15px]" style={{ color: 'var(--ink-soft)' }}>
        No checkable claims found. That is a real answer, not a failure: this document does
        not assert anything a reader could look up.
      </p>
    )
  }
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="text-[15px]" style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
        {counts.total} checkable {counts.total === 1 ? 'claim' : 'claims'}
      </span>
      {counts.contradicted > 0 && (
        <Tally n={counts.contradicted} label="contradicted" verdict="contradicted" />
      )}
      {counts.verified > 0 && <Tally n={counts.verified} label="verified" verdict="verified" />}
      {counts.unchecked > 0 && (
        <Tally n={counts.unchecked} label="not checked" verdict="unchecked" />
      )}
      {/* The only actionable number on the page, and the reason the report is
          worth attaching to anything. Deliberately not on the verdict scale: a
          citation defect is a thirty-second fix and a contradiction is a
          rewrite, and one scale would flatten that. */}
      {toFix > 0 && (
        <span
          className="text-[13px] px-2 py-0.5 rounded-full"
          style={{
            background: 'var(--guess-bg)',
            color: 'var(--guess)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {toFix} {toFix === 1 ? 'citation' : 'citations'} to fix
        </span>
      )}
    </div>
  )
}

function Tally({ n, label, verdict }: { n: number; label: string; verdict: ClaimVerdict }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[13px]"
      style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
    >
      <span
        className="inline-block w-2.5 h-2.5 rounded-sm"
        style={{ background: STYLE[verdict].fg }}
        aria-hidden
      />
      {n} {label}
    </span>
  )
}

/**
 * The two axes, read out in plain sentences.
 *
 * The citation line is written as a fix and never as a fault. "This is true,
 * the link does not show it" tells a writer their next thirty seconds.
 * "Unsupported citation" tells them they are careless, which is both ruder and
 * less useful, and frequently untrue: the commonest cause is a source that
 * moved.
 */
function ClaimPanel({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  const v = displayVerdict(claim)
  const s = STYLE[v]
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

      {claim.judgement.note && (
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          {claim.judgement.note}
        </p>
      )}

      {claim.judgement.evidence.length > 0 ? (
        <EvidenceList evidence={claim.judgement.evidence} accent={s.fg} />
      ) : (
        <p className="mt-4 text-[14px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          <UncheckedLine claim={claim} />
        </p>
      )}

      <CitationLine claim={claim} />
    </div>
  )
}

/** Which KIND of nothing. The four world reasons read as prose; ours do not. */
function UncheckedLine({ claim }: { claim: Claim }) {
  switch (claim.judgement.reason) {
    case 'first_party':
      return <>This is your own figure. Nobody outside can check it, including us.</>
    case 'live_source':
      return (
        <>
          This cites a page that only shows current data, so your reader cannot check it
          either. Consider quoting the date you read it.
        </>
      )
    case 'unreachable':
      return <>We could not open the source. It may be paywalled, moved, or blocking us.</>
    case 'not_found':
      return <>We searched and found nothing that settles this either way. That is not evidence it is wrong.</>
    case 'not_checked':
      return (
        <>
          Nothing has checked this yet. It is listed so you know it is the kind of thing a
          reader could challenge.
        </>
      )
    default:
      return <>We could not finish checking this one. That is our problem, not a finding.</>
  }
}

/** The citation axis, in one sentence, written as a fix. */
function CitationLine({ claim }: { claim: Claim }) {
  const { check, sourceFigure, evidence } = claim.citation
  if (check === 'not_applicable' && claim.sourceForm === 'none') {
    // Only worth saying for a claim somebody could have cited. Saying it about
    // a first-party number would be scolding a writer for not citing himself.
    if (claim.subject === 'first_party') return null
    return (
      <p className="mt-4 pt-3 text-[14px] leading-relaxed" style={{ borderTop: '1px solid var(--rule)', color: 'var(--ink-soft)' }}>
        No source given.
      </p>
    )
  }
  if (check === 'not_applicable') return null

  const line =
    check === 'supports'
      ? claim.sourceForm === 'named'
        ? `${claim.sourceName} does publish this. Consider linking it.`
        : 'The link shows this.'
      : check === 'does_not_contain'
        ? claim.sourceForm === 'named'
          ? `We searched ${claim.sourceName} and could not find this.`
          : 'This is true. The link does not show it.'
        : 'We could not open your link. Your reader may not either.'

  return (
    <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--rule)' }}>
      <p className="text-[14px] leading-relaxed" style={{ color: 'var(--ink)' }}>
        {line}
      </p>
      {/* The source's own figure, shown and never judged. Rounding "in the
          author's favour" is a claim about intent, and a tool that infers
          intent is insulting exactly when it is wrong. */}
      {sourceFigure && claim.figure && sourceFigure !== claim.figure && (
        <p className="mt-1 text-[14px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          Your text says {claim.figure}. The source says {sourceFigure}.
        </p>
      )}
      {evidence.length > 0 && <EvidenceList evidence={evidence} accent="var(--ink-soft)" />}
    </div>
  )
}

function EvidenceList({
  evidence,
  accent,
}: {
  evidence: Claim['judgement']['evidence']
  accent: string
}) {
  return (
    <ul className="mt-4 space-y-3">
      {evidence.map((e, i) => (
        <li
          key={i}
          className="text-[14px] leading-relaxed pl-3"
          style={{ borderLeft: `2px solid ${accent}`, color: 'var(--ink)' }}
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
  )
}

/**
 * The findings, sorted by whose fault they are.
 *
 * 44% of checked claims on real articles carry a citation that does not
 * support them. That rate is true and a flat list of twenty is still a wall.
 * Nothing is hidden here: every count is shown, and every group expands. What
 * changes is the order, because the group the writer can act on has to come
 * first. Leading with something they cannot act on teaches them to ignore the
 * whole panel.
 */
function Findings({ findings }: { findings: GroupedFindings }) {
  const [expanded, setExpanded] = useState(false)
  const lines = summaryLines(findings)
  const rest = expanded ? findings.unsupported.slice(FINDINGS_SHOWN) : []

  return (
    <div
      className="mt-6 rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--card)', border: '1px solid var(--rule)' }}
    >
      <p className="eyebrow mb-3">What to fix</p>

      <ul className="mb-4 space-y-1">
        {lines.map((line, i) => (
          <li
            key={i}
            className="text-[15px] leading-relaxed"
            /* The first line is the one they can act on. The rest are context
               and are deliberately quieter, not hidden. */
            style={{
              color: i === 0 ? 'var(--ink)' : 'var(--ink-soft)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {line}
          </li>
        ))}
      </ul>

      {findings.lead.length > 0 && (
        <div className="space-y-4">
          {findings.lead.map(f => <FindingCard key={f.claim.id} finding={f} />)}
          {rest.map(f => <FindingCard key={f.claim.id} finding={f} />)}
        </div>
      )}

      {findings.leadHidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-[14px] underline underline-offset-4"
          style={{ color: 'var(--brand-text)' }}
        >
          {expanded
            ? 'Show fewer'
            : `Show the other ${findings.leadHidden} ${findings.leadHidden === 1 ? 'citation' : 'citations'}`}
        </button>
      )}

      {(findings.unverifiable.length > 0 || findings.unchecked.length > 0) && (
        <div className="mt-5 pt-4 space-y-3" style={{ borderTop: '1px solid var(--rule)' }}>
          {findings.unverifiable.map(f => <QuietFinding key={f.claim.id} finding={f} />)}
          {findings.unchecked.map(f => <QuietFinding key={f.claim.id} finding={f} />)}
        </div>
      )}
    </div>
  )
}

/** One thing to fix: what is wrong, then what to do about it. */
function FindingCard({ finding }: { finding: Finding }) {
  const { claim, headline, fix } = finding
  return (
    <div
      className="pl-3"
      style={{ borderLeft: `2px solid ${STYLE[displayVerdict(claim)].fg}` }}
    >
      <p className="text-[14px] leading-relaxed" style={{ color: 'var(--ink)' }}>
        {claim.claimText}
      </p>
      <p className="mt-1 text-[14px] leading-relaxed" style={{ color: 'var(--guess)' }}>
        {headline}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        {fix}
      </p>
      {claim.sourceUrl && (
        <a
          href={claim.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-1 inline-block text-[12px] underline underline-offset-4 wrap-break-word"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
        >
          {claim.sourceUrl.slice(0, 90)}
        </a>
      )}
    </div>
  )
}

/** Things that are not the writer's fault. Present, quiet, never leading. */
function QuietFinding({ finding }: { finding: Finding }) {
  return (
    <div className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
      <span style={{ color: 'var(--ink)' }}>{finding.headline}</span> {finding.fix}
    </div>
  )
}

/**
 * The unsourced claims worth a second look, ranked, three at a time.
 *
 * On an aggregator post a third of claims carry no attribution at all, so an
 * unranked version of this fires a dozen times on one document. Twelve things
 * to check is a wall, not a to-do list, and frequency destroys usefulness
 * independently of accuracy. Three ranked items is a task.
 *
 * The heading and the sentences are deliberately about OUR search rather than
 * about the claim. One search is not entitled to say the world contains no
 * source, and this is the closest the product gets to catching a fabrication
 * without ever accusing anyone of one.
 */
function WorthChecking({ flags }: { flags: ReturnType<typeof rankFlags> }) {
  return (
    <div
      className="mt-6 rounded-2xl p-4 sm:p-5"
      style={{ background: 'var(--guess-bg)', border: '1px solid var(--rule)' }}
    >
      <p className="eyebrow mb-3">Worth checking first</p>
      <ul className="space-y-3">
        {flags.shown.map(({ claim }) => (
          <li
            key={claim.id}
            className="text-[14px] leading-relaxed pl-3"
            style={{ borderLeft: '2px solid var(--guess)', color: 'var(--ink)' }}
          >
            {claim.claimText}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--guess)' }}>
        {flags.shown.length === 1 ? 'This reads' : 'These read'} like published statistics and we
        could not find a source for {flags.shown.length === 1 ? 'it' : 'them'}.
        {flags.hidden > 0 && ` ${flags.hidden} more like this.`}
      </p>
    </div>
  )
}

function UnplacedList({ claims }: { claims: Claim[] }) {
  return (
    <div className="mt-6">
      <p className="eyebrow mb-3">Also found, but not marked above</p>
      <p className="text-[13px] mb-3 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        We could not match these to an exact place in your text, so they are listed rather
        than highlighted. Marking the wrong sentence would be worse than not marking one.
      </p>
      <ul className="space-y-2">
        {claims.map(c => (
          <li
            key={c.id}
            className="text-[14px] leading-relaxed pl-3"
            style={{ borderLeft: `2px solid ${STYLE[displayVerdict(c)].fg}`, color: 'var(--ink)' }}
          >
            {c.claimText}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The author's own figures, listed and never marked.
 *
 * In a case study this is 84% of the document. Marking them would paint a wall
 * of amber across writing that has done nothing wrong. Naming them for what
 * they are is the honest version and it is also useful: a reader outside the
 * company cannot check these either, which is worth the writer knowing.
 */
function FirstPartyList({ claims }: { claims: Claim[] }) {
  return (
    <div className="mt-6">
      <p className="eyebrow mb-3">Your own figures</p>
      <p className="text-[13px] mb-3 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        {claims.length} {claims.length === 1 ? 'claim comes' : 'claims come'} from your own
        records. Nobody outside your company can check {claims.length === 1 ? 'it' : 'them'},
        including us, so {claims.length === 1 ? 'it is' : 'they are'} listed rather than
        marked. Your reader will have to take your word for {claims.length === 1 ? 'it' : 'them'}.
      </p>
      <ul className="space-y-2">
        {claims.map(c => (
          <li
            key={c.id}
            className="text-[14px] leading-relaxed pl-3"
            style={{ borderLeft: '2px solid var(--rule)', color: 'var(--ink)' }}
          >
            {c.claimText}
          </li>
        ))}
      </ul>
    </div>
  )
}
