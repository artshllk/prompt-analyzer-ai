import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * ANY ROUTE THAT SPENDS MONEY MUST ALSO COUNT IT.
 *
 * /api/factcheck/extract ran the whole paid pipeline - extraction, Tavily
 * fetches, judge calls - behind nothing but a per-minute burst limiter. No
 * monthly allowance, no usage recorded. At 10 a minute for a free account and
 * a measured $0.105 a document that is about $1,500 a day from one signup,
 * and a Pro account three times that.
 *
 * It got in the ordinary way: the route was written cheap, its header said so,
 * somebody later added `checkCitations`, and the header still said extraction
 * only. Nobody was careless; the file lied about itself.
 *
 * So this does not test that one route. It walks every API route, finds the
 * ones that reach the paid pipeline, and requires each to enforce an
 * allowance and record what it used. A new route that forgets fails here
 * rather than on a bill.
 */

const API = 'src/app/api'

function routeFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...routeFiles(full))
    else if (entry === 'route.ts' || entry === 'route.tsx') out.push(full)
  }
  return out
}

/** Calls that cost real money: a model call or a retrieval. */
const SPENDS = /\b(extractClaims|checkCitations|streamCitations|analyzeText)\s*\(/

/**
 * Routes allowed to spend without a user allowance, each for a stated reason.
 * Adding to this list should feel like a decision, which is why it is a
 * literal with comments rather than a pattern.
 */
const EXEMPT: Record<string, string> = {
  // Cron only, behind CRON_SECRET, one tiny fixed document a day. It has no
  // user to charge, which is the point of a health check.
  'src/app/api/health/check/route.ts': 'scheduled health check, no user',
}

test('every route that spends money enforces a per-user allowance', () => {
  const offenders: string[] = []
  for (const file of routeFiles(API)) {
    if (EXEMPT[file]) continue
    const src = readFileSync(file, 'utf8')
    if (!SPENDS.test(src)) continue

    // Anonymous callers are bounded by the global bucket; signed-in callers
    // need a ceiling of their own, or one account is unbounded.
    // Matched as CALLS, not substrings. A first version of this test matched
    // `getFactcheckAllowance` anywhere in the file and happily passed against
    // `getFactcheckAllowanceXX(`, which is a test that cannot fail.
    const hasAllowance =
      /\b(getFactcheckAllowance|getDetectorUsage|decideUsage)\s*\(/.test(src)
    const hasGlobalCap = /\bconsumeAnonRun\s*\(/.test(src)

    if (!hasAllowance) offenders.push(`${file} spends but has no per-user allowance`)
    if (!hasGlobalCap) offenders.push(`${file} spends but has no global anonymous cap`)
  }
  assert.deepEqual(offenders, [], offenders.join('\n'))
})

test('every route that spends money records what it used', () => {
  const offenders: string[] = []
  for (const file of routeFiles(API)) {
    if (EXEMPT[file]) continue
    const src = readFileSync(file, 'utf8')
    if (!SPENDS.test(src)) continue
    if (!/\brecord(Factcheck|Detector)Usage\s*\(/.test(src)) {
      offenders.push(`${file} spends but records no usage, so the allowance never moves`)
    }
  }
  assert.deepEqual(offenders, [], offenders.join('\n'))
})

test('the two checker routes share one budget', () => {
  // Two endpoints each enforcing their own copy of the monthly limit would
  // hand out double. Both must count the same event through the same helper.
  for (const file of [
    'src/app/api/factcheck/check/route.ts',
    'src/app/api/factcheck/extract/route.ts',
  ]) {
    const src = readFileSync(file, 'utf8')
    assert.match(src, /\bgetFactcheckAllowance\s*\(/, `${file} must read the shared allowance`)
    assert.match(src, /\brecordFactcheckUsage\s*\(/, `${file} must write the shared event`)
  }
})

test('a run that checked nothing is not charged, on either route', () => {
  for (const file of [
    'src/app/api/factcheck/check/route.ts',
    'src/app/api/factcheck/extract/route.ts',
  ]) {
    const src = readFileSync(file, 'utf8')
    assert.match(
      src,
      /check === 'supports' \|\| c\.citation\.check === 'does_not_contain'/,
      `${file} must gate the charge on something actually being judged`
    )
  }
})
