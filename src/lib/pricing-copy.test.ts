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
import { MAX_DOC_CHARS, MIN_DOC_CHARS } from './factcheck/types'
import { SAMPLE_DOCUMENT, SAMPLE_LENGTH, SAMPLE_LINKS, sampleIsRunnable } from './factcheck/sample'
import { FAQS, FAQ_PRIVACY_ANCHOR } from './faq'
import { CITATION_AUDIT, FLAG_AUDIT, outOfAudit, shareOfAudit } from './citation-audit'

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
/**
 * THE ANSWERS, from where the answers actually live.
 *
 * This read FAQSection.tsx and sliced from `const FAQS = [`. That array moved
 * to lib/faq.ts when /faq started building its structured data from the same
 * source, and `indexOf` returned -1 from that day on, so `slice(-1, -1)` gave
 * an empty string and four checks below have been asserting things about
 * nothing ever since. They passed, which is the worst way for a guard to
 * fail.
 *
 * `faqComponent` is still read, because two of the checks are about the
 * accordion's rendering rather than about the copy.
 */
const faq = readFileSync('src/lib/faq.ts', 'utf8')
const faqComponent = readFileSync('src/components/marketing/FAQSection.tsx', 'utf8')

/**
 * The declaration, exactly. The old slice looked for `const FAQS = [`, which
 * never matched even before the move: the array is exported and typed, so the
 * line reads `export const FAQS: Faq[] = [`. Two reasons the guard was dead,
 * and either one alone was enough.
 */
const FAQS_MARKER = 'export const FAQS: Faq[] = ['
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

test('the FAQ checks below are looking at the FAQ', () => {
  // The assertion that would have caught four dead guards on the day the
  // array moved file. Every slice below starts from this marker.
  assert.ok(faq.includes(FAQS_MARKER), 'the FAQS array is not where this test reads it')
  const block = faq.slice(faq.indexOf(FAQS_MARKER), faq.indexOf('\n]\n'))
  assert.ok(block.length > 1_000, `the FAQ slice found ${block.length} characters`)
  assert.ok(block.includes('Do you keep my writing?'))
})

test('no FAQ answer states a number that is not read from a constant', () => {
  const block = faq.slice(faq.indexOf(FAQS_MARKER), faq.indexOf('\n]\n'))
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
  const block = faq.slice(faq.indexOf(FAQS_MARKER), faq.indexOf('\n]\n'))
  for (const m of block.matchAll(/[qa]: '([^']*)'/g)) {
    assert.doesNotMatch(m[1], /\$\{/, `single-quoted string would print braces: ${m[1].slice(0, 60)}`)
  }
})

test('the FAQ keeps the voice rules', () => {
  const block = faq.slice(faq.indexOf(FAQS_MARKER), faq.indexOf('\n]\n'))
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
    faqComponent,
    /\{isOpen && \(/,
    'a conditional render keeps closed answers out of the HTML entirely'
  )
  assert.match(faqComponent, /hidden=\{!isOpen\}/, 'closed answers must be hidden, not absent')
  // The panel still has to be wired to its button for a screen reader.
  assert.match(faqComponent, /aria-controls=\{panelId\}/)
  assert.match(faqComponent, /aria-labelledby=\{buttonId\}/)
})

test('the FAQ ships FAQPage structured data built from the same array', () => {
  const page = readFileSync('src/app/faq/page.tsx', 'utf8')
  assert.match(page, /'@type': 'FAQPage'/)
  assert.match(page, /mainEntity: FAQS\.map/, 'schema must be generated, not hand-copied')
  // A hand-maintained copy drifts, and structured data that disagrees with the
  // page is worse than none.
  assert.doesNotMatch(page, /acceptedAnswer[\s\S]{0,60}text: '/, 'no literal answers in the schema')
})


// ---------------------------------------------------------------------------
// THE HERO
//
// The first thing a stranger reads, and the last place a claim we cannot keep
// should be able to hide. It was rebuilt from docs/design/hero-console.html,
// an approved design that carried four statements about this product that were
// not true: an "Import URL" tab, links "queried in sandboxed headless
// chromium", a "DOM Engine Ready" light and a version number nobody had
// assigned. None of them was a lie anyone told on purpose. They were furniture
// in a mockup, and furniture is exactly how the previous nine got in.
//
// So the removals are pinned as hard as the copy. A presence check catches a
// promise that stopped shipping; it cannot catch one that came back.
// ---------------------------------------------------------------------------

const hero = readFileSync('src/components/factcheck/CheckClient.tsx', 'utf8')
const landing = readFileSync('src/app/(marketing)/page.tsx', 'utf8')
const checkRoute = readFileSync('src/app/api/factcheck/check/route.ts', 'utf8')
const howItWorks = readFileSync('src/app/how-it-works/page.tsx', 'utf8')

/**
 * THE TWO BLOCKS THAT ARE THE HERO, and nothing else.
 *
 * Scoped rather than whole-file, because a scan of the whole component reads
 * `length > 0 && !overLimit` as copy and the page footer's "2026" as a claim.
 * Both slices are asserted non-empty below: the FAQ checks further up this
 * file quietly stopped matching anything when FAQS moved out of the component,
 * and a guard that silently passes is worse than no guard.
 */
const heroConsole = hero.slice(
  hero.indexOf('  return (\n    <div>\n      <form'),
  hero.indexOf('/**\n * One line for everything we could not open.')
)
/**
 * The marker moved when the dark mount was removed, and `indexOf` returned -1,
 * so the slice ran to the end of the file and the hero-numbers check started
 * reading the copyright line in the footer. It failed loudly, which is the
 * only reason this is a note and not another dead guard.
 *
 * Both bounds are asserted below, so a marker that moves again fails as a
 * missing marker rather than as a mystery about "2026".
 */
const HERO_START = 'THE HERO IS THE CONSOLE'
const HERO_END = 'THE REAL EXAMPLE, ITS OWN SECTION, ON ITS OWN TIER'
const heroHead = landing.slice(landing.indexOf(HERO_START), landing.indexOf(HERO_END))

test('the hero checks below are looking at the hero', () => {
  assert.ok(landing.includes(HERO_START), `"${HERO_START}" is gone from the landing page`)
  assert.ok(landing.includes(HERO_END), `"${HERO_END}" is gone from the landing page`)
  assert.ok(heroConsole.length > 2_000, 'the console slice found nothing to read')
  assert.ok(heroHead.length > 500, 'the headline slice found nothing to read')
  // And it stops before the footer, which is where the last miss ended up.
  assert.doesNotMatch(heroHead, /Deepclario<\/span>|© 2026/)
  assert.match(heroConsole, /Check my links/)
  assert.match(heroHead, /Does your source/)
})

/**
 * The words a reader sees, pulled out of a JSX block.
 *
 * Everything inside a tag is discarded, which is the whole point: the hero is
 * mostly Tailwind sizes and SVG path data, and `w-3.5`, `py-1.5` and
 * `d="M9 12h6"` are full of digits that are not numbers anybody reads. Only
 * the runs between a `>` and a `<` are copy.
 */
function jsxText(src: string): string[] {
  return [...copyOnly(src).replace(/\{'\s*'\}|\{"\s*"\}/g, ' ').matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)]
    .map(m => m[1].replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

test('the hero character counter reads the ceiling, never a literal', () => {
  // "12,000" typed next to a constant is the exact shape of all five earlier
  // bugs: the copy and the limit sit in different files and only one moves.
  assert.match(hero, /\{MAX_DOC_CHARS\.toLocaleString\(\)\} characters/)
  assert.doesNotMatch(copyOnly(hero), /12,000/, 'the ceiling is written out instead of read')
  // And it is a ceiling the server actually applies, not a suggestion the
  // browser makes. A number in the copy has to be enforced somewhere.
  assert.match(checkRoute, /visible > MAX_DOC_CHARS/)
  assert.match(checkRoute, /error: 'too_long', limit: MAX_DOC_CHARS/)
  assert.equal(MAX_DOC_CHARS, 12_000)
})

test('the hero states no number of its own except the one it can point at', () => {
  /**
   * 114 is allowed because it is not ours to invent: /how-it-works publishes
   * it, the test below pins it there, and check:html asserts it on the live
   * page. Every other digit in hero copy has to arrive by interpolation.
   */
  const offenders: string[] = []
  for (const line of [...jsxText(heroConsole), ...jsxText(heroHead)]) {
    for (const n of line.match(/\d[\d,.]*/g) ?? []) {
      if (n === '114') continue
      offenders.push(`"${n}" in: ${line.slice(0, 70)}`)
    }
  }
  assert.deepEqual(offenders, [], 'a literal number in hero copy:\n  ' + offenders.join('\n  '))
})

test('the 114 in the hero is a number the page it links to actually carries', () => {
  // The sub-link promises "what we found in 114 real numbers". If that figure
  // is not on /how-it-works, the link is the claim and the page is the
  // contradiction, on a site that exists to catch exactly that.
  assert.match(hero, /what we found in 114 real numbers/)
  assert.match(hero, /href="\/how-it-works"/)
  assert.match(howItWorks, /114 numbers across 11/)
})

test('the four claims the mockup carried are gone, and stay gone', () => {
  const REMOVED: Record<string, string> = {
    'Import URL': 'We take pasted text only. FAQ: can-i-give-you-a-url says so.',
    'headless chromium': 'There is no fetcher in this codebase. Tavily extracts, which is why there is no SSRF surface.',
    'DOM Engine': 'There is no DOM engine.',
    'v1.4': 'Invented. Nothing assigns a version to this page.',
    'Live link & number verification': 'The pill it lived in was deleted.',
    'animate-pulse': 'Nothing on this site pulses. See the check-mark transition rules in globals.css.',
  }
  const offenders: string[] = []
  for (const [claim, why] of Object.entries(REMOVED)) {
    for (const [name, src] of [['hero', hero], ['landing', landing]] as const) {
      if (copyOnly(src).includes(claim)) offenders.push(`${name}: "${claim}" - ${why}`)
    }
  }
  assert.deepEqual(offenders, [], 'a removed claim is back:\n  ' + offenders.join('\n  '))
})

test('the hero keeps the voice rules', () => {
  for (const line of [...jsxText(heroConsole), ...jsxText(heroHead)]) {
    assert.doesNotMatch(line, /[—–]/, `em-dash or en-dash in: ${line.slice(0, 60)}`)
    for (const word of ['powerful', 'seamless', 'unleash', 'supercharge', 'cutting-edge', 'effortless']) {
      assert.doesNotMatch(line, new RegExp(word, 'i'), `"${word}" is marketing language`)
    }
  }
})

test('the privacy line points at an answer that exists', () => {
  // "We do not save your writing" plus a link, rather than a second
  // description of the mechanism. A second description is a second thing to
  // keep true, and it is the one nobody remembers to update.
  assert.match(hero, /We do not save your writing\./)
  assert.match(hero, /How we handle it/)
  assert.match(hero, /href=\{`\/faq#\$\{FAQ_PRIVACY_ANCHOR\}`\}/)
  const answer = FAQS.find(f => f.id === FAQ_PRIVACY_ANCHOR)
  assert.ok(answer, 'the anchor the hero links to is not an FAQ entry')
  assert.match(answer.a, /never save it/)
  // The anchor has to be unique or the accordion opens whichever it hits first.
  assert.equal(FAQS.filter(f => f.id === FAQ_PRIVACY_ANCHOR).length, 1)
  assert.equal(new Set(FAQS.map(f => f.id)).size, FAQS.length, 'two answers share an anchor')
})

test('the sample button loads a document the checker can actually run', () => {
  /**
   * The button was kept only on condition that it does something. A toolbar
   * control that prefills nothing is a dead claim in the same family as the
   * ones above, and this is what stops it becoming one by attrition.
   */
  assert.match(hero, /SAMPLE_DOCUMENT/)
  assert.match(hero, /onClick=\{loadSample\}/)
  assert.ok(sampleIsRunnable(), 'the sample would be refused by the checker')
  assert.ok(SAMPLE_LENGTH >= MIN_DOC_CHARS, `sample is ${SAMPLE_LENGTH} characters, floor is ${MIN_DOC_CHARS}`)
  assert.ok(SAMPLE_LENGTH <= MAX_DOC_CHARS, `sample is ${SAMPLE_LENGTH} characters, ceiling is ${MAX_DOC_CHARS}`)
  // A sample with no link demonstrates nothing this product does.
  assert.ok(SAMPLE_LINKS >= 2, `sample carries ${SAMPLE_LINKS} links`)
  // Every href absolute and http(s), because a relative one silently checks
  // nothing and a reader would read that as the tool failing.
  for (const m of SAMPLE_DOCUMENT.matchAll(/\]\(([^)]+)\)/g)) {
    assert.match(m[1], /^https:\/\/[^\s]+$/, `sample link is not an absolute https URL: ${m[1]}`)
  }
  // And it must not predict its own verdicts. What a page says on the day it
  // is opened is not ours to promise in advance.
  for (const word of ['verified', 'contradicted', 'will fail', 'will pass']) {
    assert.doesNotMatch(SAMPLE_DOCUMENT, new RegExp(word, 'i'), `the sample predicts a result: "${word}"`)
  }
})

test('the keyboard hint names a shortcut that is wired up', () => {
  // A hint for a key combination nothing listens for is the cheapest false
  // claim on the page, and the easiest one to leave behind after a refactor.
  assert.match(hero, /\+ Enter/)
  assert.match(hero, /e\.key === 'Enter' && \(e\.metaKey \|\| e\.ctrlKey\)/)
  // Both modifiers, because the label changes per platform and the handler
  // must not.
  assert.match(hero, /'Ctrl'/)
})


// ---------------------------------------------------------------------------
// THE REST OF THE LANDING PAGE
//
// The hero was rebuilt from a mockup and four of its claims had to be deleted.
// The sections under it were rebuilt from the same mockup, and the mockup
// carried more of the same: a "Case ID", a "Live Link Spider", a "Verified
// Match from Target DOM", a "Zero human opinion" and a "51.2% frequency in
// corpus" that was near a real measurement without being one.
//
// A mockup is allowed to invent. A page is not, and the difference has to be
// enforced by something other than whoever reads the diff.
// ---------------------------------------------------------------------------

const example = readFileSync('src/components/factcheck/WorkedExample.tsx', 'utf8')
const taxonomy = readFileSync('src/components/factcheck/CannotCheck.tsx', 'utf8')
const trust = readFileSync('src/components/marketing/EarlyDays.tsx', 'utf8')
const auditDoc = readFileSync('docs/citation-audit/coverage.md', 'utf8')

test('the audit constants are the audit, not a memory of it', () => {
  /**
   * READ OUT OF THE PUBLISHED TABLE, not retyped from it.
   *
   * `lib/citation-audit.ts` is what the taxonomy cards print, and the whole
   * reason it exists is that "51.2% frequency in corpus" was one plausible
   * digit away from 48.2% and nobody would ever have re-derived it. So the
   * constants are asserted against the row in coverage.md that produced them,
   * and editing one without the other fails here.
   *
   * The row is: | **All** | **114** | 34 | 20 | 3 | 2 | 55 | **30%** | **52%** |
   */
  const row = auditDoc.split('\n').find(l => l.includes('| **All** |'))
  assert.ok(row, 'the All row is gone from coverage.md')
  const cells = row.split('|').map(c => c.replace(/\*/g, '').trim()).filter(Boolean)
  const [, statistics, readable, paywalled, dead, live, noSource] = cells
  assert.equal(CITATION_AUDIT.statistics, Number(statistics))
  assert.equal(CITATION_AUDIT.readable, Number(readable))
  assert.equal(CITATION_AUDIT.paywalled, Number(paywalled))
  assert.equal(CITATION_AUDIT.dead, Number(dead))
  assert.equal(CITATION_AUDIT.live, Number(live))
  assert.equal(CITATION_AUDIT.noSource, Number(noSource))

  // And the parts account for the whole, which is the check that catches a
  // count edited in isolation.
  assert.equal(
    CITATION_AUDIT.readable +
      CITATION_AUDIT.paywalled +
      CITATION_AUDIT.dead +
      CITATION_AUDIT.live +
      CITATION_AUDIT.noSource,
    CITATION_AUDIT.statistics,
    'the five groups do not add up to the statistics read'
  )
})

test('the number the mockup guessed is not the number we publish', () => {
  // The specific one, pinned, because it is the closest miss on the page.
  assert.equal(shareOfAudit(CITATION_AUDIT.noSource), '48.2%')
  assert.equal(outOfAudit(CITATION_AUDIT.noSource), '55 of 114')
  for (const src of [taxonomy, example, landing]) {
    assert.doesNotMatch(copyOnly(src), /51\.2/, 'the invented share is back')
  }
})

test('no taxonomy card states a number of its own', () => {
  // Every figure on these cards arrives from CITATION_AUDIT. A card that needs
  // a number the audit did not measure ships without the number, which is why
  // there is no cell here for an HTTP status or a refresh interval.
  for (const line of jsxText(taxonomy)) {
    assert.deepEqual(
      line.match(/\d[\d,.]*/g) ?? [],
      [],
      `a literal number on a taxonomy card: ${line.slice(0, 70)}`
    )
  }
  assert.match(taxonomy, /outOfAudit\(s\.count\)/)
  assert.match(taxonomy, /shareOfAudit\(s\.count\)/)
})

test('the four states on the page are the four states in the product', () => {
  // readability.ts and severity.ts decide these. A fifth card would be a
  // promise with nothing behind it, and a missing one would hide a finding.
  for (const label of ['No link at all', 'Behind a paywall', 'Dead link', 'Live dashboard']) {
    assert.ok(taxonomy.includes(label), `${label} is not on the page`)
  }
  const counts = [...taxonomy.matchAll(/count: CITATION_AUDIT\.(\w+)/g)].map(m => m[1])
  assert.deepEqual(counts, ['noSource', 'paywalled', 'dead', 'live'])
})

test('the mockup furniture is gone from the worked example', () => {
  const INVENTED: Record<string, string> = {
    'Case ID': 'There is no case numbering anywhere in this product.',
    'Live Link Spider': 'There is no crawler. Tavily extracts, which is why there is no SSRF surface.',
    'Target DOM': 'Nothing here reads a DOM.',
    'Zero human opinion': 'A model judges. Claiming no opinion is in the loop is an overclaim, not a modesty.',
    'Raw text match': 'The citation axis is a model call against retrieved text, not a string match.',
  }
  const offenders: string[] = []
  for (const [claim, why] of Object.entries(INVENTED)) {
    for (const [name, src] of [['example', example], ['taxonomy', taxonomy], ['landing', landing]] as const) {
      if (copyOnly(src).includes(claim)) offenders.push(`${name}: "${claim}" - ${why}`)
    }
  }
  assert.deepEqual(offenders, [], 'invented copy from the mockup:\n  ' + offenders.join('\n  '))
})

test('the comparison is two columns, because the comparison is the product', () => {
  // Stacked, a reader compares "61.5% of desktop" to "61.5% of mobile" from
  // memory. This is the one layout decision on the page worth a test.
  assert.match(example, /grid grid-cols-1 md:grid-cols-2/)
  assert.match(example, /Published article claim/)
  assert.match(example, /Original primary source/)
  /**
   * NEITHER SIDE IS NAMED.
   *
   * The publisher who made the mistake was already anonymous: the error is
   * public, but naming them to sell a tool is a different act from telling
   * them privately, and we have not told them. The same reasoning covers the
   * primary source, who got it right and is a real company that never agreed
   * to appear in our marketing. We quote the sentence, because the sentence is
   * the example. We do not print the domain.
   */
  assert.doesNotMatch(copyOnly(example), /sparktoro/i, 'the source is named on the page')
  assert.match(example, /Independent research post \(2018\)/)
  assert.match(example, /The page they link to says/)
  assert.match(example, /The words are swapped, and one number is rounded differently\./)
  // 34.4 against 34.3 is not "same numbers", and the footer cells put them
  // side by side where nobody can miss it.
  assert.doesNotMatch(example, /Same numbers/)
  // ONE container split by a central rule, not two cards with a gap between
  // them. Two cards read as two exhibits that happen to sit near each other.
  assert.match(example, /md:divide-x divide-\[var\(--border-warm\)\]/)
  // The footers have to restate what each figure is attached to, or the swap
  // is only visible to somebody who reads both sentences word for word.
  assert.match(example, /figures="61\.5% desktop · 34\.4% mobile"/)
  assert.match(example, /figures="61\.5% mobile · 34\.3% desktop"/)
  // Both columns are the same component, so they cannot drift structurally.
  assert.equal((example.match(/<Column/g) ?? []).length, 2)
  // Both carry a lead-in, so the two quotes start on the same line.
  assert.match(example, /lead="The article says"/)
  assert.match(example, /lead="The page they link to says"/)
  // Its own section on its own tier, so the page alternates the whole way
  // down. The dark mount that used to do this job is gone, and with it the
  // onDark branch nobody exercised.
  assert.doesNotMatch(copyOnly(example), /onDark/)
  assert.match(
    landing,
    // [\s\S] rather than the /s flag, which this tsconfig target rejects.
    /background: "var\(--surface-subtle\)" \}\}[\s\S]*?<div className="w-full max-w-5xl mx-auto">[\s\S]*?<WorkedExample \/>/,
    'the example section is not on surface-subtle at max-w-5xl'
  )
})

test('the founder note is attributed to a person, not to a company', () => {
  // A quote with no name on it is a testimonial we wrote ourselves, which is
  // the thing this card exists to say we do not do.
  assert.match(trust, /Art Shllaku/)
  assert.match(trust, /Founder, Deepclario/)
  assert.match(trust, /Deepclario is new, so you will not find made-up reviews here\./)
  // No stock photograph. There is no founder photo in the repo and inventing
  // one on this particular card would be self-refuting.
  assert.doesNotMatch(trust, /<Image|<img/, 'a face appeared on the founder card')
})

test('the pricing chips read the counts they claim', () => {
  const src = copyOnly(pricing)
  // "50 places left" has to be Paddle's number at request time. Typed out, it
  // advertises places that are sold.
  assert.match(src, /Founding price, \$\{foundingLeft\} places left/)
  assert.doesNotMatch(src, /Founding price, \d+ places/)
  // The badge sits on the border and has to paint above the accent ring.
  assert.match(src, /absolute -top-2\.5[^"]*z-10/)
  // The allowance is the number the two plans are compared on, so it is mono
  // like every other countable number on this site.
  assert.match(src, /fontFamily: "var\(--font-mono\)",\s*fontWeight: 500,/)
})

test('every rebuilt section keeps the voice rules', () => {
  for (const [name, src] of [['example', example], ['taxonomy', taxonomy], ['trust', trust]] as const) {
    for (const line of jsxText(src)) {
      assert.doesNotMatch(line, /[—–]/, `${name}: em-dash or en-dash in "${line.slice(0, 60)}"`)
      for (const word of ['powerful', 'seamless', 'unleash', 'supercharge', 'cutting-edge', 'effortless']) {
        assert.doesNotMatch(line, new RegExp(word, 'i'), `${name}: "${word}" is marketing language`)
      }
    }
  }
})

test('the console shows a status that is enforced, or none', () => {
  // The slot the mockup filled with "DOM Engine Ready". The check counter is
  // allowed there because route.ts refuses on the same allowance; anonymous
  // visitors get nothing, because their ceiling is best effort.
  assert.match(hero, /checksLeft && \(/)
  assert.match(hero, /checks left/)
  assert.match(checkRoute, /getFactcheckAllowance\(auth\.userId, auth\.tier, serviceRole\)/)
  assert.match(checkRoute, /free_monthly_limit/)
})


test('nothing in the product asserts that a claim is true', () => {
  /**
   * "This is true. The link does not show it." shipped in MarkedDocument for
   * months. There is no judge module in this codebase: the check route runs
   * extractClaims and streamCitations and nothing else, so ClaimVerdict never
   * leaves 'unchecked' and no code path has ever established that a claim is
   * true. It was a verdict with no evidence, on the one axis this product
   * refuses to have an opinion about, and the homepage says the opposite in
   * so many words.
   */
  const marked = readFileSync('src/components/factcheck/MarkedDocument.tsx', 'utf8')
  assert.doesNotMatch(copyOnly(marked), /This is true/)
  assert.match(marked, /The link does not show this\. That is not the same as being wrong\./)
  /**
   * And the reason it cannot be true: nothing on the claim axis ever writes
   * a verdict. Not `/judge/i`, which the route trips on legitimately because
   * the field is called `judgement`. What matters is that no shipping file
   * assigns one.
   */
  assert.doesNotMatch(checkRoute, /from '@\/lib\/factcheck\/judge'/)
  const writers: string[] = []
  for (const file of userFacingFiles('src/lib').concat(userFacingFiles('src/app'))) {
    const src = copyOnly(readFileSync(file, 'utf8'))
    if (/verdict:\s*'(verified|contradicted)'/.test(src)) writers.push(file)
  }
  assert.deepEqual(
    writers,
    [],
    'something now decides a claim is true or false:\n  ' +
      writers.join('\n  ') +
      '\nIf that is deliberate, the homepage line "We do not judge your numbers" has to go first.'
  )
  assert.match(hero, /We\s+do not judge your numbers/)
})


test('the diff inspector borrows the mockup layout and none of its inventions', () => {
  /**
   * The Stitch mockup for this section is a good layout wrapped around seven
   * fabrications. Its structural slots are all used; what filled them is not.
   * Two of these are worse than the rest: the quote lead-ins are invented
   * sentence fragments placed INSIDE quotation marks and attributed to real
   * publications, on the page where this product argues that misquoting a
   * source is the defect it exists to catch.
   */
  const INVENTED: Record<string, string> = {
    'Case ID': 'No case numbering exists anywhere in this product.',
    'Live Link Spider': 'There is no crawler. Tavily extracts, which is why there is no SSRF surface.',
    'Target DOM': 'Nothing here reads a DOM.',
    'Paragraph 8': 'Position within a source page is not tracked.',
    'anchor text': 'Anchor text is not captured or reported.',
    'Zero human opinion': 'A model judges. Claiming no opinion is in the loop is an overclaim, not modesty.',
    'Raw text match': 'The citation axis is a model call against retrieved text, not a string match.',
    'According to recent search query research': 'A fabricated quote fragment attributed to a real publication.',
    'our deep sample confirmed': 'A fabricated quote fragment attributed to a real publication.',
    'High-traffic technical guide': 'We know nothing about that article\u2019s traffic.',
  }
  const offenders: string[] = []
  for (const [claim, why] of Object.entries(INVENTED)) {
    if (copyOnly(example).includes(claim)) offenders.push(`"${claim}" - ${why}`)
  }
  assert.deepEqual(offenders, [], 'mockup invention on the page:\n  ' + offenders.join('\n  '))
})

test('the provenance line is the audit, not a capture method', () => {
  // The mockup fills that slot with "Captured via Deepclario Live Link
  // Spider". The slot is good; the content has to be something we measured.
  assert.match(example, /\{FLAG_AUDIT\.contextMismatch\} of \{FLAG_AUDIT\.claims\} claims we audited/)
  const flagsDoc = readFileSync('docs/citation-audit/flags-by-cause.md', 'utf8')
  // Summed from the Context-mismatch column of the table in that file.
  // The publisher table only. The file has a second, two-column table
  // further down whose rows also start with a domain.
  const rows = flagsDoc
    .split('\n')
    .filter(l => /^\| \w[\w.-]*\.com/.test(l) && l.split('|').length === 12)
  assert.equal(rows.length, 6, 'the flags table changed shape')
  const cell = (l: string, i: number) =>
    Number(l.split('|').map(c => c.replace(/\*/g, '').trim())[i])
  assert.equal(rows.reduce((n, l) => n + cell(l, 3), 0), FLAG_AUDIT.claims, 'claims')
  assert.equal(rows.reduce((n, l) => n + cell(l, 4), 0), FLAG_AUDIT.flagged, 'flagged')
  assert.equal(rows.reduce((n, l) => n + cell(l, 5), 0), FLAG_AUDIT.contextMismatch, 'context mismatch')
  // The two audits are different document sets and must never be mixed.
  assert.notEqual(FLAG_AUDIT.claims, CITATION_AUDIT.statistics)
})
