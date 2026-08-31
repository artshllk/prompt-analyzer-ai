/**
 * Unit tests for the provenance parser.
 *
 *   npx tsx --test src/lib/engine/segments.test.ts
 *
 * No network, no keys, no cost - unlike eval.ts these run on every change.
 *
 * The load-bearing test is not "does it parse a well-formed rewrite". It is
 * "what happens when the model gets it wrong". A marker character reaching a
 * user is a worse failure than no labelling at all, so every malformed shape
 * gets a case: unclosed, stray close, nested, truncated mid-marker, and a
 * lone sentinel sitting in the prose.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseSegments,
  stripMarkers,
  countAdditions,
  renderPrompt,
  tidy,
  hasMarkers,
  createMarkerStripper,
  type Segment,
} from './segments'

const A = (s: string) => `⟦a⟧${s}⟦/a⟧`
const G = (s: string) => `⟦g⟧${s}⟦/g⟧`

/** The invariant that matters most: no marker character ever survives. */
function assertClean(text: string, label: string) {
  assert.ok(!text.includes('⟦'), `${label}: leaked an open bracket -> ${JSON.stringify(text)}`)
  assert.ok(!text.includes('⟧'), `${label}: leaked a close bracket -> ${JSON.stringify(text)}`)
}

const sources = (segs: Segment[]) => segs.map(s => s.source)
const texts = (segs: Segment[]) => segs.map(s => s.text)

/* ---------------------------------------------------------------- parsing */

test('unmarked text is entirely the user own words', () => {
  const segs = parseSegments('Write a launch email.')
  assert.deepEqual(segs, [{ text: 'Write a launch email.', source: 'yours' }])
})

test('splits yours / answered / guessed in order', () => {
  const input = `Write a launch email for ${A('B2B founders')} in ${G('under 150 words')}.`
  const segs = parseSegments(input)
  assert.deepEqual(sources(segs), ['yours', 'answered', 'yours', 'guessed', 'yours'])
  assert.deepEqual(texts(segs), [
    'Write a launch email for ',
    'B2B founders',
    ' in ',
    'under 150 words',
    '.',
  ])
})

test('segments rejoin to exactly the stripped text', () => {
  const input = `A ${G('warm')} note for ${A('designers')}, ${G('300 words')}.`
  assert.equal(texts(parseSegments(input)).join(''), stripMarkers(input))
  assertClean(stripMarkers(input), 'rejoin')
})

test('a marker touching the very start and end still parses', () => {
  const segs = parseSegments(`${G('Act as an editor.')}`)
  assert.deepEqual(segs, [{ text: 'Act as an editor.', source: 'guessed' }])
})

test('empty input yields no segments', () => {
  assert.deepEqual(parseSegments(''), [])
  assert.equal(stripMarkers(''), '')
})

/* ------------------------------------------------------------ malformed */

test('unclosed marker runs to the end and leaks nothing', () => {
  const input = 'Write a post ⟦g⟧in a warm tone for beginners'
  const segs = parseSegments(input)
  assert.deepEqual(sources(segs), ['yours', 'guessed'])
  assert.equal(segs[1].text, 'in a warm tone for beginners')
  assertClean(stripMarkers(input), 'unclosed')
})

test('stray close with nothing open is dropped', () => {
  const input = 'Write a post⟦/g⟧ about coffee.'
  assert.equal(stripMarkers(input), 'Write a post about coffee.')
  assert.deepEqual(sources(parseSegments(input)), ['yours'])
})

test('nested markers flatten instead of nesting', () => {
  const input = `Write ${'⟦g⟧'}a ${'⟦a⟧'}short${'⟦/a⟧'} post${'⟦/g⟧'} now.`
  const segs = parseSegments(input)
  assert.ok(segs.every(s => s.source === 'yours' || s.source === 'guessed'))
  assertClean(stripMarkers(input), 'nested')
  assert.equal(stripMarkers(input), 'Write a short post now.')
})

test('a lone CLOSE bracket is dropped, not shown', () => {
  // Regression: the scanner only looked for the opening bracket, so a stray
  // closing one fell through to "not a sentinel, emit as text" and reached a
  // user. Caught by a real model response, not by a hand-written case.
  const input = 'Write release notes⟧ for version 2.1.'
  assertClean(stripMarkers(input), 'lone close')
  assert.equal(stripMarkers(input), 'Write release notes for version 2.1.')
  assert.deepEqual(sources(parseSegments(input)), ['yours'])
})

test('an open marker closed with a bare bracket still leaks nothing', () => {
  const input = 'Write a post ⟦g⟧for beginners⟧ today.'
  assertClean(stripMarkers(input), 'bare close')
  assert.equal(stripMarkers(input), 'Write a post for beginners today.')
})

test('hasMarkers sees a stray close too', () => {
  assert.equal(hasMarkers('notes⟧ here'), true)
})

test('a lone sentinel in the prose is dropped, not shown', () => {
  const input = 'Match the ⟦ bracket style.'
  assertClean(stripMarkers(input), 'lone sentinel')
  assert.equal(stripMarkers(input), 'Match the  bracket style.')
})

test('truncated mid-marker leaks nothing, at every cut point', () => {
  const full = `Write a post ${G('for beginners')} today.`
  for (let cut = 0; cut <= full.length; cut++) {
    const partial = full.slice(0, cut)
    const stripped = stripMarkers(partial)
    assertClean(stripped, `cut at ${cut}`)
    assertClean(texts(parseSegments(partial)).join(''), `cut at ${cut} (segments)`)
  }
})

test('every truncation of every marker shape stays clean', () => {
  const shapes = [
    `a ${A('b')} c`,
    `a ${G('b')} c`,
    `${G('a')}${A('b')}`,
    'unclosed ⟦g⟧tail',
    'stray ⟦/a⟧ close',
    'lone close⟧ here',
    'bare ⟦g⟧close⟧ here',
    'both ⟦ and ⟧ loose',
  ]
  for (const shape of shapes) {
    for (let cut = 0; cut <= shape.length; cut++) {
      assertClean(stripMarkers(shape.slice(0, cut)), `${shape} @ ${cut}`)
    }
  }
})

test('hasMarkers detects a marker and a bare sentinel', () => {
  assert.equal(hasMarkers(`x ${G('y')}`), true)
  assert.equal(hasMarkers('x ⟦g'), true)
  assert.equal(hasMarkers('plain text'), false)
})

/* ------------------------------------------------------------- counting */

test('counts constraints, not spans', () => {
  // Two guessed spans separated only by a comma are one decision.
  const input = `Write ${G('300 words')}, ${G('warmly')} for founders.`
  const { added, guessed } = countAdditions(parseSegments(input))
  assert.equal(added, 1)
  assert.equal(guessed, 1)
})

test('real words between two spans make them two constraints', () => {
  const input = `Write ${G('300 words')} about coffee for ${G('beginners')}.`
  const { added, guessed } = countAdditions(parseSegments(input))
  assert.equal(added, 2)
  assert.equal(guessed, 2)
})

test('answered and guessed are counted apart', () => {
  const input = `A ${A('cold email')} of ${G('120 words')} for founders.`
  const { added, guessed } = countAdditions(parseSegments(input))
  assert.equal(added, 2)
  assert.equal(guessed, 1)
})

test('nothing added counts zero', () => {
  assert.deepEqual(countAdditions(parseSegments('Write a post.')), { added: 0, guessed: 0 })
})

/* -------------------------------------------------------------- removal */

test('removing a segment splices it out and repairs the punctuation', () => {
  const input = `Write a launch email, ${G('in under 150 words')}, for founders.`
  const segs = parseSegments(input)
  const guessAt = segs.findIndex(s => s.source === 'guessed')
  const out = renderPrompt(segs, new Set([guessAt]))
  assert.equal(out, 'Write a launch email, for founders.')
  assertClean(out, 'removal')
})

test('removing nothing returns the tidied full prompt', () => {
  const input = `Write ${G('300 words')} for founders.`
  const segs = parseSegments(input)
  assert.equal(renderPrompt(segs, new Set()), 'Write 300 words for founders.')
})

test('removing every guess still leaves usable prose', () => {
  const input = `Write a post ${G('of 300 words')} about coffee ${G('for beginners')}.`
  const segs = parseSegments(input)
  const removed = new Set(segs.flatMap((s, i) => (s.source === 'guessed' ? [i] : [])))
  const out = renderPrompt(segs, removed)
  assert.equal(out, 'Write a post about coffee.')
})

test('tidy repairs stranded and doubled separators', () => {
  assert.equal(tidy('Write a post, , for founders.'), 'Write a post, for founders.')
  assert.equal(tidy('Write a post  with   gaps.'), 'Write a post with gaps.')
  assert.equal(tidy('Tone: warm,\nLength: short'), 'Tone: warm\nLength: short')
  assert.equal(tidy('Write a post ,'), 'Write a post')
  assert.equal(tidy('a\n\n\n\nb'), 'a\n\nb')
})

/* ------------------------------------------------------ stream stripping */

test('stream stripper never emits a marker, at any chunk boundary', () => {
  const full = `Write a post ${G('for beginners')} in ${A('under 150 words')}.`
  const expected = stripMarkers(full)

  for (const size of [1, 2, 3, 5, 7, 13, 64]) {
    const strip = createMarkerStripper()
    let out = ''
    for (let i = 0; i < full.length; i += size) {
      const emitted = strip.push(full.slice(i, i + size))
      assertClean(emitted, `chunk size ${size}`)
      out += emitted
    }
    out += strip.end()
    assertClean(out, `chunk size ${size} final`)
    assert.equal(out, expected, `chunk size ${size} lost or gained text`)
  }
})

test('stream stripper drops a marker cut off by the end of the stream', () => {
  const strip = createMarkerStripper()
  let out = strip.push('Write a post ⟦g')
  out += strip.end()
  assertClean(out, 'cut stream')
  assert.equal(out, 'Write a post ')
})

test('stream stripper handles a sentinel split across two deltas', () => {
  const strip = createMarkerStripper()
  let out = strip.push('Write ⟦')
  out += strip.push('g⟧300 words⟦/g⟧ now.')
  out += strip.end()
  assertClean(out, 'split sentinel')
  assert.equal(out, 'Write 300 words now.')
})

/* ------------------------------------------------------------------ fuzz */

test('no random arrangement of marker debris can leak a bracket', () => {
  // The stray-close bug was found by a live model, not by the cases above,
  // which is the argument for not relying on cases above. This throws the
  // pieces together at random and only checks the one thing that must always
  // hold: nothing a user sees contains a bracket.
  const pieces = [
    '⟦', '⟧', '⟦a⟧', '⟦g⟧', '⟦/a⟧', '⟦/g⟧', '⟦/', '⟦a', '⟧⟧', '⟦⟦',
    'write', ' a post ', 'for beginners', ',', '. ', '\n', '{var}', '',
  ]

  // Deterministic pseudo-random so a failure is reproducible.
  let seed = 20260831
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648)

  for (let iter = 0; iter < 3000; iter++) {
    const len = 1 + (next() % 12)
    let input = ''
    for (let i = 0; i < len; i++) input += pieces[next() % pieces.length]

    assertClean(stripMarkers(input), `fuzz ${iter}: ${JSON.stringify(input)}`)

    const segs = parseSegments(input)
    for (const seg of segs) {
      assertClean(seg.text, `fuzz ${iter} segment: ${JSON.stringify(input)}`)
    }
    // The invariant every consumer relies on.
    assert.equal(
      texts(segs).join(''),
      stripMarkers(input),
      `fuzz ${iter}: segments and strip disagree on ${JSON.stringify(input)}`
    )
    assertClean(renderPrompt(segs, new Set([0])), `fuzz ${iter} after removal`)

    // Truncating anywhere must also stay clean.
    const cut = next() % (input.length + 1)
    assertClean(stripMarkers(input.slice(0, cut)), `fuzz ${iter} truncated at ${cut}`)
  }
})

/* ------------------------------------------------- non-string input */

test('a non-string field never throws and never leaks', () => {
  // Structured Outputs with strict:false can return an array or an object
  // where the schema said string. This threw inside the engine and cost the
  // user their entire result. Found by a live run, not by a case.
  const junk: unknown[] = [null, undefined, 42, {}, [], { restructured: 'x' }, true, NaN]
  for (const v of junk) {
    assert.deepEqual(parseSegments(v), [], `parseSegments(${String(v)})`)
    assert.equal(stripMarkers(v), '', `stripMarkers(${String(v)})`)
    assert.equal(hasMarkers(v), false, `hasMarkers(${String(v)})`)
  }
})

test('two marked sentences separated by a space are two constraints', () => {
  // Found by writing the homepage's static example. The merge rule only
  // looked at the text BETWEEN two spans, and the full stop was inside the
  // first span rather than between them, so two complete instructions the
  // user can remove separately were counted as one.
  const input = `${G('Keep it under 150 words.')} ${G('Open with the single change that affects them.')}`
  const { added, guessed } = countAdditions(parseSegments(input))
  assert.equal(added, 2)
  assert.equal(guessed, 2)
})

test('a comma between two marked spans still merges them', () => {
  // The original rule still holds: one decision the model happened to
  // punctuate in the middle is one constraint.
  const input = `Write ${G('300 words')}, ${G('warmly')} for founders.`
  assert.equal(countAdditions(parseSegments(input)).added, 1)
})

test('a question mark or exclamation also ends a constraint', () => {
  for (const punct of ['.', '?', '!']) {
    const input = `${G('Ask one question' + punct)} ${G('Then stop' + punct)}`
    assert.equal(countAdditions(parseSegments(input)).added, 2, `punct ${punct}`)
  }
})
