/**
 * Do the prices in Paddle match the prices in the code?
 *
 * NOTHING ELSE CAN CHECK THIS. pricing-copy.test.ts asserts the pricing table
 * agrees with paddle.ts, and the Paddle dashboard is what actually charges the
 * card. Set 19.00 in the code and 1.90 in Paddle and every test passes while
 * the customer is charged the wrong amount.
 *
 * Read-only. Run it after changing a price, and after setting the env vars.
 *
 *   npx tsx scripts/verify-paddle.mts
 */
import { readFileSync } from 'node:fs'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const { PADDLE_PLANS, SELLABLE_PLANS, FOUNDING_SEATS } = await import('../src/lib/paddle.js')

const key = process.env.PADDLE_API_KEY
if (!key) {
  console.error('  PADDLE_API_KEY is not set. Nothing to check against.')
  process.exit(1)
}

async function get(path: string) {
  const res = await fetch(`https://api.paddle.com${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

let bad = 0
const fail = (msg: string) => { console.error(`  FAIL  ${msg}`); bad++ }
const ok = (msg: string) => console.log(`  ok    ${msg}`)

/**
 * The permission check comes first, because every other failure below is
 * indistinguishable from this one. A key that cannot read subscriptions makes
 * foundingSeatsLeft() return zero forever, and the founding price then exists
 * in Paddle and never appears on the site.
 */
const subs = await get('/subscriptions?per_page=1')
if (subs.status === 200) ok('the API key can read subscriptions, so seat counting works')
else fail(`the API key cannot read subscriptions (${subs.status}). The founding price will never show.`)

for (const name of SELLABLE_PLANS) {
  const plan = PADDLE_PLANS[name]
  if (!plan.priceId) {
    fail(`${name}: no price id set. Check the env var for it.`)
    continue
  }
  const res = await get(`/prices/${plan.priceId}`)
  if (res.status !== 200) {
    fail(`${name}: Paddle returned ${res.status} for ${plan.priceId}`)
    continue
  }
  const p = res.body.data as {
    unit_price: { amount: string; currency_code: string }
    billing_cycle?: { interval: string; frequency: number }
    status: string
    description?: string
  }
  const amount = Number(p.unit_price.amount)
  const interval = p.billing_cycle?.interval
  const every = p.billing_cycle?.frequency

  if (amount !== plan.amount) fail(`${name}: Paddle charges ${amount} cents, the code says ${plan.amount}`)
  else ok(`${name}: ${amount} cents matches the code`)

  if (p.unit_price.currency_code !== 'USD') fail(`${name}: currency is ${p.unit_price.currency_code}, not USD`)
  if (interval !== plan.interval) fail(`${name}: billing interval is ${interval}, the code says ${plan.interval}`)
  if (every !== 1) fail(`${name}: billed every ${every} ${interval}s, expected 1`)
  if (p.status !== 'active') fail(`${name}: price status is ${p.status}`)
}

// How many founding seats are actually gone. Counted the same way the app
// counts them, so this is the number the pricing page will act on.
const founding = PADDLE_PLANS.pro_founding.priceId
if (founding && subs.status === 200) {
  const res = await get(`/subscriptions?price_id=${encodeURIComponent(founding)}&status=active,trialing,past_due&per_page=100`)
  const taken = Array.isArray((res.body as { data?: unknown[] }).data)
    ? ((res.body as { data: unknown[] }).data).length
    : null
  if (taken === null) fail('could not count founding subscriptions')
  else ok(`founding seats: ${taken} taken, ${Math.max(0, FOUNDING_SEATS - taken)} of ${FOUNDING_SEATS} left`)
}

console.log(bad === 0 ? '\n  Paddle and the code agree.' : `\n  ${bad} problem${bad === 1 ? '' : 's'}. Fix before taking payment.`)
process.exit(bad === 0 ? 0 : 1)
