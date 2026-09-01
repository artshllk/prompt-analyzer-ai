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
import { findQuote, checkCitations, partitionForStream, streamCitations } from './citation'
import { readResponse, TavilyProvider, cleanRetrievedText } from './providers/tavily'
import { isPermanent, type ProviderFailure } from './providers/types'
import { domainsFor, PUBLISHER_NAMES } from './publishers'
import { isLiveSource, LIVE_SOURCE_HOSTS } from './live-sources'
import { meter, formatMeter } from './providers/meter'
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

test('a consent wall is unreachable, not evidence the claim is missing', async () => {
  // Two SproutSocial flags in the audit came off pages whose entire retrieved
  // text was 649 and 913 characters. The judge honestly said the claim was not
  // in them, and the writer would have been told their link was wrong on the
  // strength of a cookie banner.
  const { provider } = fakeProvider({
    async extract(): Promise<RetrievalResult> {
      return {
        ok: true,
        pages: [{
          url: 'https://a.com', title: 'A',
          content: 'We value your privacy. Accept all cookies. Manage preferences.',
          retrievedAt: '2026-09-01T00:00:00.000Z',
        }],
        unretrieved: [],
      }
    },
  })
  const run = await checkCitations(
    [claim('a', { sourceForm: 'linked', sourceUrl: 'https://a.com', figure: '42%' })],
    provider
  )
  assert.equal(run.results.get('a')!.check, 'source_unreachable')
  assert.notEqual(run.results.get('a')!.check, 'does_not_contain')
})

/* ------------------------------------------------------- live sources */

test('a live dashboard is recognised, and an article about one is not', () => {
  assert.ok(isLiveSource('https://gs.statcounter.com/search-engine-market-share'))
  assert.ok(isLiveSource('https://statcounter.com/anything'))
  assert.ok(isLiveSource('https://www.similarweb.com/website/example.com/'))
  // Matching the host, never a substring of the whole URL. This one is an
  // ordinary article that happens to mention a dashboard.
  assert.ok(!isLiveSource('https://example.com/why-statcounter-is-wrong'))
  assert.ok(!isLiveSource('https://ahrefs.com/blog/seo-statistics/'))
  assert.ok(!isLiveSource('not a url'))
})

test('a path-scoped live entry does not swallow the whole domain', () => {
  // ahrefs.com/websites is a live tool. ahrefs.com/blog is not, and blocking
  // it would blind us to a publisher we check constantly.
  assert.ok(isLiveSource('https://ahrefs.com/websites/example.com'))
  assert.ok(!isLiveSource('https://ahrefs.com/blog/seo-statistics/'))
  assert.ok(isLiveSource('https://www.semrush.com/trending/'))
  assert.ok(!isLiveSource('https://www.semrush.com/blog/content-marketing-statistics/'))
})

test('every live-source entry is a bare host or host with a path', () => {
  for (const h of LIVE_SOURCE_HOSTS) {
    assert.ok(!h.includes('://'), `${h} must not carry a scheme`)
    assert.ok(!h.startsWith('www.'), `${h} must not carry www`)
    assert.ok(isLiveSource(`https://${h}`), `${h} does not match itself`)
  }
})

test('a live source is never fetched and never called a defect', async () => {
  // Ahrefs cite StatCounter for a market-share figure. StatCounter shows only
  // today, so the number moved and the citation check called it wrong. The
  // article was right when it was written, and this is our false accusation
  // to avoid, not their error.
  const { provider, seen } = fakeProvider()
  const run = await checkCitations(
    [claim('a', { sourceForm: 'linked', sourceUrl: 'https://gs.statcounter.com/search-engine-market-share' })],
    provider
  )
  assert.deepEqual(seen.extracted, [], 'a live source must not cost a credit')
  assert.equal(run.results.get('a')!.check, 'not_applicable')
  assert.equal(run.claimReasons.get('a'), 'live_source')
  assert.match(run.results.get('a')!.note ?? '', /only shows current data/)
})

/* ------------------------------------------------------------- the meter */

test('we count credits ourselves, by their billing rules', () => {
  meter.reset()
  meter.extract(5, 0)
  assert.equal(meter.read().credits, 1, '5 successful extractions is 1 credit')
  meter.extract(1, 4)
  assert.equal(meter.read().credits, 2, 'failures are free, and the request rounds up')
  meter.search()
  assert.equal(meter.read().credits, 3, 'a basic search is 1 credit')
  meter.extract(0, 3)
  assert.equal(meter.read().credits, 3, 'a request that retrieved nothing costs nothing')
  assert.match(formatMeter(), /counted by us not by their meter/)
  meter.reset()
  assert.equal(meter.read().credits, 0)
})

test('the meter rounds up per request, never across them', () => {
  // Three requests of one URL each is three credits, not one. Rounding the
  // other way would understate spend, and a guard should never be wrong in
  // the cheap-looking direction.
  meter.reset()
  for (let i = 0; i < 3; i++) meter.extract(1, 0)
  assert.equal(meter.read().credits, 3)
  meter.reset()
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

/* --------------------------------------------------------- streaming */

test('refusals never stream individually, they collapse into one line', async () => {
  // Every refusal resolves in zero milliseconds, so emitting them first would
  // wash amber across half the document in the first frame. A reader would
  // learn "this tool cannot check anything" before a single real answer
  // arrived, which is the opposite of true.
  const claims = [
    claim('f', { sourceForm: 'linked', sourceUrl: 'https://ahrefs.com/x' }),
    claim('p', { sourceForm: 'linked', sourceUrl: 'https://www.statista.com/y' }),
    claim('l', { sourceForm: 'linked', sourceUrl: 'https://gs.statcounter.com/z' }),
    claim('n'),
  ]
  const { provider } = fakeProvider({
    async extract(urls): Promise<RetrievalResult> {
      return { ok: true, pages: [], unretrieved: urls.map(u => ({ url: u, detail: '404' })) }
    },
  })
  const types: string[] = []
  let counts: Record<string, number> | undefined
  for await (const e of streamCitations(claims, provider)) {
    types.push(e.type)
    if (e.type === 'refusals') counts = e.counts as unknown as Record<string, number>
  }
  assert.equal(types.indexOf('refusals'), types.length - 1, 'refusals must be the LAST event')
  assert.equal(types.filter(t => t === 'refusals').length, 1, 'one line, not one per claim')
  assert.deepEqual(counts, { paywalled: 1, dead: 0, live: 1, noSource: 1 })
})

test('a known paywalled host is refused before it costs a credit', async () => {
  const { provider, seen } = fakeProvider()
  const { fetchable, refused } = partitionForStream([
    claim('p', { sourceForm: 'linked', sourceUrl: 'https://www.statista.com/statistics/1/' }),
  ])
  assert.equal(fetchable.length, 0, 'must never be fetched')
  assert.equal(refused.get('p')!.unreadable, 'paywalled')
  for await (const _ of streamCitations([claim('p', { sourceForm: 'linked', sourceUrl: 'https://www.statista.com/statistics/1/' })], provider)) void _
  assert.deepEqual(seen.extracted, [])
})

test('fetchable claims are opened in document order', async () => {
  const claims = ['c', 'a', 'b'].map(id =>
    claim(id, { sourceForm: 'linked', sourceUrl: `https://ahrefs.com/${id}` })
  )
  const { provider } = fakeProvider()
  const opened: string[] = []
  for await (const e of streamCitations(claims, provider)) {
    if (e.type === 'opening') opened.push(e.id)
  }
  assert.deepEqual(opened, ['c', 'a', 'b'], 'the order they appear in the document')
})

test('a provider failure ends the stream and says so', async () => {
  const { provider } = fakeProvider({
    async extract(): Promise<RetrievalResult> {
      return { ok: false, failure: 'out_of_credit' }
    },
  })
  const types: string[] = []
  for await (const e of streamCitations(
    [claim('a', { sourceForm: 'linked', sourceUrl: 'https://ahrefs.com/x' })],
    provider
  )) types.push(e.type)
  assert.ok(types.includes('failed'))
  assert.ok(!types.includes('resolved'), 'nothing is concluded after a provider failure')
})

mock.reset()
