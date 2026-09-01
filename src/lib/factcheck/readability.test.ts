import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  classifySource, isPaywalledHost, looksGated, MIN_READABLE_CHARS, PAYWALLED_HOST_LIST,
} from './readability'

const real = 'Adoption rose to 34.2% in the second quarter. '.repeat(120)

test('a real article is readable', () => {
  assert.ok(real.length > MIN_READABLE_CHARS)
  assert.equal(classifySource('https://example.com/post', real), 'readable')
})

test('a masked page is paywalled however long it is', () => {
  // Statista renders a hidden figure as asterisks, so the page can be long and
  // still have had every number taken out of it. Length alone misses this, and
  // a partly readable page is worse than an unreadable one: the number is
  // sitting behind the mask while the judge reports it absent.
  const masked = real + ' Daily active users: *** million. Unlock this statistic.'
  assert.ok(looksGated(masked))
  assert.equal(classifySource('https://example.com/x', masked), 'paywalled')
})

test('a known paywalled host is refused before we reason about its text', () => {
  assert.ok(isPaywalledHost('https://www.statista.com/statistics/1/'))
  assert.ok(isPaywalledHost('https://ft.com/content/abc'))
  assert.ok(!isPaywalledHost('https://ahrefs.com/blog/seo-statistics/'))
  assert.equal(classifySource('https://www.statista.com/statistics/1/', real), 'paywalled')
})

test('the length floor catches the shells the old one missed', () => {
  // Measured: paywalled pages came back between 3,346 and 9,395 characters
  // while readable articles ran past 12,000. The old floor of 1,200 caught 2
  // of 11.
  assert.equal(classifySource('https://example.com/x', 'a'.repeat(900)), 'paywalled')
  assert.equal(classifySource('https://example.com/x', 'a'.repeat(2_500)), 'paywalled')
  assert.equal(MIN_READABLE_CHARS, 3_000)
})

test('a URL the provider could not get at all is dead, not paywalled', () => {
  assert.equal(classifySource('https://gone.example.com/x', null), 'dead')
})

test('every paywalled host entry is a bare registrable host', () => {
  for (const h of PAYWALLED_HOST_LIST) {
    assert.ok(!h.includes('://') && !h.startsWith('www.'), `${h} is malformed`)
    assert.ok(isPaywalledHost(`https://${h}/anything`), `${h} does not match itself`)
  }
})

test('refusing is biased toward refusing, on purpose', () => {
  // Wrong in one direction costs one citation of coverage. Wrong in the other
  // produces a false accusation about somebody's writing.
  assert.equal(classifySource('https://example.com/x', 'a'.repeat(MIN_READABLE_CHARS - 1)), 'paywalled')
  assert.equal(classifySource('https://example.com/x', 'a'.repeat(MIN_READABLE_CHARS + 1)), 'readable')
})
