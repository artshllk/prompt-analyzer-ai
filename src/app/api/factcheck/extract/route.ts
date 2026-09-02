import { NextRequest, NextResponse } from 'next/server'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { resolveCaller } from '@/lib/auth/caller'
import { consumeAnonRun } from '@/lib/db/anon-budget'
import { extractClaims } from '@/lib/factcheck/extract'
import { rankFlags } from '@/lib/factcheck/flags'
import { checkCitations } from '@/lib/factcheck/citation'
import { meter, formatMeter } from '@/lib/factcheck/providers/meter'
import { MAX_DOC_CHARS } from '@/lib/factcheck/types'
import { visibleLength } from '@/lib/factcheck/paste'

/**
 * Find the checkable claims in a pasted document.
 *
 * EXTRACTION ONLY. Nothing here touches the web and nothing returns a verdict:
 * every claim comes back `unverifiable` with reason `not_checked`, which is
 * the honest state for a document nobody has checked yet.
 *
 * That is a deliberate shipping boundary, not an unfinished feature. "Here are
 * the fourteen claims in this document someone could challenge you on" is
 * useful on its own, it costs one model call, and it can be shipped and shown
 * to people before a single search API contract exists.
 *
 * The guard order below is the design. Each check is cheaper than the one
 * after it, and the two free ones run before anything can be spent.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  const who = await resolveCaller(req)

  // We know who they are and cannot read what they are entitled to. Refusing
  // is the point: guessing "free" is how a database outage turns into a bill.
  // Never a quota error, because this is our failure and not their limit.
  if (who.state === 'unknown') {
    return json({ error: 'identity_unavailable' }, 503)
  }
  const auth = who.state === 'known' ? who.caller : null

  // 1. Per-IP burst. In memory, free, stops one impatient person.
  if (!auth) {
    const limit = take(`factcheck:anon:${getClientIp(req)}`, ANON_LIMIT)
    if (!limit.allowed) {
      return json({ error: 'rate_limited', retryAfterMs: limit.retryAfterMs }, 429)
    }
  } else {
    const burst = take(
      `factcheck:user:${auth.userId}`,
      auth.tier === 'pro' ? PRO_USER_LIMIT : USER_LIMIT
    )
    if (!burst.allowed) {
      return json({ error: 'rate_limited', retryAfterMs: burst.retryAfterMs }, 429)
    }
  }

  let body: { text?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_body' }, 400)
  }

  const text = typeof body.text === 'string' ? body.text : ''

  // 2. Input length. Free, deterministic, and BEFORE any spend. Cost is
  //    roughly linear in document length, which makes this the
  //    highest-leverage guard in the whole system.
  if (!text.trim()) return json({ error: 'empty' }, 400)
  // Same measure as the counter under the box. See extract.ts.
  const visible = visibleLength(text)
  if (visible > MAX_DOC_CHARS) {
    return json({ error: 'too_long', limit: MAX_DOC_CHARS, got: visible }, 400)
  }

  // 3. The daily ceiling, on the factcheck bucket so a busy day on the frozen
  //    prompt improver cannot take this offline and vice versa. Fails closed.
  if (!auth) {
    const budget = await consumeAnonRun('factcheck')
    if (!budget.allowed) {
      return json({ error: 'daily_capacity', resetAt: budget.resetAt }, 429)
    }
  }

  /**
   * The guard. Every stage inside returns a value rather than throwing, but
   * nothing handled a throw, and an exception escaping here becomes an
   * unhandled 500 with a stack trace instead of a result. Degrade, do not
   * fail: the route already knows how to say "unavailable" politely.
   */
  let result
  try {
    result = await extractClaims(text)
  } catch (err) {
    console.error('[factcheck] extract threw, degrading:', err)
    return json({ error: 'unavailable' }, 503)
  }

  // Narrow on the SHAPE, not on a list of names. A new ExtractError should
  // never be able to fall through here typed as a result.
  if (typeof result === 'string') {
    if (result === 'too_long') return json({ error: result, limit: MAX_DOC_CHARS }, 400)
    return json({ error: result }, result === 'unavailable' ? 503 : 400)
  }

  // The density band is logged because it is the number that decides how much
  // this tool can do for a document, and the distribution of bands across real
  // traffic is the thing worth knowing before 4b picks its search budget.
  /**
   * The citation axis.
   *
   * INERT WITHOUT A KEY. With no TAVILY_API_KEY the provider returns
   * `not_configured`, every claim keeps `not_applicable`, and the response is
   * byte for byte what it was before this existed. That is the correct
   * degradation: a missing credential must never produce a sentence about
   * somebody's link.
   *
   * Wrapped in its own catch for the same reason the audit stage is in the
   * prompt engine. The claims are what the user came for. Losing them because
   * a retrieval threw would trade the whole result for a panel, and a document
   * with unchecked citations is a fine outcome while a 503 is not.
   */
  let citationFailure: string | undefined
  const spentBefore = meter.read().credits
  try {
    const run = await checkCitations(result.claims)
    for (const claim of result.claims) {
      const found = run.results.get(claim.id)
      if (found) claim.citation = found
      // The citation axis never writes to the claim axis itself. It reports
      // what it learned and the reason is applied here, and only ever onto a
      // claim that is still unchecked.
      const reason = run.claimReasons.get(claim.id)
      if (reason && claim.judgement.verdict === 'unchecked') {
        claim.judgement = { ...claim.judgement, reason }
      }
    }
    citationFailure = run.failure
    if (run.failure) {
      console.error(`[factcheck] citation axis unavailable: ${run.failure}`)
    }
  } catch (err) {
    console.error('[factcheck] citation axis threw, shipping claims without it:', err)
    citationFailure = 'unavailable'
  }

  const d = result.density
  // flags= is instrumentation, not a feature. If the median across real
  // documents sits above three or four the flag is firing too often to be a
  // to-do list, and the answer is to rank harder or drop it. That is a number
  // worth having rather than guessing at.
  const flags = rankFlags(result.claims, result.text.length)
  console.log(
    `[factcheck] claims=${result.claims.length}/${result.foundCount} ` +
      `unanchored=${result.unanchoredCount} chars=${text.length} ` +
      `band=${d.band} linked=${d.linked} named=${d.named} none=${d.none} ` +
      `firstParty=${d.firstParty} flags=${flags.fired} ` +
      `citations=${citationFailure ?? 'ok'} ` +
      `credits=${meter.read().credits - spentBefore} ` +
      `auth=${auth ? auth.tier : 'anon'} ts=${new Date().toISOString()}`
  )

  return json(
    {
      text: result.text,
      claims: result.claims,
      density: result.density,
      truncated: result.truncated,
      foundCount: result.foundCount,
      // Told plainly rather than hidden. A run where we could not check the
      // citations is a different thing from a run where every citation was
      // fine, and conflating them is how a report stops meaning anything.
      citationsChecked: !citationFailure,
      anon: !auth,
    },
    200
  )
}
