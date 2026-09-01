import { NextRequest, NextResponse } from 'next/server'
import { quickFork } from '@/lib/engine/quick-fork'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { resolveCaller } from '@/lib/auth/caller'
import { anonBudgetExhausted } from '@/lib/db/anon-budget'

/**
 * Quick fork check: is this prompt genuinely ambiguous, and if so, what are
 * the 2-3 readings?
 *
 * The extension BLOCKS on this before it starts the rewrite: an ambiguous
 * prompt has to produce its question before anything is written to the box,
 * because a question that arrives after the answer is worthless. The cost is
 * that every prompt waits for this call, including the majority that turn out
 * not to be ambiguous.
 *
 * This comment used to say the two ran in parallel. They did once; the
 * ask-first change made it serial and the comment was not updated, which is
 * how the added latency went unnoticed.
 *
 * Costs no quota: this is a decision, not a rewrite. Rate-limited only.
 */

interface ForkBody {
  prompt: string
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function corsJson(body: unknown, status: number): NextResponse {
  const res = NextResponse.json(body, { status })
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v)
  return res
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  const who = await resolveCaller(req)
  if (who.state === 'unknown') {
    return corsJson({ error: 'identity_unavailable' }, 503)
  }
  const auth = who.state === 'known' ? who.caller : null

  // This endpoint gets its OWN bucket namespace, and that is the whole point.
  //
  // One improve in the extension is two requests: this fork check, then
  // /anon/sharpen. Both used the same `anon:<ip>` bucket, so a single improve
  // spent two of the six tokens an anonymous user gets per hour. Six tokens
  // therefore bought THREE improves, against the five free tries the extension
  // promises and the popup displays. The fourth improve in a sitting returned a
  // 429, which reads as "this is broken" at the exact moment a new user is
  // deciding whether it works.
  //
  // Worse, the buckets are in-memory per serverless instance, so which improve
  // failed depended on which instance answered: intermittent, not reproducible.
  //
  // Separate namespaces mean one improve costs one token from each of two
  // buckets rather than two from one. An anonymous user gets six improves an
  // hour, which covers the five free tries with room to spare, and both
  // endpoints keep their own abuse ceiling.
  if (!auth) {
    const ip = getClientIp(req)
    const limit = take(`fork:anon:${ip}`, ANON_LIMIT)
    if (!limit.allowed) return corsJson({ error: 'rate_limited' }, 429)

    // Checked, not consumed. This call runs BEFORE the rewrite it belongs
    // to, so counting it would bill one user action twice and halve the real
    // ceiling. It still has to stop once the ceiling is hit, or this endpoint
    // becomes the way around it.
    if (await anonBudgetExhausted('improver')) {
      return corsJson({ error: 'daily_capacity' }, 429)
    }
  } else {
    const burst = take(
      `fork:user:${auth.userId}`,
      auth.tier === 'pro' ? PRO_USER_LIMIT : USER_LIMIT
    )
    if (!burst.allowed) return corsJson({ error: 'rate_limited' }, 429)
  }

  let body: ForkBody
  try {
    body = await req.json()
  } catch {
    return corsJson({ error: 'invalid_body' }, 400)
  }

  const prompt = body.prompt?.trim()
  if (!prompt) return corsJson({ error: 'prompt_required' }, 400)
  if (prompt.length > 4000) return corsJson({ error: 'prompt_too_long' }, 400)

  const fork = await quickFork(prompt)
  // A failure here is not user-facing: no question simply means no chips.
  return corsJson(fork ?? { question: '', options: [] }, 200)
}
