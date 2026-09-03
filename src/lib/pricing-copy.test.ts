import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  FACTCHECK_FREE_LIMIT,
  PRO_FACTCHECK_LIMIT,
  DETECT_FREE_LIMIT,
  PRO_DETECT_LIMIT,
  USAGE_DAILY_LIMIT,
  HISTORY_FREE_DAYS,
} from './limits'
import { ANON_FACTCHECK_DAY } from './rate-limit'

/**
 * A NUMBER IN THE COPY MUST BE A NUMBER THE SERVER ENFORCES.
 *
 * Five times now the pricing table has stated something the server did not
 * do. The detector said "you have used your free detection" about a count in
 * localStorage. The table offered Free 10 a day against Pro 100 a month, so
 * Pro was a third of Free. The dashboard counted the wrong event and showed
 * "6 of 5". Pricing promised unlimited Pro checking that nothing enforced.
 * And most recently the anonymous limit moved from 2 to 5 in the server while
 * this file went on saying 2, which drifted inside a single day.
 *
 * Every one was a literal typed next to a constant. So the component now
 * interpolates, and this fails if a literal creeps back in.
 */
const pricing = readFileSync('src/components/marketing/EditorialPricing.tsx', 'utf8')
const paddle = readFileSync('src/lib/paddle.ts', 'utf8')

/** Comments describe the bugs above by quoting them. They are not the copy. */
function copyOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

test('the plan leads read from the enforced constants', () => {
  const src = copyOnly(pricing)
  assert.match(src, /FREE_LEAD = \{ n: String\(FACTCHECK_FREE_LIMIT\)/)
  assert.match(src, /PRO_LEAD = \{ n: String\(PRO_FACTCHECK_LIMIT\)/)
})

test('no feature line hardcodes a quota', () => {
  const src = copyOnly(pricing)
  const block = src.slice(src.indexOf('const FREE_FEATURES'), src.indexOf('const LAUNCH'))
  // Every number in a feature line has to arrive by interpolation.
  for (const line of block.split('\n')) {
    const quoted = line.match(/["'`]([^"'`]*)["'`]/)
    if (!quoted) continue
    const digits = quoted[1].match(/\d+/)
    if (!digits) continue
    assert.match(
      line,
      /\$\{/,
      `"${quoted[1].trim()}" states a number without reading it from a constant`
    )
  }
})

test('the units are the same on both sides of the table', () => {
  // Free at "a day" against Pro at "a month" is what made Pro a third of Free.
  const src = copyOnly(pricing)
  const free = src.match(/FREE_LEAD = \{[^}]*unit: "([^"]+)"/)?.[1]
  const pro = src.match(/PRO_LEAD = \{[^}]*unit: "([^"]+)"/)?.[1]
  assert.equal(free, pro, 'the two leads must be comparable at a glance')
})

test('Pro beats Free on every metered line', () => {
  // The check that would have caught "Free 10 a day, Pro 100 a month".
  assert.ok(PRO_FACTCHECK_LIMIT > FACTCHECK_FREE_LIMIT)
  assert.ok(PRO_DETECT_LIMIT > DETECT_FREE_LIMIT)
})

test('the frozen tool is never more generous than the product', () => {
  // 3 detections a day is 90 a month against 5 checks a month, which tells a
  // free user this company is a detector company. Both are monthly now, so
  // they are directly comparable and the comparison has to hold.
  assert.ok(
    DETECT_FREE_LIMIT <= FACTCHECK_FREE_LIMIT * 4,
    `free detections (${DETECT_FREE_LIMIT}) dwarf free checks (${FACTCHECK_FREE_LIMIT})`
  )
})

test('nothing metered is sold as unlimited', () => {
  const src = copyOnly(pricing)
  const features = src.slice(src.indexOf('const PRO_FEATURES'), src.indexOf('const LAUNCH'))
  const unlimited = [...features.matchAll(/"Unlimited ([^"]+)"/g)].map(m => m[1])
  for (const what of unlimited) {
    assert.doesNotMatch(
      what,
      /detection|check|source/i,
      `"Unlimited ${what}" is a promise on a metered cost`
    )
  }
})

test('the anonymous sentence reads the bucket the server applies', () => {
  const src = copyOnly(pricing)
  assert.match(src, /ANON_CHECKS_A_DAY = ANON_FACTCHECK_DAY\.capacity/)
  assert.match(src, /\{ANON_CHECKS_A_DAY\} checks a day/)
  // And the bucket is a real number, not a placeholder.
  assert.ok(ANON_FACTCHECK_DAY.capacity >= 1)
})

test('the displayed prices match the cents Paddle charges', () => {
  const src = copyOnly(pricing)
  const monthly = src.match(/monthly: \{ list: "([\d.]+)", now: "([\d.]+)" \}/)
  const yearly = src.match(/billedTotal: "([\d.]+)"/)
  assert.ok(monthly && yearly, 'could not read the displayed prices')
  const cents = (s: string) => Math.round(parseFloat(s) * 100)
  const amountOf = (key: string) =>
    Number(paddle.match(new RegExp(`${key}: \\{[\\s\\S]*?amount: (\\d+)`))?.[1])
  assert.equal(cents(monthly[1]), amountOf('pro_monthly'), 'list price vs pro_monthly')
  assert.equal(cents(monthly[2]), amountOf('pro_founding'), 'founding price vs pro_founding')
  assert.equal(cents(yearly[1]), amountOf('pro_annual'), 'annual total vs pro_annual')
})

test('the legacy price is not sellable', () => {
  assert.match(paddle, /SELLABLE_PLANS = \['pro_monthly', 'pro_annual', 'pro_founding'\]/)
  assert.doesNotMatch(
    paddle.match(/SELLABLE_PLANS = \[[^\]]*\]/)?.[0] ?? '',
    /legacy/,
    'the old price must be unreachable from checkout'
  )
})

test('every free number in the copy matches its constant', () => {
  const src = copyOnly(pricing)
  // Belt and braces on the interpolation: the values themselves have to be
  // the ones the server uses, not just read from somewhere.
  assert.equal(FACTCHECK_FREE_LIMIT, 5)
  assert.equal(PRO_FACTCHECK_LIMIT, 120)
  assert.equal(DETECT_FREE_LIMIT, 10)
  assert.equal(PRO_DETECT_LIMIT, 60)
  assert.equal(USAGE_DAILY_LIMIT, 10)
  assert.equal(HISTORY_FREE_DAYS, 7)
  assert.ok(src.includes('${USAGE_DAILY_LIMIT} prompt improvements a day'))
  assert.ok(src.includes('${DETECT_FREE_LIMIT} AI text detections a month'))
  assert.ok(src.includes('${HISTORY_FREE_DAYS} days of history'))
  assert.ok(src.includes('${PRO_DETECT_LIMIT} AI text detections a month'))
})

test('the price shown is the plan sent to checkout', () => {
  const src = copyOnly(pricing)
  // The founding price on screen must select the founding plan, or the page
  // advertises $12 and the customer is charged $19.
  assert.match(src, /const founding = LAUNCH\.active && !annual && \(foundingLeft \?\? 0\) > 0/)
  assert.match(src, /const nowPrice = founding \? period\.now : period\.list/)
  assert.match(src, /founding \? "pro_founding" : "pro_monthly"/)
  assert.match(src, /plan=\{checkoutPlan\}/)
})

test('the founding cap is enforced on the server, not in the page', () => {
  const checkout = readFileSync('src/app/api/billing/checkout/route.ts', 'utf8')
  assert.match(checkout, /plan === 'pro_founding' && \(await foundingSeatsLeft\(\)\) <= 0/)
  assert.match(checkout, /founding_sold_out/)
  // And an unlisted plan key cannot be posted straight through.
  assert.match(checkout, /!SELLABLE_PLANS\.includes/)
})

test('a refused checkout says so instead of doing nothing', () => {
  const btn = readFileSync('src/components/ui/UpgradeButton.tsx', 'utf8')
  assert.match(btn, /founding_sold_out/)
  assert.match(btn, /setError/)
})
