/**
 * Run the citation-axis eval.
 *
 *   npm run eval:factcheck
 *
 * Retrieval is stubbed with frozen sources, so this costs ZERO Tavily credits.
 * It does spend judge calls on the model under test, which is the point.
 * Exits non-zero if the false-defect gate is breached.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvLocal(): void {
  if (process.env.OPENAI_API_KEY) return
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // Fall back to the shell environment.
  }
}
loadEnvLocal()

const { runEval, formatReport } = await import('../src/lib/factcheck/eval/run.js')

const report = await runEval()
console.log(formatReport(report))

if (report.falseDefectRate > 0) {
  console.error('  GATE FAILED: a clean citation was called a defect.\n')
  process.exit(1)
}
