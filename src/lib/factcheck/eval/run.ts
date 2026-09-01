import { checkCitations } from '../citation'
import { CORPUS, toClaim, type Fixture } from './corpus'
import type { RetrievalProvider, RetrievalResult } from '../providers/types'
import type { CitationCheck } from '../types'

/**
 * The citation-axis eval.
 *
 * Offline retrieval, frozen sources, real judge. Zero Tavily credits: the
 * provider below is a stub that serves the corpus text, so the only thing this
 * spends is judge calls on the model actually under test.
 *
 * ===================================================================
 * WHAT IS GATED, AND WHAT IS DELIBERATELY NOT
 * ===================================================================
 *
 * GATED: falseDefectRate. Telling a writer their link is wrong when it is
 * fine. On this axis that is the accusation, and it is the failure that kills
 * the product. The gate is ZERO over the near-miss set, which is roughly half
 * the corpus and is there precisely to make that hard.
 *
 * REPORTED, NEVER GATED: defectRecall. Writing down the recall we are trading
 * away and refusing to gate it is the design statement. A judge that catches
 * every defect and flags one clean citation is worse than one that catches
 * three quarters and flags none.
 *
 * REPORTED: groundingFailureRate, how often the judge produced a quote that is
 * not in the source and was therefore discarded. That is not a scoring metric,
 * it is a health check on the one defence against a confabulating judge.
 *
 * ===================================================================
 * THIS CORPUS CANNOT MEASURE THE PRODUCT, AND SAYS SO
 * ===================================================================
 *
 * Every fixture here is SYNTHETIC: I wrote the claim, I wrote the source, and
 * I wrote the expected answer. That is fine for catching a judge that flags
 * near-misses, and it is worthless as an estimate of anything.
 *
 * It scored 16/16 with a false-defect rate of zero while the same code, run on
 * real pages, produced a 32% false-accusation rate against hand verification.
 * It could not have caught any of the causes:
 *
 *   - percent-encoded SVG data faking a figure match: my sources have no markup
 *   - paywalled pages returning masked figures: my sources are never truncated
 *     by a paywall
 *   - the judge answering in Spanish: my sources are all clean English
 *   - sources that changed after publication: my sources have no history
 *
 * A synthetic corpus tests the judge against the author's own idea of what a
 * source looks like. Real input has textures invented input does not.
 *
 * So this stays as a REGRESSION GUARD and is never quoted as a rate. The
 * measurement corpus is real-citations, held out and hand-verified, and
 * `assertNotSelfMeasuring` below refuses to score anything whose verdicts came
 * from the same run that produced them.
 */

/** Serves the frozen corpus text. Never touches the network. */
function frozenProvider(fixtures: Fixture[]): RetrievalProvider {
  const byId = new Map(fixtures.map(f => [f.id, f]))
  const page = (f: Fixture) => ({
    url: `https://frozen.test/${f.id}`,
    title: f.id,
    content: f.source,
    retrievedAt: '2026-09-01T00:00:00.000Z',
  })
  return {
    name: 'frozen',
    async extract(urls): Promise<RetrievalResult> {
      const pages = urls
        .map(u => byId.get(u.replace('https://frozen.test/', '')))
        .filter((f): f is Fixture => Boolean(f))
        .map(page)
      return { ok: true, pages, unretrieved: [] }
    },
    async searchDomains(query): Promise<RetrievalResult> {
      // The named path searches by claim text, so match on that.
      const f = fixtures.find(x => x.claimText === query && x.sourceForm === 'named')
      return { ok: true, pages: f ? [page(f)] : [], unretrieved: [] }
    },
  }
}

export interface EvalRow {
  id: string
  defect: Fixture['defect']
  expected: CitationCheck
  got: CitationCheck
  ok: boolean
  /** True when the judge answered but its quote was not in the source. */
  ungrounded: boolean
}

export interface EvalReport {
  rows: EvalRow[]
  total: number
  /** THE GATE. Clean citations wrongly called a defect. Must be zero. */
  falseDefectRate: number
  falseDefects: EvalRow[]
  /** Reported, never gated. The recall we are knowingly trading away. */
  defectRecall: number
  missed: EvalRow[]
  /** Health of the indexOf gate, not a score. */
  groundingFailureRate: number
  /** Anything that came back not_applicable: the judge or the stub said nothing. */
  silentRate: number
}

/**
 * Refuse to score a corpus that grades itself.
 *
 * The first real-article audit wrote the judge's own verdicts into
 * real-citations.json as `observed`. Scoring against those would have reported
 * perfect agreement, because the answer key was a copy of the answers. A
 * fixture may only be scored when a HUMAN set `verified`, and when it comes
 * from an article the audit did not produce the verdict on.
 *
 * Called by anything that computes a rate. It throws rather than warns,
 * because a number that quietly measures itself is worse than no number.
 */
export function assertNotSelfMeasuring(
  rows: { id: string; provenance?: string; verified?: string | null }[]
): void {
  const ungraded = rows.filter(r => !r.verified)
  if (ungraded.length > 0) {
    throw new Error(
      `${ungraded.length} of ${rows.length} fixtures have no human verdict ` +
        `(first: ${ungraded[0].id}). A fixture the judge graded itself cannot ` +
        `measure the judge. Hand-verify them or exclude them.`
    )
  }
  const selfGraded = rows.filter(r => r.provenance === 'audit-observed')
  if (selfGraded.length > 0) {
    throw new Error(
      `${selfGraded.length} fixtures are audit-observed, meaning their expected ` +
        `answer came from the run being measured. Exclude them.`
    )
  }
}

export async function runEval(fixtures: Fixture[] = CORPUS): Promise<EvalReport> {
  const claims = fixtures.map(toClaim)
  const run = await checkCitations(claims, frozenProvider(fixtures))

  const rows: EvalRow[] = fixtures.map(f => {
    const result = run.results.get(f.id)!
    return {
      id: f.id,
      defect: f.defect,
      expected: f.expect,
      got: result.check,
      ok: result.check === f.expect,
      // A does_not_contain with no evidence on the LINKED path means the
      // judge's quote failed the indexOf gate and was dropped.
      ungrounded:
        result.check === 'does_not_contain' &&
        result.evidence.length === 0 &&
        (f.sourceForm ?? 'linked') === 'linked',
    }
  })

  const clean = rows.filter(r => r.expected === 'supports')
  const defects = rows.filter(r => r.expected === 'does_not_contain')

  const falseDefects = clean.filter(r => r.got === 'does_not_contain')
  const missed = defects.filter(r => r.got !== 'does_not_contain')

  return {
    rows,
    total: rows.length,
    falseDefectRate: clean.length ? falseDefects.length / clean.length : 0,
    falseDefects,
    defectRecall: defects.length ? (defects.length - missed.length) / defects.length : 0,
    missed,
    groundingFailureRate: rows.length ? rows.filter(r => r.ungrounded).length / rows.length : 0,
    silentRate: rows.length ? rows.filter(r => r.got === 'not_applicable').length / rows.length : 0,
  }
}

export function formatReport(r: EvalReport): string {
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`.padStart(6)
  const lines: string[] = []

  lines.push('')
  lines.push('  CITATION AXIS EVAL')
  lines.push(`  ${r.total} fixtures, frozen sources, no retrieval spend`)
  lines.push('  ' + '-'.repeat(64))
  for (const row of r.rows) {
    const mark = row.ok ? ' ok ' : 'FAIL'
    lines.push(
      `  ${mark}  ${row.id.padEnd(22)} ${row.defect.padEnd(16)} ` +
        `got ${row.got}${row.ungrounded ? '  (quote not in source)' : ''}`
    )
  }
  lines.push('  ' + '-'.repeat(64))
  lines.push('')
  lines.push(`  FALSE DEFECT RATE   ${pct(r.falseDefectRate)}   GATED AT ZERO`)
  lines.push('                             clean citations wrongly called wrong.')
  lines.push('                             this is the failure that kills the product.')
  lines.push('')
  lines.push(`  defect recall       ${pct(r.defectRecall)}   reported, never gated`)
  lines.push('                             the recall we are knowingly trading for precision.')
  lines.push(`  ungrounded quotes   ${pct(r.groundingFailureRate)}   health of the indexOf gate`)
  lines.push(`  said nothing        ${pct(r.silentRate)}`)
  lines.push('')

  if (r.falseDefects.length > 0) {
    lines.push('  FALSE DEFECTS. Each of these tells a writer their link is wrong when it is not:')
    for (const row of r.falseDefects) lines.push(`    - ${row.id} (${row.defect})`)
    lines.push('')
  }
  if (r.missed.length > 0) {
    lines.push('  Missed defects. Reported, not a gate:')
    for (const row of r.missed) lines.push(`    - ${row.id} (${row.defect}) -> ${row.got}`)
    lines.push('')
  }

  lines.push('  SYNTHETIC REGRESSION GUARD, NOT A MEASUREMENT. Every claim, source and')
  lines.push('  expected answer here was written by hand. This corpus scored 16/16 with a')
  lines.push('  zero false-defect rate while the same code produced a 32% false-accusation')
  lines.push('  rate on real pages. Never quote these numbers as a rate.')
  lines.push('  The measurement corpus is real-citations, held out and hand-verified.')
  lines.push('')
  return lines.join('\n')
}
