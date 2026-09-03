import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * The bug this exists for: a real 43-claim article failed and every reader saw
 * "That did not work. Nothing was checked." The cause was nameable - the model
 * had run out of room - but the name never reached the surface, so the one
 * thing the reader could have done about it went unsaid.
 *
 * Reading the source is the point. These two files sit on opposite sides of an
 * HTTP boundary, so nothing else makes them agree.
 */
const extract = readFileSync('src/lib/factcheck/extract.ts', 'utf8')
const client = readFileSync('src/components/factcheck/useCheckStream.ts', 'utf8')

function extractErrors(): string[] {
  const line = extract.match(/export type ExtractError =([^\n]+)/)
  assert.ok(line, 'ExtractError is no longer a single-line union; update this test')
  return [...line[1].matchAll(/'([a-z_]+)'/g)].map(m => m[1])
}

test('every extraction failure has its own message', () => {
  const errors = extractErrors()
  assert.ok(errors.length >= 4, `expected the full union, saw ${errors.join(', ')}`)
  for (const e of errors) {
    assert.match(
      client,
      new RegExp(`^\\s*${e}:`, 'm'),
      `'${e}' has no line in MESSAGES, so it would fall through to the generic one`
    )
  }
})

test('no failure message blames the reader for our outage', () => {
  const generic = client.match(/^\s*unavailable:\s*\n?\s*'([^']+)'/m)
  assert.ok(generic, 'unavailable message not found')
  assert.match(
    generic[1],
    /nothing was charged/i,
    'a failed run must say the reader was not charged for it'
  )
})

// ---------------------------------------------------------------------------
// The claim-count sentence
//
// It printed the model's own count, which came back 91 on one run of a
// document and 24 on the next. This asserts the source of the number, because
// that is the property that broke, and no unit test of the component would
// have caught it.
// ---------------------------------------------------------------------------

const checkClient = readFileSync('src/components/factcheck/CheckClient.tsx', 'utf8')

test('the truncation sentence never prints the model\'s claim count', () => {
  const block = checkClient.slice(
    checkClient.indexOf('state.truncated'),
    checkClient.indexOf('state.truncated') + 1400
  )
  assert.ok(block.length > 100, 'could not find the truncation block')
  assert.match(block, /state\.linkCount/, 'the number shown must be the link count')
  assert.doesNotMatch(
    block.replace(/\{\/\*[\s\S]*?\*\/\}/g, ''),
    /\{state\.foundCount\}/,
    'foundCount is the model\'s own guess and swings 3.8x on identical input'
  )
})

test('a document with no links gets no number', () => {
  // The fallback branch must not interpolate linkCount, because zero links is
  // not a number worth printing and "0 links" reads as a failure.
  const idx = checkClient.indexOf('There were more')
  assert.ok(idx > 0, 'no-links fallback sentence not found')
  const sentence = checkClient.slice(idx - 200, idx + 40)
  assert.doesNotMatch(sentence, /linkCount/)
})

// ---------------------------------------------------------------------------
// The waiting experience
//
// Source tests, because the rules here are about what must NOT be on screen
// and no rendering test asserts an absence well.
// ---------------------------------------------------------------------------

const globalsCss = readFileSync('src/app/globals.css', 'utf8')
const markedDoc = readFileSync('src/components/factcheck/MarkedDocument.tsx', 'utf8')

/** Comments explain why we do NOT do a thing, so they cannot be evidence we do. */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

test('nothing spins, shimmers or pulses', () => {
  const ui = code(checkClient) + code(markedDoc) + code(globalsCss)
  for (const banned of ['animate-spin', 'shimmer', 'animate-pulse', 'skeleton']) {
    assert.doesNotMatch(ui, new RegExp(banned, 'i'), `${banned} is not honest waiting`)
  }
})

test('the only number on screen while waiting is one we counted', () => {
  const block = checkClient.slice(checkClient.indexOf("state.checkable === 0"), checkClient.indexOf("state.checkable === 0") + 240)
  assert.match(block, /Checked \$\{state\.checked\} of \$\{state\.checkable\}/)
  // `checked` counts resolved events and `checkable` counts opened ones. A
  // percentage would be neither.
  assert.doesNotMatch(checkClient, /%`|percent/i)
})

test('the document is on screen during extraction', () => {
  const phase1 = checkClient.slice(
    checkClient.indexOf("state.kind === 'extracting'"),
    checkClient.indexOf("state.kind === 'checking'")
  )
  assert.match(phase1, /\{text\}/, 'their own text, immediately, not a placeholder')
  assert.match(phase1, /<ReadingLabel \/>/)
})

test('the label changes once, and only once', () => {
  assert.match(checkClient, /Reading your document/)
  assert.match(checkClient, /Finding statements to check/)
  assert.match(checkClient, /SECOND_LABEL_AT = 8_000/)
})

test('reduced motion stops the sweep dead rather than slowing it', () => {
  const reduced = globalsCss.slice(globalsCss.indexOf('@media (prefers-reduced-motion: reduce)'))
  assert.match(reduced, /\.reading-line::after\s*\{[^}]*animation:\s*none/)
  assert.match(reduced, /transition-duration:\s*0ms/)
})

test('a source is called slow only after six seconds', () => {
  const citation = readFileSync('src/lib/factcheck/citation.ts', 'utf8')
  assert.match(citation, /SLOW_AFTER_MS = 6_000/)
  assert.match(markedDoc, /is slow to respond/)
})

test('the host is named when it is opened and when it is slow, not in between', () => {
  assert.match(markedDoc, /`Opening \$\{host\}`/)
  assert.match(markedDoc, /'Reading the page'/)
  assert.match(markedDoc, /`\$\{host\} is slow to respond`/)
})
