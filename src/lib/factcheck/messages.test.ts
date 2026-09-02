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
