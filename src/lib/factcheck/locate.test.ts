/**
 * Anchoring tests.
 *
 *   npx tsx --test src/lib/factcheck/locate.test.ts
 *
 * The metric these exist to protect is misanchorRate, and the target is zero.
 * Failing to place a claim is a small loss: it renders in a list instead of
 * inline. Placing it WRONG puts a coloured mark on an innocent sentence, and
 * if that mark is red we have accused the writer of fabricating something they
 * wrote correctly. The reader sees that instantly.
 *
 * So almost every case below asserts one of two things: the span is exactly
 * right, or there is no span at all. There is no third acceptable outcome.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeDocument,
  buildFoldedIndex,
  locateQuote,
  locateAll,
} from './locate'

/** Assert a span covers exactly the text we expected, in the real document. */
function assertSpans(doc: string, span: { start: number; end: number } | undefined, expected: string, label: string) {
  assert.ok(span, `${label}: expected a span, got none`)
  assert.equal(doc.slice(span.start, span.end), expected, `${label}: span covers the wrong text`)
}

const one = (doc: string, quote: string, from = 0) =>
  locateQuote(doc, buildFoldedIndex(doc), quote, { searchFrom: from })

/* ------------------------------------------------------------- normalize */

test('normalize collapses CRLF and applies NFC, and nothing else', () => {
  assert.equal(normalizeDocument('a\r\nb\rc'), 'a\nb\nc')
  // Indentation and blank lines are structure. They survive.
  assert.equal(normalizeDocument('a\n\n    b'), 'a\n\n    b')
})

/* ---------------------------------------------------------------- exact */

test('an exact unique quote anchors exactly', () => {
  const doc = 'Revenue grew 40% last year. The team doubled.'
  const hit = one(doc, 'Revenue grew 40% last year.')
  assertSpans(doc, hit?.span, 'Revenue grew 40% last year.', 'exact')
  assert.equal(hit?.span.precision, 'exact')
})

test('a quote that is not in the document at all returns null', () => {
  const doc = 'Revenue grew 40% last year.'
  assert.equal(one(doc, 'Profit fell 12% last quarter.'), null)
})

test('an empty or whitespace quote returns null', () => {
  const doc = 'Revenue grew 40%.'
  assert.equal(one(doc, ''), null)
  assert.equal(one(doc, '   '), null)
})

/* ----------------------------------------------------------- repetition */

test('a repeated phrase with no cursor takes the FIRST occurrence', () => {
  // Deterministic, not a coin flip. Claims arrive in document order, so the
  // first claim quoting a repeated phrase belongs to its first occurrence.
  // The danger is not "which one", it is "a different one each run".
  const doc = 'The number is 42. The number is 42.'
  const hit = one(doc, 'The number is 42.')
  assert.ok(hit, 'a repeated phrase should still anchor')
  assert.equal(hit.span.start, 0, 'must take the first occurrence, every time')
  // And it must be stable across repeated calls.
  assert.equal(one(doc, 'The number is 42.')?.span.start, 0)
})

test('a repeated phrase whose occurrences are all behind the cursor does NOT anchor', () => {
  // This is the case that must fail closed. Both occurrences are already
  // consumed by earlier claims, so there is nothing left to point at and
  // guessing would land the mark on a sentence another claim already owns.
  const doc = 'The number is 42. The number is 42. Then something else entirely.'
  const past = buildFoldedIndex(doc).folded.length - 5
  assert.equal(one(doc, 'The number is 42.', past), null)
})

test('a repeated phrase resolves by document order when a cursor exists', () => {
  const doc = 'We surveyed 200 customers. Then we surveyed 200 customers again.'
  const claims = [{ quote: 'We surveyed 200 customers' }, { quote: 'we surveyed 200 customers' }]
  const located = locateAll(doc, claims)
  assert.ok(located[0].span, 'first occurrence should anchor')
  assert.ok(located[1].span, 'second occurrence should anchor')
  assert.ok(
    located[1].span!.start > located[0].span!.start,
    'the second claim must land after the first, not on top of it'
  )
})

/* --------------------------------------------------------------- folded */

test('a reflowed quote anchors, and covers the real text', () => {
  const doc = 'The report found that\n   revenue grew 40%\n   last year.'
  const hit = one(doc, 'The report found that revenue grew 40% last year.')
  assertSpans(doc, hit?.span, 'The report found that\n   revenue grew 40%\n   last year.', 'reflowed')
  assert.equal(hit?.span.precision, 'folded')
})

test('straightened curly quotes and dashes still anchor', () => {
  const doc = 'She said “it doubled” in 2023—2024.'
  const hit = one(doc, 'She said "it doubled" in 2023-2024.')
  assertSpans(doc, hit?.span, doc, 'typography')
})

test('case differences still anchor', () => {
  const doc = 'Revenue Grew Forty Percent.'
  const hit = one(doc, 'revenue grew forty percent.')
  assertSpans(doc, hit?.span, 'Revenue Grew Forty Percent.', 'case')
})

/* ---------------------------------------------------------------- fuzzy */

test('a paraphrased middle anchors within a bounded span', () => {
  const doc = 'According to the 2023 Ofcom report, mobile use rose by twelve percent among adults.'
  const hit = one(doc, 'According to the 2023 Ofcom report, mobile use climbed twelve percent among adults.')
  if (hit) {
    assert.equal(hit.span.precision, 'fuzzy')
    const covered = doc.slice(hit.span.start, hit.span.end)
    assert.ok(covered.startsWith('According to the 2023'), 'must start at the head anchor')
    assert.ok(covered.endsWith('among adults.'), 'must end at the tail anchor')
  }
})

test('anchor-and-extend refuses to swallow the document', () => {
  // Head and tail both present but a paragraph apart. Marking everything
  // between them would put a coloured span over unrelated sentences.
  const doc =
    'The study found that ' + 'unrelated filler sentence. '.repeat(40) + 'adoption rose sharply.'
  const hit = one(doc, 'The study found that adoption rose sharply.')
  assert.equal(hit, null, 'a 1000-character gap must not be bridged')
})

test('a short quote never uses the fuzzy path', () => {
  // Under 8 words there is not enough anchor to be safe, so a near-miss must
  // fail rather than land somewhere plausible.
  const doc = 'Revenue grew sharply last year across every region.'
  assert.equal(one(doc, 'Profit grew sharply'), null)
})

/* ------------------------------------------------ the invariant that matters */

test('no span ever covers text unrelated to its quote', () => {
  // Property check: for every quote that DOES anchor, the covered text must
  // fold to something containing the folded quote. That is the formal version
  // of "the mark is on the right sentence".
  const doc = normalizeDocument(
    'A 2023 study by the Institute found that 42% of small firms close within two years.\n\n' +
      'Separately, revenue grew 40% last year. The team doubled in size.\n\n' +
      'She said “we never expected it” at the conference.'
  )
  const quotes = [
    'A 2023 study by the Institute found that 42% of small firms close within two years.',
    'revenue grew 40% last year',
    'She said "we never expected it" at the conference.',
    'The team doubled in size.',
    'a claim that is simply not present anywhere in this document at all',
  ]
  const located = locateAll(doc, quotes.map(q => ({ quote: q })))
  let anchored = 0
  for (const { claim, span } of located) {
    if (!span) continue
    anchored++
    const covered = buildFoldedIndex(doc.slice(span.start, span.end)).folded.trim()
    const wanted = buildFoldedIndex(claim.quote).folded.trim()
    assert.ok(
      covered.includes(wanted) || wanted.includes(covered),
      `mis-anchored: quote ${JSON.stringify(claim.quote)} landed on ${JSON.stringify(doc.slice(span.start, span.end))}`
    )
  }
  assert.ok(anchored >= 4, `expected at least 4 of 5 to anchor, got ${anchored}`)
  assert.equal(located[4].span, undefined, 'the absent claim must not anchor')
})

test('spans never run backwards or outside the document', () => {
  const doc = normalizeDocument('Revenue grew 40%.\n\nProfit fell 12%.')
  for (const q of ['Revenue grew 40%.', 'Profit fell 12%.', 'nonsense']) {
    const hit = one(doc, q)
    if (!hit) continue
    assert.ok(hit.span.start >= 0, 'start must not be negative')
    assert.ok(hit.span.end <= doc.length, 'end must not exceed the document')
    assert.ok(hit.span.end > hit.span.start, 'end must be after start')
  }
})

test('a document of repeated identical sentences never mis-anchors', () => {
  // The adversarial case: everything looks the same, so order is the only
  // signal. Every anchored span must be distinct and in increasing order.
  const doc = 'The number is 42. '.repeat(6).trim()
  const located = locateAll(doc, Array.from({ length: 6 }, () => ({ quote: 'The number is 42.' })))
  const starts = located.filter(l => l.span).map(l => l.span!.start)
  assert.deepEqual([...starts].sort((a, b) => a - b), starts, 'spans must be in document order')
  assert.equal(new Set(starts).size, starts.length, 'two claims must never share a span')
})
