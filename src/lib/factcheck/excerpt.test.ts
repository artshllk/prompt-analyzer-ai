import { test } from 'node:test'
import assert from 'node:assert/strict'
import { excerptAround, findFigureAt, figureForms, isDerivedFrom, tidyExcerpt } from './excerpt'

// ---------------------------------------------------------------------------
// The three real findings. These are the pages, as retrieved.
// ---------------------------------------------------------------------------

const BRIGHTEDGE =
  '3 brightedge.com BrightEdge | 989 E. Hillsdale Blvd, Suite 300, Foster City, CA 94404 ' +
  '| tel: 800.578.8023 | info@brightedge.com BrightEdge Research found that Organic and Paid ' +
  'Search dominate websites’ traffic in 2019 - 68% of all trackable website traffic is ' +
  'sourced from Organic and Paid Search, vastly exceeding all other channels, including ' +
  'Display and Social Media. The Organic Search figure at 53% is up from the 51% found in 2014.'

const SPARKTORO_REFERRALS =
  'And the results are surprising indeed.\n\n## The Largest Traffic Referrers on the Web\n\n' +
  'It’s Google, and by a mile. **Close to 2/3rds (63.41%) of all US web traffic referrals ' +
  'from the top 170 sites initiated on Google.com**. The second-largest individual, ' +
  'traffic-referring domain is technically YouTube.com.'

const SPARKTORO_CTR =
  'the effect on organic CTR is light compared to the no-click searches phenomenon.\n\n' +
  'For every 100 searches on Google mobile in September, 2018, there were:\n\n' +
  '* 38.5 clicks on an organic result\n* 3.4 clicks on a paid result\n* 61.5 no-click searches\n\n' +
  'For every 100 searches on Google desktop in September, 2018, there were:\n\n' +
  '* 65.6 clicks on an organic result\n* 3.7 clicks on a paid result\n* 34.3 no-click searches'

test('a PDF footer is not the start of the sentence', () => {
  const e = excerptAround(BRIGHTEDGE, ['68%'])
  assert.ok(e)
  assert.ok(e.startsWith('BrightEdge Research found that'), e)
  assert.doesNotMatch(e, /info@|800\.578|94404/, 'contact details are not evidence')
  assert.match(e, /68% of all trackable website traffic/)
})

test('a domain is not a full stop', () => {
  // This shipped once as "...initiated on Google." The domain WAS the evidence.
  const e = excerptAround(SPARKTORO_REFERRALS, ['63.41%'])
  assert.ok(e)
  assert.match(e, /initiated on Google\.com/, e)
  assert.match(e, /from the top 170 sites/, 'the qualifier is the whole finding')
  assert.ok(e.startsWith('Close to 2/3rds'), e)
})

test('a list is never split from the line that introduces it', () => {
  // The old quote was the header alone, with none of the numbers under it.
  const e = excerptAround(SPARKTORO_CTR, [undefined, '61.5%'])
  assert.ok(e)
  assert.match(e, /Google mobile/, 'which device is the entire point')
  assert.match(e, /61\.5 no-click searches/)
  assert.doesNotMatch(e, /phenomenon/, 'no half sentence on the front')
  assert.doesNotMatch(e, /Google desktop/, 'the next list is not this list')
})

// ---------------------------------------------------------------------------
// Locating the figure
// ---------------------------------------------------------------------------

test('a figure is not found inside a longer number', () => {
  assert.equal(findFigureAt('the value 161.55 appears', '61.5'), -1)
  assert.equal(findFigureAt('the value 61.55 appears', '61.5'), -1)
  assert.equal(findFigureAt('the value 61.5 appears', '61.5'), 10)
})

test('a percentage in the document is found without its sign in the source', () => {
  assert.deepEqual(figureForms('61.5%'), ['61.5%', '61.5'])
  assert.deepEqual(figureForms('1,200'), ['1,200', '1200'])
  assert.ok(excerptAround('and 61.5 no-click searches were counted here today', ['61.5%']))
})

test('no figure and no match both mean no excerpt', () => {
  assert.equal(excerptAround(BRIGHTEDGE, [undefined, undefined]), null)
  assert.equal(excerptAround(BRIGHTEDGE, ['99.9%']), null, 'never invent a window')
})

// ---------------------------------------------------------------------------
// The invariant that makes this safe to construct
// ---------------------------------------------------------------------------

test('every excerpt is made only of the page', () => {
  for (const [page, figure] of [
    [BRIGHTEDGE, '68%'],
    [SPARKTORO_REFERRALS, '63.41%'],
    [SPARKTORO_CTR, '61.5%'],
  ] as const) {
    const e = excerptAround(page, [figure])
    assert.ok(e)
    assert.ok(isDerivedFrom(e, page), e)
  }
})

test('tidying removes layout and adds nothing', () => {
  assert.equal(tidyExcerpt('* one\n* two\n'), 'one two')
  assert.equal(tidyExcerpt('**bold**  spaced'), 'bold spaced')
  assert.equal(tidyExcerpt('plain text'), 'plain text')
})

test('an excerpt always contains the number the finding is about', () => {
  for (const [page, figure] of [
    [BRIGHTEDGE, '68%'],
    [SPARKTORO_REFERRALS, '63.41%'],
    [SPARKTORO_CTR, '61.5%'],
  ] as const) {
    const e = excerptAround(page, [figure])!
    const bare = figure.replace('%', '')
    assert.ok(e.includes(bare), `${figure} missing from: ${e}`)
  }
})
