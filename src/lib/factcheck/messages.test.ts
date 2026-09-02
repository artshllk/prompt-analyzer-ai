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
