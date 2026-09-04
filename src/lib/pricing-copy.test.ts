import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  FACTCHECK_WINDOW_HOURS,
  PRO_FACTCHECK_WINDOW_HOURS,
  DETECT_WINDOW_HOURS,
  PRO_DETECT_WINDOW_HOURS,
  IMPROVE_WINDOW_HOURS,
  FACTCHECK_FREE_LIMIT,
  PRO_FACTCHECK_LIMIT,
  DETECT_FREE_LIMIT,
  PRO_DETECT_LIMIT,
  IMPROVE_FREE_LIMIT,
  IMPROVE_PRO_LIMIT,
  HISTORY_FREE_DAYS,
} from './limits'
import { ANON_FACTCHECK_MONTH } from './rate-limit'

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
const faq = readFileSync('src/components/marketing/FAQSection.tsx', 'utf8')
const plans = readFileSync('src/lib/plans.ts', 'utf8')

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

/**
 * EVERY FEATURE LINE IS METERED UNTIL SOMEONE SAYS OTHERWISE.
 *
 * The previous version of this test looked for the words "detection",
 * "check" and "source" inside an "Unlimited" line. That is an allowlist of
 * things that count, which means anything new does not count by default -
 * the same shortcut that has now produced this class of bug six times. It
 * passed happily while the page said "Unlimited prompt improvements" against
 * a server that enforced nothing, on a call measured at $0.0198.
 *
 * So it is inverted. A feature line may only say "Unlimited" if it is
 * declared here with a reason, the way exemptions work in
 * paid-routes.test.ts. A feature added next year fails until somebody thinks
 * about what it costs.
 */
const UNMETERED_BY_DESIGN: Record<string, string> = {
  // No PLAN line is here, and that is the point: every allowance on both
  // plans is a number the server enforces. Adding one means writing down what
  // it costs per use and why unbounded is affordable at the LOWEST price the
  // plan is ever sold at - the $12 founding price, not the $19 list price.
  //
  // This entry is not a promise of unlimited anything. It is the privacy page
  // describing the global daily cap, and the sentence says the opposite of
  // what the test hunts for.
  // Keys are SUBSTRINGS, matched against the whitespace-collapsed line. Exact
  // strings were too brittle: JSX prose wraps across lines, so the same
  // sentence hashed differently after a reflow and the exemption silently
  // stopped applying.
  'cannot run up an unlimited bill':
    'Privacy page prose about the global anonymous budget. It says the free tool CANNOT run up an unlimited bill, which is the opposite of an offer.',
}

function userFacingFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) userFacingFiles(full, out)
    else if (/\.(tsx|ts)$/.test(entry) && !entry.includes('.test.')) out.push(full)
  }
  return out
}

test('nothing anywhere promises unlimited unless it is declared', () => {
  /**
   * SCANS EVERY FILE, NOT THE PRICING TABLE.
   *
   * The first inverted version of this test scanned only the FREE_FEATURES /
   * PRO_FEATURES block in EditorialPricing. It passed while six other places
   * still said unlimited: the pricing page's JSON-LD, the extension connect
   * page, the usage bar, the waitlist modal, plans.ts feeding the in-app
   * upgrade dialog, and the TERMS OF SERVICE. Scoping the check to one file
   * is the same allowlist mistake one level up.
   */
  const offenders: string[] = []
  for (const file of [...userFacingFiles('src/app'), ...userFacingFiles('src/components'), ...userFacingFiles('src/lib')]) {
    const src = copyOnly(readFileSync(file, 'utf8'))
    for (const m of src.matchAll(/[`"'>][^`"'<>]*\b[Uu]nlimited\b[^`"'<>]*[`"'<]/g)) {
      const line = m[0].slice(1, -1).replace(/\s+/g, ' ').trim()
      if (!line) continue
      if (Object.keys(UNMETERED_BY_DESIGN).some(k => line.includes(k))) continue
      offenders.push(`${file}: ${line}`)
    }
  }
  assert.deepEqual(
    offenders,
    [],
    'undeclared unlimited promise:\n  ' +
      offenders.join('\n  ') +
      '\nEither state the enforced number, or add the exact string to UNMETERED_BY_DESIGN with what it costs per use.'
  )
})

test('every declared exemption still has a reason attached', () => {
  // An empty string would satisfy the record type and defeat the point.
  for (const [line, why] of Object.entries(UNMETERED_BY_DESIGN)) {
    assert.ok(why.trim().length > 20, `"${line}" is exempt with no real reason`)
  }
})

test('the anonymous sentence reads the bucket the server applies', () => {
  const src = copyOnly(pricing)
  assert.match(src, /ANON_CHECKS_A_MONTH = ANON_FACTCHECK_MONTH\.capacity/)
  assert.match(src, /\{ANON_CHECKS_A_MONTH\} checks a month/)
  // And the bucket is a real number, not a placeholder.
  assert.ok(ANON_FACTCHECK_MONTH.capacity >= 1)
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
  assert.equal(FACTCHECK_FREE_LIMIT, 10)
  assert.equal(PRO_FACTCHECK_LIMIT, 60)
  assert.equal(DETECT_FREE_LIMIT, 10)
  assert.equal(PRO_DETECT_LIMIT, 30)
  assert.equal(IMPROVE_FREE_LIMIT, 10)
  assert.equal(IMPROVE_PRO_LIMIT, 30)
  assert.equal(HISTORY_FREE_DAYS, 7)
  assert.ok(src.includes('${IMPROVE_FREE_LIMIT} prompt improvements a month'))
  assert.ok(src.includes('${IMPROVE_PRO_LIMIT} prompt improvements a month'))
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
  // The logic moved into useCheckout, shared by the pricing button and the
  // in-app dialog, so a failure mode fixed once is fixed for both.
  const hook = readFileSync('src/components/ui/useCheckout.ts', 'utf8')
  assert.match(hook, /founding_sold_out/)
  assert.match(hook, /setError/)
  // Every early return must explain itself. This is the `if (!paddle) return`
  // that made the button do nothing at all.
  for (const state of ['loading', 'disabled', 'failed']) {
    assert.match(hook, new RegExp(`status === '${state}'`), `${state} has no branch`)
  }
  assert.doesNotMatch(hook, /if \(!paddle\) return\s*$/m, 'a bare return is a dead button')
})

test('no upgrade button can silently pick a plan for the reader', () => {
  const btn = readFileSync('src/components/ui/UpgradeButton.tsx', 'utf8')
  // The old default of 'pro_monthly' would have charged $19 to someone
  // reading "$12, 50 places left".
  assert.doesNotMatch(btn, /plan = '/, 'plan must never have a default')
  assert.match(btn, /plan \? start\(plan\) : setOpen\(true\)/)
})


// ---------------------------------------------------------------------------
// The FAQ. The sixth place this class of bug could live, and the one a person
// reads right before deciding whether to trust the tool with their writing.
// ---------------------------------------------------------------------------

test('no FAQ answer states a number that is not read from a constant', () => {
  const block = faq.slice(faq.indexOf('const FAQS = ['), faq.indexOf('\n]\n'))
  const offenders: string[] = []
  for (const m of block.matchAll(/[qa]: `([^`]*)`/g)) {
    // Strip the interpolations, then look for what digits are left.
    const literal = m[1].replace(/\$\{[^}]*\}/g, '')
    for (const n of literal.match(/(?<![\w$])\d+(?![\w}])/g) ?? []) {
      offenders.push(`"${n}" in: ${m[1].slice(0, 70)}`)
    }
  }
  assert.deepEqual(offenders, [], 'hardcoded number in an FAQ answer:\n  ' + offenders.join('\n  '))
})

test('a template in the FAQ is actually a template', () => {
  // A single-quoted string containing ${...} renders the braces literally.
  // Cheap to write, invisible in review, and it shipped once.
  const block = faq.slice(faq.indexOf('const FAQS = ['), faq.indexOf('\n]\n'))
  for (const m of block.matchAll(/[qa]: '([^']*)'/g)) {
    assert.doesNotMatch(m[1], /\$\{/, `single-quoted string would print braces: ${m[1].slice(0, 60)}`)
  }
})

test('the FAQ keeps the voice rules', () => {
  const block = faq.slice(faq.indexOf('const FAQS = ['), faq.indexOf('\n]\n'))
  assert.doesNotMatch(block, /[\u2014\u2013]/, 'no em-dashes or en-dashes in user-facing copy')
  for (const word of ['powerful', 'seamless', 'unleash', 'supercharge', 'cutting-edge', 'effortless']) {
    assert.doesNotMatch(block, new RegExp(word, 'i'), `"${word}" is marketing language`)
  }
})

test('the FAQ prices match the cents Paddle charges', () => {
  const cents = (s: string) => Math.round(parseFloat(s) * 100)
  const listed = plans.match(/PRICE_LIST = '([\d.]+)'/)?.[1]
  const founding = plans.match(/PRICE_FOUNDING = '([\d.]+)'/)?.[1]
  const seats = plans.match(/FOUNDING_SEAT_COUNT = (\d+)/)?.[1]
  assert.ok(listed && founding && seats, 'could not read the display prices')
  const amountOf = (key: string) =>
    Number(paddle.match(new RegExp(`${key}: \\{[\\s\\S]*?amount: (\\d+)`))?.[1])
  assert.equal(cents(listed), amountOf('pro_monthly'), 'PRICE_LIST vs pro_monthly')
  assert.equal(cents(founding), amountOf('pro_founding'), 'PRICE_FOUNDING vs pro_founding')
  assert.equal(Number(seats), Number(paddle.match(/FOUNDING_SEATS = (\d+)/)?.[1]), 'seat count vs paddle.ts')
})


// ---------------------------------------------------------------------------
// The ladder
// ---------------------------------------------------------------------------

test('every rung of the ladder uses the same unit', () => {
  /**
   * THE UNIT IS THE BUG, NOT THE NUMBER. Anonymous was 5 a DAY while a free
   * account was 5 a MONTH, so signing up made someone thirty times worse off
   * and any reader could work that out from the pricing page. Lowering the
   * daily number would not have fixed it: 1 a day is still 30 a month.
   *
   * This is the same failure that once had Free at 10 a day against Pro at
   * 100 a month, on the other rung. Comparing the numbers is only meaningful
   * if the windows match, so the windows are asserted, not the numbers.
   */
  const MONTH_HOURS = 24 * 30
  assert.equal(FACTCHECK_WINDOW_HOURS, MONTH_HOURS, 'free checks must be monthly')
  assert.equal(PRO_FACTCHECK_WINDOW_HOURS, MONTH_HOURS, 'pro checks must be monthly')
  assert.equal(DETECT_WINDOW_HOURS, MONTH_HOURS, 'free detections must be monthly')
  assert.equal(PRO_DETECT_WINDOW_HOURS, MONTH_HOURS, 'pro detections must be monthly')
  assert.equal(IMPROVE_WINDOW_HOURS, MONTH_HOURS, 'improvements must be monthly')

  // The anonymous rung is a token bucket, so its window is implied by how
  // long an EMPTY bucket takes to come back to full. Not the time for one
  // credit: with a capacity of 3 that is every 10 days, which is still three
  // a month. Asserting the per-credit interval is what I got wrong first.
  const daysToFull =
    ANON_FACTCHECK_MONTH.capacity / (ANON_FACTCHECK_MONTH.refillPerSecond * 86400)
  assert.ok(
    Math.abs(daysToFull - 30) < 0.5,
    `anonymous bucket refills fully in ${daysToFull.toFixed(1)} days, not a month`
  )
})

test('each rung is strictly more generous than the one below it', () => {
  // The property a reader checks by eye, and the one that was false.
  assert.ok(
    ANON_FACTCHECK_MONTH.capacity < FACTCHECK_FREE_LIMIT,
    `anonymous (${ANON_FACTCHECK_MONTH.capacity}) must be below a free account (${FACTCHECK_FREE_LIMIT})`
  )
  assert.ok(
    FACTCHECK_FREE_LIMIT < PRO_FACTCHECK_LIMIT,
    `free (${FACTCHECK_FREE_LIMIT}) must be below Pro (${PRO_FACTCHECK_LIMIT})`
  )
})

test('no user-facing copy anywhere describes an allowance in days', () => {
  /**
   * SCANS EVERY FILE, for the same reason the unlimited check does. Scoping
   * this to the pricing table and the FAQ would have missed the homepage
   * meta description, which said "Free, 2 a day" - the anonymous limit from
   * two changes earlier, in the sentence Google puts in search results.
   */
  const offenders: string[] = []
  for (const file of [...userFacingFiles('src/app'), ...userFacingFiles('src/components')]) {
    const copy = copyOnly(readFileSync(file, 'utf8'))
    for (const m of copy.matchAll(/[^`"']{0,60}(?:check|detection|improvement|rewrite)s? a day[^`"']{0,20}/gi)) {
      offenders.push(`${file}: ${m[0].replace(/\s+/g, ' ').trim()}`)
    }
    // The bare form, e.g. "ten a day" or "2 a day", with no noun in front.
    for (const m of copy.matchAll(/[^`"']{0,40}\b(?:\d+|ten|five|three|two) a day[^`"']{0,20}/gi)) {
      offenders.push(`${file}: ${m[0].replace(/\s+/g, ' ').trim()}`)
    }
  }
  assert.deepEqual(
    offenders,
    [],
    'an allowance stated per day, when every rung is monthly:\n  ' + offenders.join('\n  ')
  )
})


// ---------------------------------------------------------------------------
// The FAQ has to be readable without JavaScript
// ---------------------------------------------------------------------------

test('every answer is rendered, and only hidden', () => {
  /**
   * MEASURED AGAINST PRODUCTION, NOT ASSUMED. The accordion was
   * `{isOpen && <answer>}`, so a closed answer was never in the DOM and never
   * in the server HTML. `curl | grep` for any answer text returned zero.
   *
   * An FAQ is one of the few page types that can rank on its answer text, so
   * that was the most valuable copy on the site and the least visible.
   */
  assert.doesNotMatch(
    faq,
    /\{isOpen && \(/,
    'a conditional render keeps closed answers out of the HTML entirely'
  )
  assert.match(faq, /hidden=\{!isOpen\}/, 'closed answers must be hidden, not absent')
  // The panel still has to be wired to its button for a screen reader.
  assert.match(faq, /aria-controls=\{panelId\}/)
  assert.match(faq, /aria-labelledby=\{buttonId\}/)
})

test('the FAQ ships FAQPage structured data built from the same array', () => {
  const page = readFileSync('src/app/faq/page.tsx', 'utf8')
  assert.match(page, /'@type': 'FAQPage'/)
  assert.match(page, /mainEntity: FAQS\.map/, 'schema must be generated, not hand-copied')
  // A hand-maintained copy drifts, and structured data that disagrees with the
  // page is worse than none.
  assert.doesNotMatch(page, /acceptedAnswer[\s\S]{0,60}text: '/, 'no literal answers in the schema')
})
