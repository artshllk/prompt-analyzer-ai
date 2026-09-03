import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDisplay, toDisplayRuns } from './display'

const DOC =
  'Search is big. [BrightEdge](https://videos.brightedge.com/r.pdf) found that 68% of ' +
  'traffic is search. See also [the study](https://sparktoro.com/blog/x/) for more.'

test('link syntax leaves the display and the anchor text stays', () => {
  const d = buildDisplay(DOC)
  assert.doesNotMatch(d.text, /\]\(http/)
  assert.doesNotMatch(d.text, /https?:\/\//)
  assert.match(d.text, /BrightEdge found that 68% of traffic is search/)
  assert.equal(d.links.length, 2)
  assert.equal(d.text.slice(d.links[0].start, d.links[0].end), 'BrightEdge')
  assert.equal(d.links[0].href, 'https://videos.brightedge.com/r.pdf')
})

test('the source is never touched', () => {
  const before = DOC
  buildDisplay(DOC)
  assert.equal(DOC, before, 'spans index into this exact string')
})

// ---------------------------------------------------------------------------
// Offsets. This is the whole reason the file exists.
// ---------------------------------------------------------------------------

test('a span after a link still lands on its own words', () => {
  const d = buildDisplay(DOC)
  const quote = '68% of traffic is search'
  const at = DOC.indexOf(quote)
  assert.ok(at > 0)
  assert.equal(d.text.slice(d.toDisplay(at), d.toDisplay(at + quote.length)), quote)
})

test('a span before any link is unmoved', () => {
  const d = buildDisplay(DOC)
  assert.equal(d.toDisplay(0), 0)
  assert.equal(d.text.slice(d.toDisplay(0), d.toDisplay(14)), 'Search is big.')
})

test('an offset inside link syntax clamps into the anchor, never past it', () => {
  const d = buildDisplay(DOC)
  const linkAt = DOC.indexOf('[BrightEdge]')
  const l = d.links[0]
  // The opening bracket, the middle of the URL, and the closing paren all
  // resolve somewhere inside the anchor rather than into the next sentence.
  for (const off of [linkAt, linkAt + 5, DOC.indexOf('brightedge.com'), DOC.indexOf('.pdf)') + 4]) {
    const p = d.toDisplay(off)
    assert.ok(p >= l.start && p <= l.end, `offset ${off} escaped the anchor: ${p}`)
  }
})

test('offsets never go backwards', () => {
  const d = buildDisplay(DOC)
  let last = -1
  for (let i = 0; i <= DOC.length; i++) {
    const p = d.toDisplay(i)
    assert.ok(p >= last, `offset ${i} moved backwards`)
    last = p
  }
  assert.equal(d.toDisplay(DOC.length), d.text.length)
})

test('a bare link with no anchor text shows its host, not nothing', () => {
  const d = buildDisplay('See [](https://example.com/a/b) here.')
  assert.match(d.text, /See example\.com here\./)
  assert.equal(d.links.length, 1)
})

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

test('a claim and a link that overlap become separate runs, not nested', () => {
  const doc = 'A claim citing [BrightEdge](https://b.com/x) inside it here.'
  const d = buildDisplay(doc)
  const start = doc.indexOf('A claim')
  const end = doc.indexOf('inside it') + 'inside it'.length
  const runs = toDisplayRuns(d, [{ id: 'c1', start, end }])
  const both = runs.filter(r => r.claimId && r.href)
  assert.equal(both.length, 1, 'the anchor text is one run owned by both')
  assert.equal(both[0].text, 'BrightEdge')
  // And the claim continues either side of it, so the mark stays clickable.
  assert.ok(runs.some(r => r.claimId === 'c1' && !r.href && r.text.includes('A claim citing')))
  assert.ok(runs.some(r => r.claimId === 'c1' && !r.href && r.text.includes('inside it')))
})

test('the runs rebuild the display string exactly', () => {
  const d = buildDisplay(DOC)
  const quote = '68% of traffic is search'
  const at = DOC.indexOf(quote)
  const runs = toDisplayRuns(d, [{ id: 'c1', start: at, end: at + quote.length }])
  assert.equal(runs.map(r => r.text).join(''), d.text, 'no character lost or duplicated')
})

test('a document with no links passes straight through', () => {
  const plain = 'Nothing to see. Just words.'
  const d = buildDisplay(plain)
  assert.equal(d.text, plain)
  assert.equal(d.links.length, 0)
  assert.equal(d.toDisplay(5), 5)
})

// ---------------------------------------------------------------------------
// Defensive. Ported from toRenderRuns, which this replaced.
// ---------------------------------------------------------------------------

const PLAIN = 'Adoption rose sharply. Then it levelled off. Nobody explained why.'

test('a span past the end of the document is skipped, not clamped', () => {
  // Clamping would map it onto the last character and paint a mark on an
  // innocent sentence, which is worse than showing no mark at all.
  const d = buildDisplay(PLAIN)
  const runs = toDisplayRuns(d, [{ id: 'bad', start: 0, end: PLAIN.length + 50 }])
  assert.equal(runs.map(r => r.text).join(''), PLAIN)
  assert.ok(runs.every(r => r.claimId === null), 'the bad span must not be marked')
})

test('an inverted span is skipped', () => {
  const d = buildDisplay(PLAIN)
  const runs = toDisplayRuns(d, [{ id: 'bad', start: 30, end: 10 }])
  assert.equal(runs.map(r => r.text).join(''), PLAIN)
  assert.ok(runs.every(r => r.claimId === null))
})

test('touching claims stay separate and lose nothing', () => {
  const d = buildDisplay(PLAIN)
  const runs = toDisplayRuns(d, [
    { id: 'a', start: 0, end: 22 },
    { id: 'b', start: 22, end: 44 },
  ])
  assert.equal(runs.map(r => r.text).join(''), PLAIN)
  assert.ok(runs.every(r => r.text.length > 0), 'no empty run')
  assert.deepEqual(runs.filter(r => r.claimId).map(r => r.claimId), ['a', 'b'])
})

test('an empty document produces no runs', () => {
  assert.deepEqual(toDisplayRuns(buildDisplay(''), []), [])
})

test('a document with no claims is one plain run', () => {
  const runs = toDisplayRuns(buildDisplay(PLAIN), [])
  assert.equal(runs.length, 1)
  assert.equal(runs[0].claimId, null)
  assert.equal(runs[0].text, PLAIN)
})
