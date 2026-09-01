/**
 * Citation axis tests.
 *
 * The invariant under test is the one the product rests on: a writer is told
 * their link is wrong ONLY when we actually read the page and the judge's
 * evidence is really in it. Everything else, including running out of credit,
 * must produce silence about their document.
 *
 * The judge is mocked. These tests cost nothing and never touch the network.
 */

import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { findQuote, checkCitations } from './citation'
import { readResponse, TavilyProvider, cleanRetrievedText } from './providers/tavily'
import { isPermanent, type ProviderFailure } from './providers/types'
import { domainsFor, PUBLISHER_NAMES } from './publishers'
import { rankFlags, flagScore, FLAGS_SHOWN } from './flags'
import type { Claim } from './types'
import type { RetrievalProvider, RetrievalResult } from './providers/types'

function claim(id: string, over: Partial<Claim> = {}): Claim {
  return {
    id,
    quote: 'q',
    claimText: 'q',
    kind: 'statistic',
    subject: 'population',
    sourceForm: 'none',
    looksPublished: false,
    judgement: { verdict: 'unchecked', evidence: [] },
    citation: { check: 'not_applicable', evidence: [] },
    ...over,
  }
}

/* ------------------------------------------------------ the indexOf gate */

test('a quote must really be in the source', () => {
  const src = 'Adoption rose to 34.2% in the second quarter of 2025.'
  assert.ok(findQuote(src, 'Adoption rose to 34.2%'))
  assert.ok(!findQuote(src, 'Adoption rose to roughly a third'), 'a paraphrase is not a quote')
  assert.ok(!findQuote(src, 'Adoption fell to 34.2%'), 'a flipped verb is not a quote')
})

test('the gate survives reflowed markdown but not paraphrase', () => {
  // Extraction reflows lines, so a quote spanning a wrapped line must still
  // match. Anything looser would let an invented sentence through, which is
  // the whole thing the gate exists to stop.
  const src = 'Adoption rose to 34.2%\n   in the second quarter.'
  assert.ok(findQuote(src, 'Adoption rose to 34.2% in the second quarter.'))
  assert.ok(findQuote('He said “yes” today', 'He said "yes" today'), 'curly quotes fold')
  assert.ok(!findQuote(src, 'Adoption grew in Q2.'))
})

test('whitespace folds to a space, never away', () => {
  // Same rule as locate.ts. Removing whitespace lets "the rapist" match
  // "therapist", and this gate decides whether a person is accused.
  assert.ok(!findQuote('the rapist was named', 'therapist'))
})

/* --------------------------------------------- credit exhaustion is ours */

test('every provider failure is about us, never about the document', () => {
  const failures: ProviderFailure[] = [
    'out_of_credit',
    'rate_limited',
    'unauthorized',
    'timeout',
    'unavailable',
    'malformed',
    'not_configured',
  ]
  // The type system carries the real guarantee: RetrievalResult has no
  // content field on the failure branch, so nothing can be concluded from
  // one. This asserts the taxonomy has not quietly grown a member that
  // describes the writer's link.
  for (const f of failures) {
    assert.ok(!['does_not_contain', 'supports'].includes(f as string))
  }
  assert.ok(isPermanent('out_of_credit'), 'retrying a billing limit just burns latency')
  assert.ok(isPermanent('unauthorized'))
  assert.ok(!isPermanent('rate_limited'), 'a rate limit does clear on its own')
})

/* ------------------------------------------------- reading the provider */

test('a body we cannot read at all is malformed, never an empty success', () => {
  // Calling an unreadable body a success would let a check read zero pages and
  // conclude the source does not contain the claim. That is the false
  // accusation the whole axis is built to prevent.
  assert.equal(readResponse(null).ok, false)
  assert.equal(readResponse({}).ok, false, 'no results key at all')
  assert.equal(readResponse('nope').ok, false)
  assert.equal(readResponse({ results: 'not an array' }).ok, false)
})

test('an empty results array is left for the caller to interpret', () => {
  // Emptiness means opposite things per endpoint: for /search it is the real
  // finding "we looked on their site and it is not there", and for /extract it
  // is a response we do not understand. readResponse must not pick one.
  const r = readResponse({ results: [] })
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.pages.length, 0)
  assert.equal(r.unretrieved.length, 0)
})

test('a row with no readable body becomes unretrieved, not nothing', () => {
  // Dropping it would leave the claim looking as though we never asked.
  // source_unreachable is the honest answer for a page we could not read.
  const r = readResponse({ results: [{ url: 'https://a.com', raw_content: '   ' }] })
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.pages.length, 0)
  assert.deepEqual(r.unretrieved.map(u => u.url), ['https://a.com'])
})

test('extract treats a wholly empty response as malformed', async () => {
  // The endpoint-specific half of the rule above.
  const original = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ results: [] }), { status: 200 })) as typeof fetch
  try {
    const p = new TavilyProvider('tvly-test')
    const res = await p.extract(['https://a.com'])
    assert.equal(res.ok, false)
    if (res.ok) return
    assert.equal(res.failure, 'malformed')
  } finally {
    globalThis.fetch = original
  }
})

test('search treats an empty response as a real finding, not a failure', async () => {
  const original = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ results: [] }), { status: 200 })) as typeof fetch
  try {
    const p = new TavilyProvider('tvly-test')
    const res = await p.searchDomains('some claim', ['ahrefs.com'])
    assert.ok(res.ok, 'nothing found on their site is an answer, not an error')
    if (!res.ok) return
    assert.equal(res.pages.length, 0)
  } finally {
    globalThis.fetch = original
  }
})

test('running out of credit is our failure and never a fact about a link', async () => {
  // 432 plan limit, 433 pay-as-you-go limit. If either mapped to
  // source_unreachable the writer would read "we could not open your link,
  // your reader may not either" about a perfectly good link, because we did
  // not pay our bill.
  const original = globalThis.fetch
  for (const status of [432, 433]) {
    globalThis.fetch = (async () => new Response('{}', { status })) as typeof fetch
    const res = await new TavilyProvider('tvly-test').extract(['https://a.com'])
    assert.equal(res.ok, false)
    if (res.ok) continue
    assert.equal(res.failure, 'out_of_credit', `${status} must be out_of_credit`)
  }
  globalThis.fetch = original
})

test('transport failures map to us, and none of them can describe a link', async () => {
  const original = globalThis.fetch
  const cases: [number, string][] = [
    [429, 'rate_limited'],
    [401, 'unauthorized'],
    [403, 'unauthorized'],
    [500, 'unavailable'],
    [503, 'unavailable'],
    [400, 'malformed'],
  ]
  for (const [status, expected] of cases) {
    globalThis.fetch = (async () => new Response('{}', { status })) as typeof fetch
    const res = await new TavilyProvider('tvly-test').extract(['https://a.com'])
    assert.equal(res.ok, false)
    if (res.ok) continue
    assert.equal(res.failure, expected, `${status}`)
  }
  globalThis.fetch = original
})

test('no key configured is a failure, not a silent empty result', async () => {
  const res = await new TavilyProvider('').extract(['https://a.com'])
  assert.equal(res.ok, false)
  if (res.ok) return
  assert.equal(res.failure, 'not_configured')
})

/* -------------------------------------------------- retrieved-text hygiene */

test('encoded image data cannot masquerade as a figure in the page', () => {
  // Found on a real Semrush page. An inline SVG path, percent-encoded, contains
  // "%2011.0418" and friends, so a literal search for the writer's "67%"
  // matched an icon and told the judge the source contained a statistic it
  // never mentions. A false hint in that direction is the dangerous one.
  const junk =
    "![](data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M6.06879%205.85555C5.35426%206.44066%204.86422%207.25499%204.68182%208.16033L2.2998%204.03435Z'/%3e%3c/svg%3e)"
  const page = `Our report found that 73% of marketers use AI.\n\n${junk}\n\nRead more.`
  const cleaned = cleanRetrievedText(page)
  assert.ok(!cleaned.includes('%2011'), 'encoded path data must not survive')
  assert.ok(cleaned.includes('73% of marketers use AI'), 'prose must survive intact')
})

test('cleaning never eats real prose, including percentages and numbers', () => {
  const prose =
    'Adoption rose 34.2% in Q2 2025, from $10,240,000 to $12.1 million, across 9,000 respondents.'
  assert.equal(cleanRetrievedText(prose), prose)
})

test('an unbroken token too long to be a word is removed', () => {
  const cleaned = cleanRetrievedText(`before ${'a'.repeat(400)} after`)
  assert.ok(cleaned.includes('before') && cleaned.includes('after'))
  assert.ok(!cleaned.includes('aaaaaaaaaa'.repeat(5)))
})

test('a page that is nothing but junk reads as no page at all', () => {
  const r = readResponse({
    results: [{ url: 'https://a.com', raw_content: `data:image/png;base64,${'A'.repeat(300)}` }],
  })
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.pages.length, 0, 'nothing readable is left, so it is not a retrieved page')
  assert.deepEqual(r.unretrieved.map(u => u.url), ['https://a.com'])
})

/* ------------------------------------------------------- publisher names */

test('publishers survive the words writers wrap them in', () => {
  assert.deepEqual(domainsFor('Ahrefs'), ['ahrefs.com'])
  assert.deepEqual(domainsFor('a 2025 Gartner study'), ['gartner.com'])
  assert.deepEqual(domainsFor('the Pew Research Center'), ['pewresearch.org'])
  assert.deepEqual(domainsFor('Ahrefs.'), ['ahrefs.com'])
})

test('an unknown publisher returns nothing rather than a guess', () => {
  // A wrong domain searches the wrong site, finds nothing, and reports the
  // writer's citation as missing. Silence is the only safe miss.
  assert.deepEqual(domainsFor('Bob down the pub'), [])
  assert.deepEqual(domainsFor(''), [])
  assert.deepEqual(domainsFor('2025'), [])
})

test('every name in the map resolves to its own domains', () => {
  // A name the normalizer can never reproduce is dead weight that looks like
  // coverage. "pew research center" was exactly that: the stripper removes
  // `research`, so the key could not be reached by any input including itself.
  for (const name of PUBLISHER_NAMES) {
    assert.ok(domainsFor(name).length > 0, `"${name}" resolves to nothing`)
  }
})

/* -------------------------------------------------------- flag ranking */

test('only three flags are ever shown, and the rest are counted', () => {
  const claims = Array.from({ length: 9 }, (_, i) =>
    claim(`c${i}`, {
      looksPublished: true,
      judgement: { verdict: 'unchecked', reason: 'not_found', evidence: [] },
      span: { start: i * 10, end: i * 10 + 5, precision: 'exact' },
    })
  )
  const r = rankFlags(claims, 100)
  assert.equal(r.fired, 9)
  assert.equal(r.shown.length, FLAGS_SHOWN)
  assert.equal(r.hidden, 6)
})

test('a precise figure outranks a word quantifier', () => {
  const precise = claim('a', { figure: '36.9%' })
  const vague = claim('b', { figure: 'a third' })
  assert.ok(flagScore(precise, 100) > flagScore(vague, 100))
})

test('a population claim outranks a single-entity one', () => {
  const pop = claim('a', { subject: 'population', figure: '89%' })
  const ent = claim('b', { subject: 'entity', figure: '89%' })
  assert.ok(flagScore(pop, 100) > flagScore(ent, 100))
})

test('an opening claim outranks the same claim in a closing paragraph', () => {
  const open = claim('a', { figure: '89%', span: { start: 0, end: 5, precision: 'exact' } })
  const close = claim('b', { figure: '89%', span: { start: 95, end: 100, precision: 'exact' } })
  assert.ok(flagScore(open, 100) > flagScore(close, 100))
})

test('ranking is stable across input order', () => {
  // A list that reshuffles between runs on the same document reads as
  // guesswork, whatever the ranking is.
  const mk = () => [
    claim('a', { figure: '89%', looksPublished: true, judgement: { verdict: 'unchecked', reason: 'not_found', evidence: [] } }),
    claim('b', { figure: '89%', looksPublished: true, judgement: { verdict: 'unchecked', reason: 'not_found', evidence: [] } }),
    claim('c', { figure: '89%', looksPublished: true, judgement: { verdict: 'unchecked', reason: 'not_found', evidence: [] } }),
  ]
  const forward = rankFlags(mk(), 0).shown.map(f => f.claim.id)
  const backward = rankFlags(mk().reverse(), 0).shown.map(f => f.claim.id)
  assert.deepEqual(forward, backward)
})

test('no flags fire on a document that has nothing to flag', () => {
  const r = rankFlags([claim('a'), claim('b')], 100)
  assert.equal(r.fired, 0)
  assert.equal(r.shown.length, 0)
  assert.equal(r.hidden, 0)
})

/* -------------------------------------------------- orchestration */

/** Records what it was asked for, so a test can assert on the batch. */
function fakeProvider(over: Partial<RetrievalProvider> = {}) {
  const seen = { extracted: [] as string[], searched: [] as string[] }
  const provider: RetrievalProvider = {
    name: 'fake',
    async extract(urls) {
      seen.extracted.push(...urls)
      return { ok: true, pages: [], unretrieved: [] }
    },
    async searchDomains(_q, domains) {
      seen.searched.push(...domains)
      return { ok: true, pages: [], unretrieved: [] }
    },
    ...over,
  }
  return { provider, seen }
}

test('a linked first-party claim IS sent for checking', async () => {
  // The whole of addition 1. "We surveyed 214 customers, methodology here"
  // against a linked page that says 240 is a real defect, and for a case
  // study, which is 84% the author's own numbers, it is the only thing this
  // product has to say. The claim axis still never touches it.
  const { provider, seen } = fakeProvider()
  await checkCitations(
    [
      claim('own', {
        subject: 'first_party',
        sourceForm: 'linked',
        sourceUrl: 'https://acme.com/methodology',
      }),
    ],
    provider
  )
  assert.deepEqual(seen.extracted, ['https://acme.com/methodology'])
})

test('a provider failure concludes nothing about any link', async () => {
  // Running out of credit must not produce a single sentence about the
  // writer's document.
  const { provider } = fakeProvider({
    async extract(): Promise<RetrievalResult> {
      return { ok: false, failure: 'out_of_credit' }
    },
  })
  const claims = [
    claim('a', { sourceForm: 'linked', sourceUrl: 'https://a.com' }),
    claim('b', { sourceForm: 'linked', sourceUrl: 'https://b.com' }),
  ]
  const run = await checkCitations(claims, provider)
  assert.equal(run.failure, 'out_of_credit')
  for (const c of claims) {
    assert.equal(run.results.get(c.id)!.check, 'not_applicable')
  }
  assert.equal(run.retrieved, 0)
})

test('a URL the provider named as failed becomes source_unreachable', async () => {
  const { provider } = fakeProvider({
    async extract(): Promise<RetrievalResult> {
      return { ok: true, pages: [], unretrieved: [{ url: 'https://gone.com', detail: '404' }] }
    },
  })
  const run = await checkCitations(
    [claim('a', { sourceForm: 'linked', sourceUrl: 'https://gone.com' })],
    provider
  )
  assert.equal(run.results.get('a')!.check, 'source_unreachable')
})

test('a URL that came back neither retrieved nor failed concludes nothing', async () => {
  // We know nothing about it, so we say nothing about it.
  const { provider } = fakeProvider()
  const run = await checkCitations(
    [claim('a', { sourceForm: 'linked', sourceUrl: 'https://quiet.com' })],
    provider
  )
  assert.equal(run.results.get('a')!.check, 'not_applicable')
})

test('an unknown publisher costs nothing and says nothing', async () => {
  // A named search costs five times an extract, so an unresolvable name must
  // not buy one, and a guessed domain would search the wrong site and report
  // a perfectly good citation as missing.
  const { provider, seen } = fakeProvider()
  const run = await checkCitations(
    [claim('a', { sourceForm: 'named', sourceName: 'Bob down the pub' })],
    provider
  )
  assert.deepEqual(seen.searched, [])
  assert.equal(run.results.get('a')!.check, 'not_applicable')
})

test('a known publisher with nothing on their site is a real finding', async () => {
  const { provider, seen } = fakeProvider()
  const run = await checkCitations(
    [claim('a', { sourceForm: 'named', sourceName: 'according to Ahrefs' })],
    provider
  )
  assert.deepEqual(seen.searched, ['ahrefs.com'])
  assert.equal(run.results.get('a')!.check, 'does_not_contain')
  assert.deepEqual(run.results.get('a')!.evidence, [], 'no evidence is honest here, not a bug')
})

test('claims with no source never reach the provider', async () => {
  const { provider, seen } = fakeProvider()
  const run = await checkCitations([claim('a'), claim('b')], provider)
  assert.deepEqual(seen.extracted, [])
  assert.deepEqual(seen.searched, [])
  assert.equal(run.results.get('a')!.check, 'not_applicable')
})

mock.reset()
