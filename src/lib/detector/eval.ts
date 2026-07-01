/**
 * Detector evaluation harness.
 *
 * Turns the labelled corpus (./__fixtures__/corpus.ts) into the numbers
 * that justify every threshold and weight in ./signals.ts. Runs entirely
 * on the deterministic signal path - NO Gemini call - so it's fast,
 * offline, and reproducible.
 *
 * Run it:
 *   npx tsx src/lib/detector/eval.ts
 *
 * Or import { runEval } elsewhere (e.g. a future CI check) and assert on
 * report.humanFalsePositiveRate / report.aiRecall.
 *
 * KPI philosophy (matches the product's honesty stance): we maximise AI
 * recall SUBJECT TO a low human false-positive rate. A detector that
 * calls real people liars is worse than one that says "mixed".
 */

import { CORPUS, type Label, type Sample } from './__fixtures__/corpus'
import {
  computeSignals,
  computeLeans,
  verdictFromLeans,
  signalWeightedScore,
  type SignalLeans,
  type VerdictBand,
} from './signals'

type Predicted = 'human' | 'ai' | 'mixed'

function bandToPrediction(band: VerdictBand): Predicted {
  if (band === 'likely-ai') return 'ai'
  if (band === 'likely-human') return 'human'
  return 'mixed'
}

export interface EvalRow {
  id: string
  label: Label
  predicted: Predicted
  score: number
  correct: boolean
}

export interface EvalReport {
  rows: EvalRow[]
  total: number
  // Correct = predicted class matches label. "mixed" is never "correct"
  // but is counted separately as an abstention, not a hard error.
  accuracy: number
  aiRecall: number            // of AI samples, fraction called "ai"
  humanRecall: number         // of human samples, fraction called "human"
  humanFalsePositiveRate: number // of human samples, fraction called "ai" (the one that matters)
  aiMissRate: number          // of AI samples, fraction called "human" (the reported symptom)
  abstentionRate: number      // fraction landing in "mixed"
  confusion: Record<Label, Record<Predicted, number>>
  // Mean of each signal lean, split by class, so you can see which
  // signals actually separate human from AI in the current corpus.
  separation: Record<keyof SignalLeans, { human: number; ai: number; gap: number }>
}

function meanLeanByClass(samples: Sample[]) {
  const keys: (keyof SignalLeans)[] = [
    'burstiness', 'vocabulary', 'emDashes', 'transitions',
    'cliches', 'llmLeadIns', 'openingRepetition', 'punctuation',
  ]
  const acc = { human: {} as Record<string, number[]>, ai: {} as Record<string, number[]> }
  for (const k of keys) { acc.human[k] = []; acc.ai[k] = [] }

  for (const s of samples) {
    const leans = computeLeans(computeSignals(s.text))
    for (const k of keys) acc[s.label][k].push(leans[k])
  }

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
  const out = {} as EvalReport['separation']
  for (const k of keys) {
    const h = avg(acc.human[k])
    const a = avg(acc.ai[k])
    out[k] = {
      human: Math.round(h * 1000) / 1000,
      ai: Math.round(a * 1000) / 1000,
      gap: Math.round((a - h) * 1000) / 1000,
    }
  }
  return out
}

export function runEval(samples: Sample[] = CORPUS): EvalReport {
  const rows: EvalRow[] = []
  const confusion: Record<Label, Record<Predicted, number>> = {
    human: { human: 0, ai: 0, mixed: 0 },
    ai: { human: 0, ai: 0, mixed: 0 },
  }

  for (const s of samples) {
    const signals = computeSignals(s.text)
    const leans = computeLeans(signals)
    const { band } = verdictFromLeans(leans, signals)
    const predicted = bandToPrediction(band)
    confusion[s.label][predicted]++
    rows.push({
      id: s.id,
      label: s.label,
      predicted,
      score: Math.round(signalWeightedScore(leans) * 1000) / 1000,
      correct: predicted === s.label,
    })
  }

  const humanTotal = confusion.human.human + confusion.human.ai + confusion.human.mixed
  const aiTotal = confusion.ai.human + confusion.ai.ai + confusion.ai.mixed
  const total = humanTotal + aiTotal
  const correct = confusion.human.human + confusion.ai.ai
  const abstentions = confusion.human.mixed + confusion.ai.mixed

  return {
    rows,
    total,
    accuracy: total ? correct / total : 0,
    aiRecall: aiTotal ? confusion.ai.ai / aiTotal : 0,
    humanRecall: humanTotal ? confusion.human.human / humanTotal : 0,
    humanFalsePositiveRate: humanTotal ? confusion.human.ai / humanTotal : 0,
    aiMissRate: aiTotal ? confusion.ai.human / aiTotal : 0,
    abstentionRate: total ? abstentions / total : 0,
    confusion,
    separation: meanLeanByClass(samples),
  }
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

export function formatReport(r: EvalReport): string {
  const lines: string[] = []
  lines.push('=== Detector eval ===')
  lines.push(`samples:            ${r.total}`)
  lines.push(`accuracy:           ${pct(r.accuracy)}`)
  lines.push(`AI recall:          ${pct(r.aiRecall)}   (AI correctly flagged)`)
  lines.push(`AI miss rate:       ${pct(r.aiMissRate)}   (AI wrongly called human - the bug we fixed)`)
  lines.push(`human recall:       ${pct(r.humanRecall)}`)
  lines.push(`human FALSE-POS:     ${pct(r.humanFalsePositiveRate)}   (humans wrongly called AI - keep LOW)`)
  lines.push(`abstention (mixed): ${pct(r.abstentionRate)}`)
  lines.push('')
  lines.push('confusion [label -> predicted]')
  lines.push(`  human -> human ${r.confusion.human.human}  ai ${r.confusion.human.ai}  mixed ${r.confusion.human.mixed}`)
  lines.push(`  ai    -> human ${r.confusion.ai.human}  ai ${r.confusion.ai.ai}  mixed ${r.confusion.ai.mixed}`)
  lines.push('')
  lines.push('signal separation (mean lean; gap = ai - human, bigger = more discriminating)')
  for (const [k, v] of Object.entries(r.separation)) {
    lines.push(`  ${k.padEnd(18)} human ${String(v.human).padStart(7)}   ai ${String(v.ai).padStart(7)}   gap ${String(v.gap).padStart(7)}`)
  }
  lines.push('')
  lines.push('per-sample')
  for (const row of r.rows) {
    const mark = row.correct ? 'OK ' : row.predicted === 'mixed' ? '~  ' : 'XX '
    lines.push(`  ${mark} ${row.id.padEnd(16)} label=${row.label.padEnd(6)} pred=${row.predicted.padEnd(6)} score=${row.score}`)
  }
  return lines.join('\n')
}

// Run directly: `npx tsx src/lib/detector/eval.ts`
// The entry file's path shows up in process.argv[1]; if this module is
// that file, print the report.
if (typeof process !== 'undefined' && /detector[\\/]eval\.ts$/.test(process.argv[1] ?? '')) {
  // eslint-disable-next-line no-console
  console.log(formatReport(runEval()))
}
