import { NextRequest, NextResponse } from 'next/server'
import { analyzePrompt } from '@/lib/engine'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { resolveCaller } from '@/lib/auth/caller'
import { consumeAnonRun, anonBudgetExhausted, budgetActionFor } from '@/lib/db/anon-budget'
import { recordSession } from '@/lib/db/sessions'
import { createServiceClient } from '@/lib/supabase/server'
import { decideUsage, windowStart, USAGE_WINDOW_HOURS, USAGE_DAILY_LIMIT } from '@/lib/limits'
import type { Tone } from '@/types/database'
import type { QAPair } from '@/types'

interface AnonAnalyzeBody {
  prompt: string
  tone: Tone
  priorAnswers?: QAPair[]
  /** Where the call came from. Defaults to 'web' (homepage demo).
   *  The browser extension sends 'extension'. Used only for analytics. */
  source?: string
}

// Permissive CORS - this endpoint is public, no-auth, and per-IP rate
// limited. Allowing any origin lets the browser extension call it directly.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function withCors(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v)
  return res
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

/**
 * Stateless analyze endpoint. Used by both the homepage demo and the
 * browser extension. Optional Bearer-token auth turns it into the Pro
 * path:
 *   - No token  → per-IP rate limit (ANON_LIMIT), no DB write
 *   - Token + free tier → rolling quota (5 / 48h), DB usage write
 *   - Token + pro tier  → unlimited, DB usage write (for analytics)
 */
export async function POST(req: NextRequest) {
  const who = await resolveCaller(req)

  /**
   * We know who they are and cannot read what they are entitled to.
   *
   * Refusing is the whole point of the three-state result. Guessing "free"
   * here is what turned a database outage into unlimited billed calls, and it
   * must never be reported as a quota problem: this is our failure, not their
   * limit.
   */
  if (who.state === 'unknown') {
    return withCors(NextResponse.json(
      { error: 'identity_unavailable' },
      { status: 503, headers: { 'Retry-After': '30' } }
    ))
  }
  const auth = who.state === 'known' ? who.caller : null

  // Anonymous: IP-throttle. Token-bearing: per-user burst limit, same
  // tiers as the website route (10/min free, 30/min pro) so the
  // extension can't be used to sidestep the site's rate limiting.
  if (!auth) {
    const ip = getClientIp(req)
    const limit = take(`anon:${ip}`, ANON_LIMIT)
    if (!limit.allowed) {
      return withCors(NextResponse.json(
        { error: 'rate_limited', retryAfterMs: limit.retryAfterMs },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      ))
    }
  } else {
    const burst = take(`user:${auth.userId}`, auth.tier === 'pro' ? PRO_USER_LIMIT : USER_LIMIT)
    if (!burst.allowed) {
      return withCors(NextResponse.json(
        { error: 'rate_limited', retryAfterMs: burst.retryAfterMs },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(burst.retryAfterMs / 1000)) } }
      ))
    }
  }

  let body: AnonAnalyzeBody
  try {
    body = await req.json()
  } catch {
    return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
  }

  const { prompt, tone, priorAnswers = [] } = body
  const source = body.source === 'extension' ? 'extension' : 'web'

  if (!prompt?.trim()) {
    return withCors(NextResponse.json({ error: 'prompt_required' }, { status: 400 }))
  }
  if (prompt.length > 4000) {
    return withCors(NextResponse.json({ error: 'prompt_too_long' }, { status: 400 }))
  }

  /**
   * The global anonymous ceiling.
   *
   * The per-IP bucket above is in-memory, per-instance and reset by every
   * deploy, so it stops one impatient person and not a script with a proxy
   * list. This tool is in the hero of a public page, which makes that the
   * difference between a rate limit and a bill.
   *
   * ONE USER ACTION, ONE UNIT. This used to run on every call with no turn
   * gate, while the quota check below was correctly gated on the first turn.
   * So a prompt that asked a clarifying question cost two units: one for the
   * question, one for the answer. That halved the real ceiling, and at a cap
   * of 1 it meant no prompt that asked anything could ever complete, because
   * turn 2 was always over.
   *
   * Later turns still have to respect the ceiling or this becomes the way
   * around it, so they CHECK without incrementing. Same split as the fork
   * route, for the same reason.
   *
   * It also moved below body validation. It used to run first, so a garbage
   * request spent a unit of the day's budget and then got a 400 for its
   * trouble.
   */
  const budgetAction = budgetActionFor({ signedIn: !!auth, turn: priorAnswers.length })

  if (budgetAction === 'consume') {
    const budget = await consumeAnonRun('improver')
    if (!budget.allowed) {
      return withCors(NextResponse.json(
        { error: 'daily_capacity', resetAt: budget.resetAt },
        { status: 429, headers: { 'Retry-After': '3600' } }
      ))
    }
  } else if (budgetAction === 'check' && (await anonBudgetExhausted('improver'))) {
    return withCors(NextResponse.json(
      { error: 'daily_capacity' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    ))
  }

  /**
   * Free-tier quota, on the same policy the extension uses.
   *
   * This enforced REWRITE_FREE_LIMIT, 5 per 48 hours, which limits.ts marks
   * @deprecated. The live policy is USAGE_DAILY_LIMIT, 10 per rolling 24
   * hours, and that is what the pricing page and the FAQ both promise. The
   * two routes disagreeing did not show up while this one was unreachable
   * for signed-in web users. Now that a cookie session is recognised, a web
   * visitor would have hit a limit half the size of the one they were sold.
   *
   * Pro bypasses entirely. A later turn in the same session does not
   * recount: the user already spent a credit on that analysis.
   */
  if (auth && auth.tier === 'free' && priorAnswers.length === 0) {
    const supabase = await createServiceClient()

    const { data: rows, count, error: usageErr } = await supabase
      .from('usage_events')
      .select('created_at', { count: 'exact' })
      .eq('user_id', auth.userId)
      .eq('event_type', 'prompt_analyzed')
      .gte('created_at', windowStart(USAGE_WINDOW_HOURS))
      .order('created_at', { ascending: true })
      .limit(1)

    // Fail open, but shout. Locking a signed-in user out over our own
    // infrastructure error is worse than one extra free rewrite, and a
    // silently disabled gate is worse than either.
    if (usageErr) {
      console.error(
        `[anon-analyze] USAGE GATE DISABLED - usage_events read failed: ${usageErr.message}`
      )
    }

    const decision = decideUsage(count ?? 0, rows?.[0]?.created_at ?? null)
    if (!decision.allow) {
      return withCors(NextResponse.json(
        {
          error: 'rate_limited_quota',
          // A wall with a clock on it is a wait; without one it is a dead end.
          resetAt: decision.retryAt,
          dailyLimit: USAGE_DAILY_LIMIT,
        },
        { status: 402 }
      ))
    }
  }

  // Analytics-only log. One structured line per analyze so we can tell
  // extension/web and authed/anon usage apart in Vercel logs. No prompt
  // text, no IP - when authed we have the user_id, otherwise a coarse bucket.
  const ip = auth ? null : getClientIp(req)
  const ipBucket = ip ? ip.split('.').slice(0, 3).join('.') + '.x' : null
  console.log(
    `[anon-analyze] source=${source} turn=${priorAnswers.length} ` +
    `auth=${auth ? `${auth.tier}:${auth.userId.slice(0, 8)}` : 'anon'} ` +
    `${ipBucket ? `ipBucket=${ipBucket} ` : ''}` +
    `ts=${new Date().toISOString()}`
  )

  let result = await analyzePrompt({ prompt, tone, priorAnswers, pro: auth?.tier === 'pro' })
  if (!result) {
    return withCors(NextResponse.json({ error: 'ai_unavailable' }, { status: 503 }))
  }

  // The extension predates the already_good and no_task result types and
  // switches on `type`, so give it the same information in the improved shape
  // it understands. Web clients get the honest type. Both cases leave the
  // user's prompt exactly as they wrote it.
  if ((result.type === 'already_good' || result.type === 'no_task') && source === 'extension') {
    const explanation =
      result.type === 'already_good'
        ? `${result.message} ${result.tweaks.join(' ')}`.trim()
        : result.message
    result = {
      type: 'improved',
      improvedPrompt: prompt.trim(),
      explanation,
      improvementTags: [],
      audit: result.audit,
    }
  }

  // Record usage for signed-in users, fire-and-forget. Only on the first
  // turn of a session - clarification rounds belong to the same analysis.
  // An already-good verdict is free: no rewrite was produced, and charging
  // for "your prompt is fine" would teach users not to trust it. Same for
  // no_task, where there was nothing to rewrite in the first place.
  const producedNothing = result.type === 'already_good' || result.type === 'no_task'
  if (auth && priorAnswers.length === 0 && !producedNothing) {
    const supabase = await createServiceClient()
    supabase
      .from('usage_events')
      .insert({ user_id: auth.userId, event_type: 'prompt_analyzed' })
      .then(() => {})
  }

  /**
   * Persist the session so it reaches History.
   *
   * This route never wrote one. recordSession() was called from the sharpen
   * route only, so History was an extension-only record and every rewrite a
   * signed-in visitor made on the website vanished when they closed the tab.
   * They were anonymous to this route anyway, so nobody noticed.
   *
   * Written on the turn that actually produces a rewrite, so a clarifying
   * question followed by an answer is one row and not two. The reading they
   * picked is stored as the choice, the same shape the extension records.
   *
   * Awaited so the row exists before the response returns. On a serverless
   * platform a fire-and-forget write can be cut off when the function
   * freezes, and a missing history row is a support ticket nobody can debug.
   * recordSession swallows its own errors, so this cannot break a rewrite.
   */
  if (auth && result.type === 'improved') {
    await recordSession({
      userId: auth.userId,
      originalPrompt: prompt,
      finalPrompt: result.improvedPrompt,
      tone,
      choice: priorAnswers[0]?.answer,
      source: 'web',
    })
  }

  return withCors(NextResponse.json({
    ...result,
    anon: !auth,
    tier: auth?.tier ?? 'anon',
  }))
}
