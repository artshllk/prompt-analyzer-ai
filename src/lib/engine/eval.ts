/**
 * Engine eval harness. Runs the golden set through the live pipeline and
 * grades the results - the regression gate for any engine or prompt
 * change. Mirrors the detector's eval pattern (src/lib/detector/eval.ts)
 * but hits real models, so it costs a few cents per run.
 *
 *   npx tsx src/lib/engine/eval.ts
 *
 * Reads OPENAI_API_KEY / GEMINI_API_KEY from the environment, falling
 * back to .env.local. Checks, per case:
 *   - intent classification matches (with aliases)
 *   - ask/improve decision matches the expectation
 *   - already-good detection for strong prompts
 *   - LLM-judge scores: question groundedness (1-5) or rewrite quality (1-5)
 */

import { readFileSync } from 'fs'
import { join } from 'path'

function loadEnvLocal(): void {
  if (process.env.OPENAI_API_KEY) return
  try {
    const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // no .env.local - rely on the shell environment
  }
}
loadEnvLocal()

import { analyzePrompt } from './index'
import { callLLM } from './openai-client'
import { MODELS } from './models'
import { GOLDEN_CASES, INTENT_ALIASES, type GoldenCase } from './__fixtures__/golden'
import type { AnalyzeResult } from '@/types'

const JUDGE_MODEL = MODELS.diagnose

interface CaseReport {
  id: string
  resultType: AnalyzeResult['type'] | 'ENGINE_FAILED'
  intentOk: boolean | null
  askOk: boolean | null
  alreadyGoodOk: boolean | null
  judgeScore: number | null
  judgeNote: string
  problems: string[]
}

async function judgeQuestion(c: GoldenCase, question: string, options: string[]): Promise<{ score: number; note: string } | null> {
  return callLLM<{ score: number; note: string }>({
    model: JUDGE_MODEL,
    systemPrompt: `You grade clarifying questions produced by a prompt-improvement tool. Score 1-5:
5 = grounded in THIS prompt's actual ambiguity; answering it would substantively change the rewrite; the offered options are genuinely different readings.
3 = relevant but somewhat generic; a competent human would still pick an option.
1 = interview-checklist question ("who is your target audience?") that could be asked of any prompt, or asks something already answered.
Return JSON: {"score": n, "note": "one sentence"}`,
    userMessage: `User's prompt:\n${c.prompt}\n\nTool's question:\n${question}\n\nOptions offered:\n${options.join('\n')}`,
    temperature: 0,
    maxOutputTokens: 150,
    responseSchema: {
      type: 'object',
      properties: { score: { type: 'integer', minimum: 1, maximum: 5 }, note: { type: 'string' } },
      required: ['score', 'note'],
    },
  })
}

async function judgeRewrite(c: GoldenCase, improved: string): Promise<{ score: number; note: string } | null> {
  return callLLM<{ score: number; note: string }>({
    model: JUDGE_MODEL,
    systemPrompt: `You grade prompt rewrites produced by a prompt-improvement tool. Score 1-5:
5 = faithful to the user's intent, adds only justified specifics, states assumptions where it had to guess, no invented facts, no cargo-cult filler (personas/pleasantries that don't help the task), appropriately bounded format.
3 = clearly better than the original but with some generic padding or one unstated guess.
1 = generic template output, invented facts, or lost information from the original.
Return JSON: {"score": n, "note": "one sentence naming the weakest aspect"}`,
    userMessage: `User's original prompt:\n${c.prompt}\n\nTool's rewrite:\n${improved}`,
    temperature: 0,
    maxOutputTokens: 150,
    responseSchema: {
      type: 'object',
      properties: { score: { type: 'integer', minimum: 1, maximum: 5 }, note: { type: 'string' } },
      required: ['score', 'note'],
    },
  })
}

async function runCase(c: GoldenCase): Promise<CaseReport> {
  const report: CaseReport = {
    id: c.id,
    resultType: 'ENGINE_FAILED',
    intentOk: null,
    askOk: null,
    alreadyGoodOk: null,
    judgeScore: null,
    judgeNote: '',
    problems: [],
  }

  const result = await analyzePrompt({ prompt: c.prompt, tone: 'professional', priorAnswers: [] })
  if (!result) {
    report.problems.push('engine returned null')
    return report
  }
  report.resultType = result.type

  // Intent (audit is attached to every result type)
  const intent = result.audit?.intent
  const allowed = INTENT_ALIASES[c.id] ?? [c.expectIntent]
  report.intentOk = intent ? allowed.includes(intent) : false
  if (!report.intentOk) report.problems.push(`intent=${intent} expected ${allowed.join('|')}`)

  // Ask/improve decision
  if (c.expectAsk !== 'either') {
    const asked = result.type === 'clarifying'
    report.askOk = c.expectAsk === 'yes' ? asked : !asked
    if (!report.askOk) report.problems.push(`asked=${asked} expected ${c.expectAsk}`)
  }

  // Already-good detection
  if (c.expectAlreadyGood !== undefined) {
    report.alreadyGoodOk = (result.type === 'already_good') === c.expectAlreadyGood
    if (!report.alreadyGoodOk) {
      report.problems.push(`already_good=${result.type === 'already_good'} expected ${c.expectAlreadyGood}`)
    }
  }

  // LLM judge
  if (result.type === 'clarifying') {
    const judged = await judgeQuestion(
      c,
      result.question,
      (result.options ?? []).map(o => `- ${o.label}: ${o.summary}`)
    )
    if (judged) {
      report.judgeScore = judged.score
      report.judgeNote = judged.note
      if (judged.score <= 2) report.problems.push(`generic question (judge=${judged.score})`)
    }
  } else if (result.type === 'improved') {
    const judged = await judgeRewrite(c, result.improvedPrompt)
    if (judged) {
      report.judgeScore = judged.score
      report.judgeNote = judged.note
      if (judged.score <= 2) report.problems.push(`weak rewrite (judge=${judged.score})`)
    }
  }

  return report
}

export async function runEval(): Promise<CaseReport[]> {
  const reports: CaseReport[] = []
  const CHUNK = 4
  for (let i = 0; i < GOLDEN_CASES.length; i += CHUNK) {
    const chunk = GOLDEN_CASES.slice(i, i + CHUNK)
    reports.push(...(await Promise.all(chunk.map(runCase))))
    process.stderr.write(`  ${Math.min(i + CHUNK, GOLDEN_CASES.length)}/${GOLDEN_CASES.length} cases\n`)
  }
  return reports
}

function pct(hits: number, total: number): string {
  return total === 0 ? 'n/a' : `${Math.round((hits / total) * 100)}% (${hits}/${total})`
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY missing (env or .env.local). Aborting.')
    process.exit(1)
  }

  console.log(`Running ${GOLDEN_CASES.length} golden cases against the live pipeline…\n`)
  const reports = await runEval()

  for (const r of reports) {
    const flag = r.problems.length === 0 ? 'ok  ' : 'FAIL'
    const judge = r.judgeScore !== null ? ` judge=${r.judgeScore}` : ''
    console.log(`${flag} ${r.id.padEnd(28)} → ${r.resultType}${judge}`)
    if (r.judgeNote) console.log(`     ${r.judgeNote}`)
    for (const p of r.problems) console.log(`     !! ${p}`)
  }

  const graded = (sel: (r: CaseReport) => boolean | null) => {
    const applicable = reports.filter(r => sel(r) !== null)
    return { hits: applicable.filter(r => sel(r) === true).length, total: applicable.length }
  }
  const intent = graded(r => r.intentOk)
  const ask = graded(r => r.askOk)
  const good = graded(r => r.alreadyGoodOk)
  const judgeScores = reports.filter(r => r.judgeScore !== null).map(r => r.judgeScore as number)
  const avgJudge = judgeScores.length
    ? (judgeScores.reduce((a, b) => a + b, 0) / judgeScores.length).toFixed(2)
    : 'n/a'
  const failures = reports.filter(r => r.problems.length > 0)

  console.log('\n=== Summary ===')
  console.log(`intent accuracy:      ${pct(intent.hits, intent.total)}`)
  console.log(`ask/improve decision: ${pct(ask.hits, ask.total)}`)
  console.log(`already-good detect:  ${pct(good.hits, good.total)}`)
  console.log(`avg judge score:      ${avgJudge} / 5`)
  console.log(`cases with problems:  ${failures.length}/${reports.length}`)

  // Regression gate: fail CI/local runs when quality visibly drops.
  const intentRate = intent.total ? intent.hits / intent.total : 1
  const askRate = ask.total ? ask.hits / ask.total : 1
  if (intentRate < 0.8 || askRate < 0.7 || (judgeScores.length > 0 && Number(avgJudge) < 3.5)) {
    console.error('\nEval below thresholds (intent>=80%, ask>=70%, judge>=3.5). Treat as a regression.')
    process.exit(1)
  }
}

// Run only when invoked directly (npx tsx src/lib/engine/eval.ts).
if (process.argv[1]?.endsWith('eval.ts')) {
  main().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
