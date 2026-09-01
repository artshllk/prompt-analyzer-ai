/**
 * Span flattening tests.
 *
 * The invariant that matters most is reconstruction: joining every run's text
 * must reproduce the document character for character. A rendering bug that
 * quietly drops or duplicates a sentence of somebody's writing is worse than
 * one that crashes, because nobody notices it.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveOverlaps, toRenderRuns, unanchoredClaims, countByState } from './spans'
import type { Claim, ClaimState } from './types'

function claim(
  id: string,
  span?: [number, number],
  state: ClaimState = 'unverifiable'
): Claim {
  return {
    id,
    quote: 'q',
    claimText: 'q',
    kind: 'assertion',
    span: span ? { start: span[0], end: span[1], precision: 'exact' } : undefined,
    verdict: { state, evidence: [] },
  }
}

const DOC = 'Revenue grew 40% last year. The team doubled. Profit fell 12%.'

/* ------------------------------------------------------- reconstruction */

test('runs always rejoin to the exact document', () => {
  const cases: Claim[][] = [
    [],
    [claim('a', [0, 26])],
    [claim('a', [0, 26]), claim('b', [27, 44])],
    [claim('a', [8, 12]), claim('b', [45, 61])],
    // overlapping
    [claim('a', [0, 26]), claim('b', [8, 30])],
    // touching, no gap
    [claim('a', [0, 26]), claim('b', [26, 44])],
    // unanchored mixed in
    [claim('a', [0, 26]), claim('b')],
  ]
  for (const [i, claims] of cases.entries()) {
    const joined = toRenderRuns(DOC, claims).map(r => r.text).join('')
    assert.equal(joined, DOC, `case ${i} did not reconstruct the document`)
  }
})

test('an empty document produces no runs', () => {
  assert.deepEqual(toRenderRuns('', []), [])
})

test('a document with no claims is one plain run', () => {
  const runs = toRenderRuns(DOC, [])
  assert.equal(runs.length, 1)
  assert.equal(runs[0].claimId, null)
  assert.equal(runs[0].text, DOC)
})

/* ------------------------------------------------------------ overlaps */

test('overlapping claims: the first in document order wins', () => {
  const kept = resolveOverlaps([claim('a', [0, 26]), claim('b', [8, 30])])
  assert.deepEqual(kept.map(c => c.id), ['a'])
})

test('severity never decides geometry', () => {
  // A contradicted claim must NOT be able to spread its mark over a
  // neighbouring verified one just because it is more severe. That would
  // paint red across a sentence nobody disputed.
  const kept = resolveOverlaps([
    claim('verified-first', [0, 26], 'verified'),
    claim('contradicted-overlapping', [8, 30], 'contradicted'),
  ])
  assert.deepEqual(kept.map(c => c.id), ['verified-first'])
})

test('resolution is stable across repeated calls and input order', () => {
  const a = claim('a', [0, 26])
  const b = claim('b', [8, 30])
  const one = resolveOverlaps([a, b]).map(c => c.id)
  const two = resolveOverlaps([b, a]).map(c => c.id)
  assert.deepEqual(one, two, 'input order must not change the outcome')
  assert.deepEqual(one, resolveOverlaps([a, b]).map(c => c.id), 'must be stable')
})

test('adjacent claims that merely touch both survive', () => {
  const kept = resolveOverlaps([claim('a', [0, 26]), claim('b', [26, 44])])
  assert.deepEqual(kept.map(c => c.id), ['a', 'b'])
})

test('three overlapping claims keep only the first', () => {
  const kept = resolveOverlaps([
    claim('a', [0, 30]),
    claim('b', [5, 35]),
    claim('c', [10, 40]),
  ])
  assert.deepEqual(kept.map(c => c.id), ['a'])
})

/* ---------------------------------------------------------- defensive */

test('a span outside the document is skipped, not rendered', () => {
  // Rendering it would truncate the output, so the user would silently get
  // back less text than they pasted.
  const runs = toRenderRuns(DOC, [claim('bad', [0, DOC.length + 50])])
  assert.equal(runs.map(r => r.text).join(''), DOC)
  assert.ok(runs.every(r => r.claimId === null), 'the bad span must not be marked')
})

test('an inverted span is skipped', () => {
  const runs = toRenderRuns(DOC, [claim('bad', [30, 10])])
  assert.equal(runs.map(r => r.text).join(''), DOC)
})

test('no run is ever empty', () => {
  const runs = toRenderRuns(DOC, [claim('a', [0, 26]), claim('b', [26, 44])])
  assert.ok(runs.every(r => r.text.length > 0))
})

/* -------------------------------------------------------- unanchored */

test('claims with no span are reported as unanchored', () => {
  const claims = [claim('a', [0, 26]), claim('b'), claim('c')]
  assert.deepEqual(unanchoredClaims(claims).map(c => c.id), ['b', 'c'])
})

test('a claim dropped for overlapping is also unanchored, not lost', () => {
  // It could not be shown in place, but it is still a real claim and it still
  // has to appear somewhere. Losing it silently would mean the count in the
  // summary does not match what the reader can see.
  const claims = [claim('a', [0, 26]), claim('b', [8, 30])]
  assert.deepEqual(unanchoredClaims(claims).map(c => c.id), ['b'])
})

/* ------------------------------------------------------------- counts */

test('counts add up to the total, always', () => {
  const claims = [
    claim('a', [0, 5], 'verified'),
    claim('b', [6, 10], 'contradicted'),
    claim('c', undefined, 'unverifiable'),
    claim('d', undefined, 'verified'),
  ]
  const c = countByState(claims)
  assert.equal(c.verified, 2)
  assert.equal(c.contradicted, 1)
  assert.equal(c.unverifiable, 1)
  assert.equal(c.verified + c.unverifiable + c.contradicted, c.total)
})
