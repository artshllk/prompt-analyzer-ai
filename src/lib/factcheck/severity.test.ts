/**
 * Severity grouping tests.
 *
 * The rule under test is an ordering rule, not a filtering one: nothing is
 * dropped, every count is reported, and the group the writer can act on leads.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupFindings, summaryLines, toFindings, FINDINGS_SHOWN } from './severity'
import type { Claim } from './types'

function claim(id: string, over: Partial<Claim> = {}): Claim {
  return {
    id, quote: 'q', claimText: `claim ${id}`, kind: 'statistic',
    subject: 'population', sourceForm: 'linked', sourceUrl: `https://x.test/${id}`,
    looksPublished: true,
    judgement: { verdict: 'unchecked', reason: 'not_checked', evidence: [] },
    citation: { check: 'not_applicable', evidence: [] },
    ...over,
  }
}
const unsupported = (id: string, figureOnPage?: boolean) =>
  claim(id, { citation: { check: 'does_not_contain', evidence: [], figureOnPage } })
const unreachable = (id: string) =>
  claim(id, { citation: { check: 'source_unreachable', evidence: [] } })
const paywalled = (id: string) =>
  claim(id, { citation: { check: 'source_unreachable', unreadable: 'paywalled', evidence: [] } })
const dead = (id: string) =>
  claim(id, { citation: { check: 'source_unreachable', unreadable: 'dead', evidence: [] } })
const noSource = (id: string, over: Partial<Claim> = {}) =>
  claim(id, {
    sourceForm: 'none',
    sourceUrl: undefined,
    citation: { check: 'not_applicable', unreadable: 'no_source', evidence: [] },
    ...over,
  })
const live = (id: string) =>
  claim(id, { judgement: { verdict: 'unchecked', reason: 'live_source', evidence: [] } })

test('context mismatch and missing figure are different findings', () => {
  // "The number is on the page but attached to something else" is a
  // misreading and the fix is to reword. "It is not there at all" is a
  // sourcing problem and the fix is to find the right page. Telling someone
  // to go find a source they already have is the wrong instruction.
  const [ctx] = toFindings([unsupported('a', true)])
  const [absent] = toFindings([unsupported('b')])
  assert.equal(ctx.kind, 'context_mismatch')
  assert.equal(absent.kind, 'not_present')
  assert.notEqual(ctx.headline, absent.headline)
  assert.notEqual(ctx.fix, absent.fix)
  assert.match(ctx.fix, /may not need a different source/)
  assert.match(absent.fix, /Find the page/)
})

test('the group the writer can act on always leads', () => {
  const g = groupFindings([live('a'), unreachable('b'), unsupported('c')])
  assert.equal(summaryLines(g)[0], '1 citation does not support their claim.')
})

test('nothing is dropped, and every count is reported', () => {
  const claims = [
    unsupported('a'), unsupported('b'), unsupported('c'), unsupported('d'), unsupported('e'),
    live('f'), unreachable('g'),
  ]
  const g = groupFindings(claims)
  assert.equal(g.total, 7, 'every finding is present')
  assert.equal(g.unsupported.length, 5)
  assert.equal(g.lead.length, FINDINGS_SHOWN, 'only three lead')
  assert.equal(g.leadHidden, 2, 'the rest are counted, not lost')
  assert.equal(g.lead.length + g.leadHidden, g.unsupported.length)
  const text = summaryLines(g).join(' ')
  assert.match(text, /5 citations do not support/)
  assert.match(text, /1 citation your reader cannot verify either: 1 live dashboard/)
  assert.match(text, /1 could not be checked/)
})

test('a missing figure outranks a context mismatch within the lead', () => {
  // Both are real. "Not there at all" needs a new source and "means something
  // else" needs a reworded sentence, so the bigger job gets fresh attention.
  const g = groupFindings([unsupported('a', true), unsupported('b', false)])
  assert.deepEqual(g.unsupported.map(f => f.claim.id), ['b', 'a'])
})

test('our own failures are never described as the writer doing something wrong', () => {
  const [f] = toFindings([unreachable('a')])
  assert.equal(f.group, 'unchecked')
  assert.match(f.fix, /our problem, not a finding about your writing/)
})

test('a live source is its own group with its own fix', () => {
  const [f] = toFindings([live('a')])
  assert.equal(f.group, 'unverifiable')
  assert.match(f.fix, /date you read it/)
})

test('cannot-check is a finding about the reader, not a gap in our coverage', () => {
  // A paywall stops the writer's reader the same way it stopped us, and a dead
  // link lands them on nothing. Both are real credibility problems with an
  // unambiguous fix, statable with total confidence without judging anything.
  const g = groupFindings([paywalled('a'), paywalled('b'), dead('c'), live('d')])
  assert.equal(g.unverifiable.length, 4)
  assert.deepEqual(g.unverifiableBreakdown, { paywalled: 2, dead: 1, live: 1 })
  assert.equal(
    summaryLines(g)[0],
    '4 citations your reader cannot verify either: 2 paywalled, 1 dead, 1 live dashboard.'
  )
})

test('a paywall and a dead link get different fixes', () => {
  assert.match(toFindings([paywalled('a')])[0].fix, /Cite the primary source/)
  assert.match(toFindings([dead('b')])[0].fix, /Repoint it/)
})

test('our own failure is still ours, and never blamed on the reader', () => {
  const [f] = toFindings([unreachable('a')])
  assert.equal(f.group, 'unchecked')
})

test('the mismatch split is deterministic, not a model judgement', () => {
  // Keyed on an indexOf over the retrieved page. Asking the judge for the
  // source's figure distinguished only 8 of 13 real cases, and the fallback
  // exists only for a result recorded before the field did.
  assert.equal(toFindings([unsupported('a', true)])[0].kind, 'context_mismatch')
  assert.equal(toFindings([unsupported('b', false)])[0].kind, 'not_present')
  const legacy = claim('c', {
    citation: { check: 'does_not_contain', evidence: [], sourceFigure: '34.2%' },
  })
  assert.equal(toFindings([legacy])[0].kind, 'context_mismatch', 'falls back when unset')
})

test('numbers with no link get their own line, and it is usually the biggest', () => {
  // 55 of 114 across 11 real articles, 48%, larger than every other category
  // combined. It was silently producing no finding at all.
  const g = groupFindings([noSource('a'), noSource('b'), noSource('c'), unsupported('d')])
  assert.equal(g.noSource.length, 3)
  assert.deepEqual(summaryLines(g), [
    '1 citation does not support their claim.',
    '3 numbers have no source at all.',
  ])
})

test('a first-party number is never told it has no source', () => {
  // Telling somebody their own figure needs a citation is telling them to
  // cite themselves.
  const g = groupFindings([noSource('own', { subject: 'first_party' })])
  assert.equal(g.noSource.length, 0)
  assert.deepEqual(summaryLines(g), [])
})

test('the summary reads in the order the writer should act', () => {
  const g = groupFindings([unsupported('a'), noSource('b'), live('c')])
  assert.deepEqual(summaryLines(g), [
    '1 citation does not support their claim.',
    '1 number has no source at all.',
    '1 citation your reader cannot verify either: 1 live dashboard.',
  ])
})

test('a clean document produces no findings and no lines', () => {
  const g = groupFindings([claim('a'), claim('b')])
  assert.equal(g.total, 0)
  assert.deepEqual(summaryLines(g), [])
})

test('grouping is stable across input order', () => {
  const mk = () => [unsupported('c'), unsupported('a'), unsupported('b')]
  const forward = groupFindings(mk()).lead.map(f => f.claim.id)
  const backward = groupFindings(mk().reverse()).lead.map(f => f.claim.id)
  assert.deepEqual(forward, backward)
})
