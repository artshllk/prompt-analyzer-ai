import type { Claim } from './types'

/**
 * Sorting findings by whose fault they are.
 *
 * MEASURED ON REAL ARTICLES: 44% of checked claims carry a citation that does
 * not support them on the day it was checked. That rate is TRUE, not a false
 * positive problem, and it is still unusable as a flat list. Twenty findings
 * on a thirty-three claim article is a wall, and a wall gets closed.
 *
 * The same lesson as the unsourced flag, in its general form: FREQUENCY
 * DESTROYS USEFULNESS INDEPENDENTLY OF ACCURACY. Every one of those twenty can
 * be correct and the feature still fails, because the writer has no way to
 * decide where to start.
 *
 * The fix is not to hide anything. Nothing here is dropped, and every count is
 * shown. The fix is to sort by WHOSE FAULT IT IS, because that decides what
 * the writer does next:
 *
 *   your citation does not support this   -> rewrite or re-source. Their work.
 *   the source changed since you published -> repoint the link. Maintenance.
 *   the source only shows current data     -> add the date you read it.
 *   we could not check it                  -> nothing. Ours, not theirs.
 *
 * Leading with a group the writer cannot act on is how a tool trains someone
 * to ignore it.
 */

export type FindingGroup =
  | 'unsupported'    // the citation does not support the claim. Their work.
  | 'changed'        // correct when published, source has moved on. Maintenance.
  | 'no_source'      // nothing was cited. The biggest bucket on real articles.
  | 'unverifiable'   // the READER cannot check it either. A finding, not a gap.
  | 'unchecked'      // WE could not check it. Ours, never theirs.

/**
 * Context mismatch gets its own wording, because it is a different mistake
 * with a different fix.
 *
 * "The number is on the page but attached to something else" is a misreading:
 * the writer found a real figure and described it wrongly, and the fix is to
 * correct the sentence. "This figure is not there at all" is a sourcing
 * problem: the fix is to find the right page. Telling someone to go looking
 * for a source they already have is the wrong instruction.
 */
export type FindingKind =
  | 'context_mismatch'
  | 'not_present'
  | 'changed'
  | 'live'
  | 'paywalled'
  | 'dead'
  | 'no_source'
  | 'unreadable'

export interface Finding {
  claim: Claim
  group: FindingGroup
  kind: FindingKind
  /** One sentence naming the mistake. */
  headline: string
  /** One sentence naming the fix. */
  fix: string
}

/** How many of the leading group to show before collapsing. */
export const FINDINGS_SHOWN = 3

const COPY: Record<FindingKind, { headline: string; fix: string }> = {
  context_mismatch: {
    headline: 'The number is on that page, attached to something else.',
    fix: 'Check what the source says the number is about, and match your sentence to it. You may not need a different source.',
  },
  not_present: {
    headline: 'That figure is not on the page you linked.',
    fix: 'Find the page that carries it. This is usually the study itself rather than the article that reported on it.',
  },
  changed: {
    headline: 'This was on that page when you published. It is not there now.',
    fix: 'Repoint the link. Your readers currently land on something that does not say this.',
  },
  live: {
    headline: 'This cites a page that only ever shows current data.',
    fix: 'Quote the figure with the date you read it, so a reader knows what they are comparing against.',
  },
  paywalled: {
    headline: 'Your reader hits a paywall here, the same one we did.',
    fix: 'Cite the primary source instead. A citation nobody can open does not support anything.',
  },
  dead: {
    headline: 'That link is gone.',
    fix: 'Repoint it. Your reader currently lands on nothing, or on something else entirely.',
  },
  no_source: {
    headline: 'This number has no link at all.',
    fix: 'Add the page you got it from. A number with nothing behind it is the easiest thing in your post to doubt.',
  },
  unreadable: {
    headline: 'We could not read that page.',
    fix: 'Nothing to do. This is our problem, not a finding about your writing.',
  },
}

/**
 * WHY `unverifiable` IS A FINDING AND NOT A GAP.
 *
 * The instinct is to treat a source we could not read as coverage lost. That
 * undersells the honest answer badly, because the reason we could not read it
 * is almost always a reason the WRITER'S READER cannot read it either.
 *
 * A paywall stops them the same way it stopped us. A dead link lands them on a
 * product page. A live dashboard shows them a different number from the one in
 * the sentence. Each is a real credibility problem with an unambiguous fix,
 * and each can be stated with total confidence WITHOUT reading the page or
 * judging anything, so it carries no risk of false accusation at all.
 *
 * `unchecked` is the genuinely empty group: our own failures, which are never
 * described as the writer having done something wrong.
 */

/**
 * Turn checked claims into findings.
 *
 * `changed` is not produced yet. Deciding that a source USED to contain a
 * claim needs an archive lookup, which is measured at 1.3 to 23 seconds per
 * URL against a rate-limited free endpoint, so it cannot sit on a
 * paste-and-wait request. The group exists here because the copy and the
 * ordering are the hard part and they are settled now; the detector behind it
 * is a background pass. It is also mostly irrelevant to a pre-publish check,
 * where the writer is citing something today. Its real use is a later
 * re-check-my-archive product, where "the source moved under you" is the
 * entire proposition.
 */
export function toFindings(claims: Claim[]): Finding[] {
  const out: Finding[] = []
  for (const claim of claims) {
    const { check } = claim.citation
    if (check === 'does_not_contain') {
      // Deterministic, not model-dependent. figureOnPage is an indexOf over
      // the page we retrieved. Asking the judge for the source's own figure
      // instead distinguished only 8 of 13 real cases, and getting this wrong
      // hands the writer the wrong instruction: "go find the right page" when
      // the page they have is fine and the sentence is not.
      const onPage = claim.citation.figureOnPage ?? Boolean(claim.citation.sourceFigure)
      const kind: FindingKind = onPage ? 'context_mismatch' : 'not_present'
      out.push({ claim, group: 'unsupported', kind, ...COPY[kind] })
    } else if (check === 'not_applicable' && claim.citation.unreadable === 'no_source') {
      /**
       * THE BIGGEST BUCKET ON A REAL ARTICLE, and it was silently producing no
       * finding at all.
       *
       * Measured across 11 stats-heavy articles: 55 of 114 numbers, 48%, had no
       * link of any kind. That is larger than every other category combined,
       * and on most documents this line will be the longest and the most
       * useful thing we say.
       *
       * First-party numbers are excluded, because telling somebody their own
       * figure has no source is telling them to cite themselves.
       */
      if (claim.subject !== 'first_party') {
        out.push({ claim, group: 'no_source', kind: 'no_source', ...COPY.no_source })
      }
    } else if (check === 'source_unreachable') {
      // WHICH kind of unreadable decides whether this is the writer's problem
      // or ours, and they are different sentences.
      const why = claim.citation.unreadable
      if (why === 'paywalled') out.push({ claim, group: 'unverifiable', kind: 'paywalled', ...COPY.paywalled })
      else if (why === 'dead') out.push({ claim, group: 'unverifiable', kind: 'dead', ...COPY.dead })
      else out.push({ claim, group: 'unchecked', kind: 'unreadable', ...COPY.unreadable })
    } else if (claim.judgement.reason === 'live_source') {
      out.push({ claim, group: 'unverifiable', kind: 'live', ...COPY.live })
    }
  }
  return out
}

export interface GroupedFindings {
  /** The group the writer has to act on. Shown first, always. */
  unsupported: Finding[]
  changed: Finding[]
  /** Numbers with no link at all. Usually the largest group. */
  noSource: Finding[]
  /** Their reader cannot verify these either. A finding, not a gap. */
  unverifiable: Finding[]
  /** Counts within unverifiable, because the fixes differ. */
  unverifiableBreakdown: { paywalled: number; dead: number; live: number }
  unchecked: Finding[]
  /** The leading group, cut to FINDINGS_SHOWN. */
  lead: Finding[]
  /** How many of the leading group are behind the count. */
  leadHidden: number
  total: number
}

/**
 * Group and order.
 *
 * Within `unsupported`, a claim whose figure is nowhere on the page comes
 * before a context mismatch. Both are real, but "the number is not there"
 * needs a new source and "the number means something else" needs a reworded
 * sentence, and the first is the bigger job, so it is the one worth seeing
 * while attention is fresh.
 */
export function groupFindings(claims: Claim[]): GroupedFindings {
  const all = toFindings(claims)
  const unsupported = all
    .filter(f => f.group === 'unsupported')
    .sort((a, b) => rank(a.kind) - rank(b.kind) || a.claim.id.localeCompare(b.claim.id))

  const unverifiable = all.filter(f => f.group === 'unverifiable')
  return {
    unsupported,
    changed: all.filter(f => f.group === 'changed'),
    noSource: all.filter(f => f.group === 'no_source'),
    unverifiable,
    unverifiableBreakdown: {
      paywalled: unverifiable.filter(f => f.kind === 'paywalled').length,
      dead: unverifiable.filter(f => f.kind === 'dead').length,
      live: unverifiable.filter(f => f.kind === 'live').length,
    },
    unchecked: all.filter(f => f.group === 'unchecked'),
    lead: unsupported.slice(0, FINDINGS_SHOWN),
    leadHidden: Math.max(0, unsupported.length - FINDINGS_SHOWN),
    total: all.length,
  }
}

function rank(kind: FindingKind): number {
  return kind === 'not_present' ? 0 : 1
}

/**
 * The summary line, in the order the writer should read it.
 *
 * Every count is present. Nothing is hidden, and the sentence a writer can act
 * on comes first, because leading with what they cannot act on is how a tool
 * teaches someone to ignore it.
 */
export function summaryLines(g: GroupedFindings): string[] {
  const lines: string[] = []
  const n = (c: number, one: string, many: string) => `${c} ${c === 1 ? one : many}`
  if (g.unsupported.length) {
    lines.push(`${n(g.unsupported.length, 'citation does', 'citations do')} not support their claim.`)
  }
  if (g.changed.length) {
    lines.push(`${n(g.changed.length, 'has', 'have')} changed since you published.`)
  }
  if (g.noSource.length) {
    // Its own line, between "does not support" and "cannot verify". It sits
    // second because it is almost always the biggest number and the reader
    // should meet the thing they can act on first.
    lines.push(
      `${n(g.noSource.length, 'number has', 'numbers have')} no source at all.`
    )
  }
  if (g.unverifiable.length) {
    // The sentence that was asked for. It is a finding stated with total
    // confidence, not an apology for coverage we did not get.
    const b = g.unverifiableBreakdown
    const parts: string[] = []
    if (b.paywalled) parts.push(`${b.paywalled} paywalled`)
    if (b.dead) parts.push(`${b.dead} dead`)
    if (b.live) parts.push(`${b.live} live ${b.live === 1 ? 'dashboard' : 'dashboards'}`)
    lines.push(
      `${n(g.unverifiable.length, 'citation your', 'citations your')} reader cannot verify either: ` +
        `${parts.join(', ')}.`
    )
  }
  if (g.unchecked.length) {
    lines.push(`${n(g.unchecked.length, 'could', 'could')} not be checked by us.`)
  }
  return lines
}
