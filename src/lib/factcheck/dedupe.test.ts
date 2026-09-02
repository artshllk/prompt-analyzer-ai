import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dedupeClaims, normaliseFigure, normaliseSource, type Dedupable } from './dedupe'

const AHREFS = 'https://ahrefs.com/blog/search-traffic-study/'

function c(over: Partial<Dedupable> & { claimText: string }): Dedupable {
  return {
    quote: over.claimText,
    sourceForm: 'linked',
    sourceUrl: AHREFS,
    ...over,
  }
}

// ---------------------------------------------------------------------------
// The real pairs from the Ahrefs article
// ---------------------------------------------------------------------------

test('the two real duplicate pairs collapse', () => {
  const claims = [
    c({ claimText: '96.55% of all pages get zero search traffic from Google', figure: '96.55%' }),
    c({ claimText: '96.55% of all pages get zero organic search traffic from Google', figure: '96.55%' }),
    c({
      claimText: '87% of marketers surveyed use AI to create or help create content (769 of 879)',
      figure: '87%',
      sourceUrl: 'https://ahrefs.com/blog/marketers-using-ai-publish-more-content/',
    }),
    c({
      claimText: '87% of marketers use AI to help create content',
      figure: '87%',
      sourceUrl: 'https://ahrefs.com/blog/marketers-using-ai-publish-more-content/',
    }),
  ]
  const r = dedupeClaims(claims)
  assert.equal(r.removed, 2)
  assert.equal(r.kept.length, 2)
  // The fuller wording survives, whichever position it was in.
  assert.match(r.kept[0].claimText, /organic search traffic/)
  assert.match(r.kept[1].claimText, /769 of 879/)
})

test('document order survives, even when the later one wins', () => {
  const r = dedupeClaims([
    c({ claimText: 'short', figure: '10%' }),
    c({ claimText: 'a different claim entirely', figure: '55%' }),
    c({ claimText: 'the much longer version of the first', figure: '10%' }),
  ])
  assert.equal(r.kept.length, 2)
  assert.equal(r.kept[0].claimText, 'the much longer version of the first')
  assert.equal(r.kept[1].claimText, 'a different claim entirely')
})

// ---------------------------------------------------------------------------
// What must NEVER collapse
// ---------------------------------------------------------------------------

test('the same figure from different sources stays two claims', () => {
  const r = dedupeClaims([
    c({ claimText: 'Gartner says 50%', figure: '50%', sourceUrl: 'https://gartner.com/a' }),
    c({ claimText: 'Forrester says 50%', figure: '50%', sourceUrl: 'https://forrester.com/b' }),
  ])
  assert.equal(r.removed, 0, 'merging these would hide a disagreement between sources')
})

test('different figures from the same source stay two claims', () => {
  const r = dedupeClaims([
    c({ claimText: 'a', figure: '96.55%' }),
    c({ claimText: 'b', figure: '68.7%' }),
  ])
  assert.equal(r.removed, 0)
})

test('a near-miss is not a duplicate', () => {
  // The one merge this product must never make.
  const r = dedupeClaims([
    c({ claimText: 'a', figure: '96.5%' }),
    c({ claimText: 'b', figure: '96.55%' }),
  ])
  assert.equal(r.removed, 0, '96.5 and 96.55 are different numbers')
})

test('claims with no figure never collapse', () => {
  const r = dedupeClaims([
    c({ claimText: 'Adoption is rising' }),
    c({ claimText: 'Adoption has stalled' }),
  ])
  assert.equal(r.removed, 0, 'same page, opposite claims, no key that tells them apart')
})

test('unsourced claims never collapse', () => {
  const r = dedupeClaims([
    c({ claimText: 'half of marketers do X', figure: '50%', sourceForm: 'none', sourceUrl: undefined }),
    c({ claimText: 'half of shoppers do Y', figure: '50%', sourceForm: 'none', sourceUrl: undefined }),
  ])
  assert.equal(r.removed, 0, 'a round number collides by chance and "no source" is not a match')
})

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

test('a figure loses its noise and keeps its value', () => {
  assert.equal(normaliseFigure('96.55%'), normaliseFigure('96.55 %'))
  assert.equal(normaliseFigure('1,200'), normaliseFigure('1200'))
  assert.equal(normaliseFigure('50 percent'), normaliseFigure('50%'))
  assert.equal(normaliseFigure('about 40%'), normaliseFigure('40%'))
  assert.notEqual(normaliseFigure('96.5%'), normaliseFigure('96.55%'))
  assert.equal(normaliseFigure('a majority'), null)
  assert.equal(normaliseFigure(undefined), null)
})

test('a URL loses its noise and keeps its page', () => {
  const same = [
    'https://ahrefs.com/blog/x/',
    'https://www.ahrefs.com/blog/x',
    'https://ahrefs.com/blog/x#close',
    'https://ahrefs.com/blog/x?utm_source=twitter',
  ].map(u => normaliseSource(c({ claimText: 'q', sourceUrl: u })))
  assert.equal(new Set(same).size, 1, same.join(' | '))
  // A real query parameter is part of the page.
  assert.notEqual(
    normaliseSource(c({ claimText: 'q', sourceUrl: 'https://ahrefs.com/blog/x?page=2' })),
    same[0]
  )
})

test('a named publisher keys, an absent source does not', () => {
  assert.equal(
    normaliseSource(c({ claimText: 'q', sourceForm: 'named', sourceName: 'Pew Research', sourceUrl: undefined })),
    normaliseSource(c({ claimText: 'q', sourceForm: 'named', sourceName: '  pew   research ', sourceUrl: undefined }))
  )
  assert.equal(normaliseSource(c({ claimText: 'q', sourceForm: 'none', sourceUrl: undefined })), null)
})
