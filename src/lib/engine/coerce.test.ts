/**
 * One test per engine stage, fed a deliberately wrong-typed payload.
 *
 *   npx tsx --test src/lib/engine/coerce.test.ts
 *
 * WHAT THESE ASSERT
 *
 * Not "the output is nice". The single property that matters: a malformed
 * model response produces a usable result or a clean failure, and never an
 * exception that escapes to the route and becomes an unhandled 500.
 *
 * The payloads are not imaginative. They are the shapes strict:false actually
 * produces: a string field that arrived as an array, an object where a scalar
 * was declared, a null, an absent key. One of these took down a real request
 * with `text.includes is not a function`.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { asString, asText, asStringArray, asObjectArray, asEnum, isText } from './coerce'
import { toRubricAudit } from './diagnose'

/** Every shape a strict:false field has been seen to arrive as. */
const JUNK: unknown[] = [
  undefined, null, 42, 0, NaN, true, false, {}, [], ['a'], { a: 1 },
  () => {}, Symbol('x'), '', '  ',
]

/* ------------------------------------------------------------- accessors */

test('asString never returns a non-string, for any input', () => {
  for (const v of JUNK) {
    const out = asString(v)
    assert.equal(typeof out, 'string', `asString(${String(v)})`)
  }
  assert.equal(asString('hi'), 'hi')
  assert.equal(asString(150), '150')          // right answer, wrong shape
  assert.equal(asString(true), 'true')
  assert.equal(asString({}), '')              // never "[object Object]"
  assert.equal(asString(['a']), '')
  assert.equal(asString(undefined, 'fb'), 'fb')
})

test('asText trims and falls back on empty', () => {
  assert.equal(asText('  hi  '), 'hi')
  assert.equal(asText('   ', 'fb'), 'fb')
  assert.equal(asText({}, 'fb'), 'fb')
})

test('isText is true only for a string with content', () => {
  assert.equal(isText('a'), true)
  assert.equal(isText('  '), false)
  for (const v of JUNK.filter(v => typeof v !== 'string')) {
    assert.equal(isText(v), false, `isText(${String(v)})`)
  }
})

test('asStringArray drops unusable entries rather than coercing them', () => {
  assert.deepEqual(asStringArray(['a', '', null, 'b', {}, 3]), ['a', 'b', '3'])
  assert.deepEqual(asStringArray('not an array'), [])
  assert.deepEqual(asStringArray(null), [])
  assert.deepEqual(asStringArray(['a', 'b', 'c'], 2), ['a', 'b'])
})

test('asObjectArray keeps only real objects', () => {
  assert.deepEqual(asObjectArray([{ a: 1 }, null, 'x', [], 3]), [{ a: 1 }])
  assert.deepEqual(asObjectArray(null), [])
})

test('asEnum refuses a value the model invented', () => {
  const allowed = ['critical', 'moderate', 'minor'] as const
  assert.equal(asEnum('critical', allowed, 'minor'), 'critical')
  assert.equal(asEnum('catastrophic', allowed, 'minor'), 'minor')
  assert.equal(asEnum({}, allowed, 'minor'), 'minor')
})

/* ------------------------------------------------- stage: diagnose (audit) */

test('toRubricAudit survives every malformed audit shape', () => {
  // This is the mapper that threw in production, on f.evidence.trim().
  const shapes: unknown[] = [
    { intent: 'general', audit: { dimensions: 'nope', findings: 'nope', failure_forecast: 'nope' } },
    { intent: 'general', audit: { dimensions: [null], findings: [null], failure_forecast: [null] } },
    { intent: 'general', audit: { dimensions: [{}], findings: [{}], failure_forecast: [{}] } },
    { intent: 'general', audit: { findings: [{ dimension: 'x', severity: 'x', evidence: [], note: {} }] } },
    { intent: 'general', audit: {} },
    { intent: 'general' },
  ]

  for (const d of shapes) {
    const audit = toRubricAudit(d as never)
    assert.ok(Array.isArray(audit.findings), `findings array for ${JSON.stringify(d)}`)
    assert.ok(Array.isArray(audit.dimensions))
    assert.ok(Array.isArray(audit.failureForecast))
    for (const f of audit.findings) {
      assert.equal(typeof f.dimension, 'string')
      assert.equal(typeof f.note, 'string')
      assert.ok(['critical', 'moderate', 'minor'].includes(f.severity))
      assert.ok(f.evidence === null || typeof f.evidence === 'string')
    }
    for (const dim of audit.dimensions) {
      assert.equal(typeof dim.name, 'string')
      assert.equal(typeof dim.score, 'number')
      assert.ok(Number.isFinite(dim.score))
    }
    for (const p of audit.failureForecast) assert.equal(typeof p, 'string')
  }
})

test('toRubricAudit reproduces the exact production crash shape without throwing', () => {
  // evidence declared string, arrived as an array. `.trim()` threw here.
  const d = {
    intent: 'general',
    audit: {
      dimensions: [],
      findings: [{ dimension: 'goal', severity: 'critical', evidence: ['a', 'b'], note: 'n' }],
      failure_forecast: [],
    },
  }
  const audit = toRubricAudit(d as never)
  assert.equal(audit.findings[0].evidence, null)
  assert.equal(audit.findings[0].severity, 'critical')
})

/* ------------------------------------- stage: anything rendered to a user */

test('no accessor can produce a value React would refuse to render', () => {
  // React throws "Objects are not valid as a React child" on an object or an
  // array. Every value that reaches a component goes through these.
  for (const v of JUNK) {
    for (const out of [asString(v), asText(v)]) {
      assert.equal(typeof out, 'string')
      assert.ok(!out.includes('[object'), `leaked a stringified object: ${out}`)
    }
    for (const item of asStringArray(v)) {
      assert.equal(typeof item, 'string')
      assert.ok(!item.includes('[object'))
    }
  }
})
