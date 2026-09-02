import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  classifySource, isPaywalledHost, looksGated, stripEmphasis,
  MIN_READABLE_CHARS, PAYWALLED_HOST_LIST,
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

// ---------------------------------------------------------------------------
// The mask test versus markdown
//
// A bare /\*{3,}/ called 11 of 20 readable sources paywalled on one article,
// because markdown bold-italic is also three asterisks. These cases are the
// line between a hidden figure and ordinary formatting.
// ---------------------------------------------------------------------------

test('markdown bold-italic is not a paywall', () => {
  // The exact text that caused it, from firstpagesage.com.
  const page = '| ***What changed this year*: *Over the past year, CTRs have shifted.* |'
  assert.equal(looksGated(page), false)
})

test('a horizontal rule is not a paywall', () => {
  assert.equal(looksGated('One paragraph.\n\n***\n\nAnother paragraph.'), false)
  assert.equal(looksGated('One paragraph.\n\n* * *\n\nAnother paragraph.'), false)
})

test('bold, italic and bold-italic all survive', () => {
  assert.equal(looksGated('**bold** and *italic* and ***both***'), false)
  assert.equal(looksGated('Growth was ***42%*** last year.'), false)
})

test('a masked figure is still a paywall', () => {
  // Statista's shape: the run replaces the number, so it has no partner.
  assert.equal(looksGated('Share of respondents: *** percent'), true)
  assert.equal(looksGated('| Revenue | *** | *** |'), true)
  assert.equal(looksGated('Total: $***,***'), true)
})

test('an unbalanced run in otherwise bold text is still a paywall', () => {
  assert.equal(looksGated('**Revenue** grew to *** in 2024.'), true)
})

test('the prose gates are read on the original, not the stripped text', () => {
  // Stripping emphasis must never eat the words a gate is made of.
  assert.equal(looksGated('**Subscribe to read** the rest.'), true)
  assert.equal(looksGated('*Sign in to view* this chart.'), true)
})

test('stripEmphasis leaves the words alone', () => {
  assert.equal(stripEmphasis('**bold** and *italic*'), 'bold and italic')
  assert.equal(stripEmphasis('no markup here'), 'no markup here')
})
