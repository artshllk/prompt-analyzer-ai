import { NextRequest, NextResponse } from 'next/server'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { resolveCaller } from '@/lib/auth/caller'
import { consumeAnonRun } from '@/lib/db/anon-budget'
import { extractClaims } from '@/lib/factcheck/extract'
import { MAX_DOC_CHARS } from '@/lib/factcheck/types'

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
  if (text.length > MAX_DOC_CHARS) {
    return json({ error: 'too_long', limit: MAX_DOC_CHARS, got: text.length }, 400)
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

  if (result === 'too_short') return json({ error: 'too_short' }, 400)
  if (result === 'too_long') return json({ error: 'too_long', limit: MAX_DOC_CHARS }, 400)
  if (result === 'unavailable') return json({ error: 'unavailable' }, 503)

  // The density band is logged because it is the number that decides how much
  // this tool can do for a document, and the distribution of bands across real
  // traffic is the thing worth knowing before 4b picks its search budget.
  const d = result.density
  console.log(
    `[factcheck] claims=${result.claims.length}/${result.foundCount} ` +
      `unanchored=${result.unanchoredCount} chars=${text.length} ` +
      `band=${d.band} linked=${d.linked} named=${d.named} none=${d.none} ` +
      `firstParty=${d.firstParty} auth=${auth ? auth.tier : 'anon'} ` +
      `ts=${new Date().toISOString()}`
  )

  return json(
    {
      text: result.text,
      claims: result.claims,
      density: result.density,
      truncated: result.truncated,
      foundCount: result.foundCount,
      anon: !auth,
    },
    200
  )
}
