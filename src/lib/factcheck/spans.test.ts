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
  unanchoredClaims,
  markableClaims,
  firstPartyClaims,
  countByVerdict,
  citationsToFix,
  citationDensity,
  nothingToCheck,
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
    // Rendering moved to display.ts; what spans.ts still owns is that
    // resolveOverlaps never returns two claims covering the same character.
    const placed = resolveOverlaps(claims).filter(c => c.span)
    let last = -1
    for (const c of placed) {
      assert.ok(c.span!.start >= last, `case ${i} left overlapping spans`)
      last = c.span!.end
    }
  }
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

/* --------------------------------------------------- nothing to check */

test('a document with no figures and no sources has nothing to check', () => {
  // Marketing prose. Every claim is the author describing their own product,
  // so marking twenty of them is a wall of noise and none of them could ever
  // be checked. Saying so is a real answer.
  const marketing = ['a', 'b', 'c'].map(id => claim(id))
  assert.equal(nothingToCheck(marketing), true)
})

test('one real figure is enough to be worth marking', () => {
  // Deliberately strict: a single statistic means the document has something
  // in it, and the wall is worth having.
  const mixed = [claim('a'), claim('b'), claim('c', undefined, 'unchecked', { figure: '89%' })]
  assert.equal(nothingToCheck(mixed), false)
})

test('one real source is enough too', () => {
  const mixed = [
    claim('a'),
    claim('b', undefined, 'unchecked', { sourceForm: 'linked', sourceUrl: 'https://x.test' }),
  ]
  assert.equal(nothingToCheck(mixed), false)
})

test('an empty document is not "nothing to check"', () => {
  // No claims at all already has its own message. This one is about a document
  // full of claims that happen to be uncheckable.
  assert.equal(nothingToCheck([]), false)
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

// ---------------------------------------------------------------------------
// The attention flag on the citation axis
//
// The streaming route runs the citation axis only, so a claim with no source
// is never searched for. It still has to produce a flag, and it has to be a
// different sentence, because we cannot report a search we did not run.
// ---------------------------------------------------------------------------

function unsourced(over: Partial<Claim> = {}): Claim {
  return claim('c1', undefined, 'unchecked', {
    looksPublished: true,
    subject: 'population',
    kind: 'statistic',
    judgement: { verdict: 'unchecked', reason: 'not_checked', evidence: [] },
    citation: { check: 'not_applicable', unreadable: 'no_source', evidence: [] },
    ...over,
  })
}

test('an unsourced published-looking claim flags without a search', () => {
  const msg = attentionFlag(unsourced())
  assert.ok(msg)
  assert.match(msg, /cites nothing/)
  // It must never claim we looked.
  assert.doesNotMatch(msg, /could not find/)
})

test('the citation-axis flag stays off the writer\'s own figures', () => {
  assert.equal(attentionFlag(unsourced({ subject: 'first_party' })), null)
})

test('the citation-axis flag stays silent on our own failures', () => {
  for (const reason of ['deadline', 'search_failed', 'judge_failed'] as const) {
    const c = unsourced()
    c.judgement = { ...c.judgement, reason }
    assert.equal(attentionFlag(c), null, `${reason} must not produce a finding`)
  }
})

test('a claim that DID have a source does not get the unsourced flag', () => {
  assert.equal(
    attentionFlag(unsourced({ citation: { check: 'supports', evidence: [] } })),
    null
  )
})
