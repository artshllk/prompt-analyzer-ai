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
 * A NOTE FOR WHOEVER READS THE OUTPUT. This corpus is 16 fixtures drawn from
 * five defects seen in two documents. It is enough to catch a judge that
 * flags near-misses and nowhere near enough to estimate a real-world rate.
 * `golden.ts` in the detector records the same lesson learned the hard way at
 * 16 cases. Treat a pass as "not obviously broken", never as a measurement.
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

  lines.push('  16 fixtures from five defects in two documents. Enough to catch a judge')
  lines.push('  that flags near-misses. Not a measurement of a real-world rate.')
  lines.push('')
  return lines.join('\n')
}
