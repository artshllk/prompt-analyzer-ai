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
import {
  resolveOverlaps,
  toRenderRuns,
  unanchoredClaims,
  markableClaims,
  firstPartyClaims,
  countByVerdict,
  citationsToFix,
  citationDensity,
} from './spans'
import {
  attentionFlag,
  CITATION_CHECKS,
  CLAIM_VERDICTS,
  type Claim,
  type ClaimVerdict,
  type ClaimSubject,
  type SourceForm,
} from './types'

function claim(
  id: string,
  span?: [number, number],
  verdict: ClaimVerdict = 'unchecked',
  extra: Partial<Claim> = {}
): Claim {
  return {
    id,
    quote: 'q',
    claimText: 'q',
    kind: 'assertion',
    subject: 'population',
    sourceForm: 'none',
    looksPublished: false,
    span: span ? { start: span[0], end: span[1], precision: 'exact' } : undefined,
    judgement: { verdict, evidence: [] },
    citation: { check: 'not_applicable', evidence: [] },
    ...extra,
  }
}

/** A claim shaped only by the fields the density and axis helpers read. */
function shaped(id: string, subject: ClaimSubject, sourceForm: SourceForm): Claim {
  return claim(id, undefined, 'unchecked', { subject, sourceForm })
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
    claim('c', undefined, 'unchecked'),
    claim('d', undefined, 'verified'),
  ]
  const c = countByVerdict(claims)
  assert.equal(c.verified, 2)
  assert.equal(c.contradicted, 1)
  assert.equal(c.unchecked, 1)
  assert.equal(c.verified + c.unchecked + c.contradicted, c.total)
})

/* --------------------------------------------------------- the two axes */

test('the two axes share no values, so a citation defect cannot accuse', () => {
  // The whole extension of the governing rule rests on this. A citation check
  // returning `does_not_contain` must be unable to become `contradicted`, and
  // the guarantee is that no value of one union is a value of the other. A
  // future careless edit that adds one to the other breaks here rather than in
  // front of a writer.
  const overlap = (CITATION_CHECKS as readonly string[]).filter(v =>
    (CLAIM_VERDICTS as readonly string[]).includes(v)
  )
  assert.deepEqual(overlap, [])
  assert.ok(!(CITATION_CHECKS as readonly string[]).includes('contradicted'))
})

test('a first-party claim is never marked and never counted as uncited', () => {
  // 84% of a case study is the author's own numbers. Marking them paints a
  // wall of amber over a document that has done nothing wrong.
  const claims = [
    shaped('own', 'first_party', 'none'),
    shaped('theirs', 'population', 'linked'),
  ]
  assert.deepEqual(markableClaims(claims).map(c => c.id), ['theirs'])
  assert.deepEqual(firstPartyClaims(claims).map(c => c.id), ['own'])

  const d = citationDensity(claims)
  assert.equal(d.firstParty, 1)
  assert.equal(d.linked, 1)
  assert.equal(d.none, 0, 'a first-party claim must not count as an uncited one')
  assert.equal(d.ratio, 1)
})

test('a first-party claim is never given a span, even when it has one', () => {
  const claims = [
    claim('own', [0, 10], 'unchecked', { subject: 'first_party' }),
    claim('theirs', [11, 20]),
  ]
  assert.deepEqual(resolveOverlaps(claims).map(c => c.id), ['theirs'])
  // And it does not fall through into the "could not place it" list either,
  // which would explain it wrongly.
  assert.deepEqual(unanchoredClaims(claims).map(c => c.id), [])
})

test('citation density bands match the measured distribution', () => {
  const doc = (linked: number, total: number) =>
    citationDensity([
      ...Array.from({ length: linked }, (_, i) => shaped(`l${i}`, 'population', 'linked')),
      ...Array.from({ length: total - linked }, (_, i) => shaped(`n${i}`, 'population', 'none')),
    ])

  // Ahrefs 100%, Semrush 98%, Backlinko 77% -> well cited.
  assert.equal(doc(77, 100).band, 'well_cited')
  // SproutSocial 55% -> mixed. The observed gap sits below this.
  assert.equal(doc(55, 100).band, 'mixed')
  // Wyzowl 13%, DemandSage 11% -> uncited.
  assert.equal(doc(12, 100).band, 'uncited')
})

test('a document of only first-party claims does not divide by zero', () => {
  const d = citationDensity([shaped('a', 'first_party', 'none')])
  assert.equal(d.ratio, 0)
  assert.equal(d.band, 'uncited')
  assert.ok(Number.isFinite(d.ratio))
})

test('citations to fix counts only real defects, and never first-party ones', () => {
  const claims = [
    claim('a', undefined, 'verified', {
      citation: { check: 'does_not_contain', evidence: [] },
    }),
    claim('b', undefined, 'verified', {
      citation: { check: 'supports', evidence: [] },
    }),
    claim('c', undefined, 'unchecked', {
      subject: 'first_party',
      citation: { check: 'does_not_contain', evidence: [] },
    }),
  ]
  assert.equal(citationsToFix(claims), 1)
})

/* ------------------------------------------------------ attention flag */

test('the attention flag never fires on anything it could be wrong about', () => {
  const base = (extra: Partial<Claim>) => claim('x', undefined, 'unchecked', extra)

  // Fires: population-shaped, searched properly, nothing found.
  assert.ok(
    attentionFlag(
      base({ looksPublished: true, judgement: { verdict: 'unchecked', reason: 'not_found', evidence: [] } })
    )
  )

  // Silent on a first-party number. Finding nothing there means nothing.
  assert.equal(
    attentionFlag(
      base({
        looksPublished: true,
        subject: 'first_party',
        judgement: { verdict: 'unchecked', reason: 'not_found', evidence: [] },
      })
    ),
    null
  )
  // Silent when the silence was OUR fault rather than the web's.
  for (const reason of ['search_failed', 'judge_failed', 'deadline', 'not_checked'] as const) {
    assert.equal(
      attentionFlag(base({ looksPublished: true, judgement: { verdict: 'unchecked', reason, evidence: [] } })),
      null,
      `must stay silent when the reason is ${reason}`
    )
  }
  // Silent on anything we actually settled.
  assert.equal(
    attentionFlag(base({ looksPublished: true, judgement: { verdict: 'verified', evidence: [] } })),
    null
  )
})
