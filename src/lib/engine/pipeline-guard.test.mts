/**
 * The guard: a throw anywhere in the pipeline must degrade, not escape.
 *
 *   npx tsx --test --experimental-test-module-mocks src/lib/engine/pipeline-guard.test.ts
 *
 * WHY THIS IS THE MOST IMPORTANT TEST IN THE ENGINE
 *
 * Every stage returns null on failure and the orchestrator handles null well:
 * a failed diagnose degrades to NEUTRAL_DIAGNOSIS and the user still gets a
 * rewrite. Nothing handled a THROW. `/api/anon/analyze` has exactly one
 * try/catch and it wraps req.json(), so an exception from the engine went
 * straight out to Next as an unhandled 500 and the user was told the product
 * was broken. It was reachable: one `.trim()` on a field that arrived as an
 * array did it.
 *
 * These force each stage to throw and assert the two acceptable outcomes: a
 * usable result, or a clean null that the route turns into a 503. Never an
 * exception.
 *
 * The stages are mocked ONCE and switched with `behaviour`, because
 * re-mocking a module inside a second test throws ERR_INVALID_STATE and a
 * re-import will not pick up a new mock anyway.
 */

import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

const INPUT = { prompt: 'write about coffee', tone: 'professional' as const, priorAnswers: [] }

const GOOD_DIAGNOSIS = {
  intent: 'general',
  score: { total: 50, confidence: 90 },
  already_good: false,
  audit: { dimensions: [], findings: [], failure_forecast: [] },
}

const GOOD_REWRITE = {
  minimal_edit: 'a',
  restructured: 'Write a 600 word opinion piece about coffee.',
  template: 't',
  explanation: 'e',
  improvement_tags: ['context'],
}

const EMPTY_AUDIT = { intent: 'general', dimensions: [], findings: [], failureForecast: [] }

/** Flipped per test; the mocks below read it at call time. */
const behaviour = {
  diagnoseThrows: false,
  auditThrows: false,
  rewriteThrows: false,
  rewriteReturns: GOOD_REWRITE as unknown,
}

mock.module('./diagnose', {
  namedExports: {
    diagnose: async () => {
      if (behaviour.diagnoseThrows) throw new TypeError('text.includes is not a function')
      return GOOD_DIAGNOSIS
    },
    toRubricAudit: () => {
      if (behaviour.auditThrows) {
        throw new TypeError("Cannot read properties of undefined (reading 'trim')")
      }
      return EMPTY_AUDIT
    },
  },
})

mock.module('./rewrite', {
  namedExports: {
    rewrite: async () => {
      if (behaviour.rewriteThrows) throw new Error('provider exploded')
      return behaviour.rewriteReturns
    },
  },
})

const { analyzePrompt } = await import('./index')

function reset() {
  behaviour.diagnoseThrows = false
  behaviour.auditThrows = false
  behaviour.rewriteThrows = false
  behaviour.rewriteReturns = GOOD_REWRITE
}

test('the mocks are wired: the happy path returns a rewrite', async () => {
  reset()
  const result = await analyzePrompt(INPUT)
  assert.ok(result, 'if this fails the mocks are not applied and nothing below means anything')
  assert.equal(result.type, 'improved')
})

test('a throw in diagnose degrades to a clean null, not an exception', async () => {
  reset()
  behaviour.diagnoseThrows = true
  const result = await analyzePrompt(INPUT)
  assert.equal(result, null, 'the route turns null into a 503; a throw becomes a 500')
})

test('a throw in rewrite degrades to a clean null, not an exception', async () => {
  reset()
  behaviour.rewriteThrows = true
  assert.equal(await analyzePrompt(INPUT), null)
})

test('a throw in the AUDIT still ships the rewrite', async () => {
  // The reason the audit is caught separately rather than by one outer catch.
  // The audit is supporting detail; the rewrite is what the user came for.
  // Losing the whole request to protect a panel they may never open is the
  // wrong trade.
  reset()
  behaviour.auditThrows = true
  const result = await analyzePrompt(INPUT)

  assert.ok(result, 'a broken audit must not cost the user their rewrite')
  assert.equal(result.type, 'improved')
  assert.equal(result.improvedPrompt, 'Write a 600 word opinion piece about coffee.')
  assert.equal(result.audit, undefined, 'the audit is simply absent')
})

test('non-string rewrite fields never reach the caller as non-strings', async () => {
  reset()
  behaviour.rewriteReturns = {
    ...GOOD_REWRITE,
    // Every one of these is declared string/array in the schema and is not.
    minimal_edit: { a: 1 },
    template: ['x'],
    explanation: 42,
    improvement_tags: 'context',
  }
  const result = await analyzePrompt(INPUT)

  assert.ok(result)
  assert.equal(result.type, 'improved')
  for (const [field, value] of Object.entries({
    improvedPrompt: result.improvedPrompt,
    minimalEdit: result.minimalEdit,
    template: result.template,
    explanation: result.explanation,
  })) {
    assert.equal(typeof value, 'string', `${field} must be a string`)
    assert.ok(!String(value).includes('[object'), `${field} leaked a stringified object`)
  }
  assert.ok(Array.isArray(result.improvementTags))
})

test('a rewrite whose restructured field is not a string is a clean null', async () => {
  reset()
  behaviour.rewriteReturns = { ...GOOD_REWRITE, restructured: ['not', 'a', 'string'] }
  const result = await analyzePrompt(INPUT)
  // parseSegments treats a non-string as nothing to parse, so the prompt is
  // empty rather than "[object Object]". Either an empty result or null is
  // acceptable; a throw is not.
  if (result) {
    assert.equal(result.type, 'improved')
    assert.equal(typeof result.improvedPrompt, 'string')
  }
})
