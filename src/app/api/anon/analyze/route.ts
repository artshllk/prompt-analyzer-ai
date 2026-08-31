import { NextRequest, NextResponse } from 'next/server'
import { analyzePrompt } from '@/lib/engine'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { validateToken, extractBearerToken } from '@/lib/db/api-tokens'
import { consumeAnonRun } from '@/lib/db/anon-budget'
import { createServiceClient } from '@/lib/supabase/server'
import { REWRITE_FREE_LIMIT, REWRITE_WINDOW_HOURS, windowStart } from '@/lib/limits'
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
  const token = extractBearerToken(req.headers.get('authorization'))
  const auth = token ? await validateToken(token) : null

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

    /**
     * The global ceiling. The per-IP bucket above is in-memory, per-instance,
     * and reset by every deploy, so it stops one impatient person and not a
     * script with a proxy list. This tool is in the hero of a public page
     * now, which makes that the difference between a rate limit and a bill.
     *
     * Consumed only on the anonymous path. Signed-in users have their own
     * quotas and their own accountability, and are never blocked by this.
     */
    const budget = await consumeAnonRun()
    if (!budget.allowed) {
      return withCors(NextResponse.json(
        { error: 'daily_capacity', resetAt: budget.resetAt },
        { status: 429, headers: { 'Retry-After': '3600' } }
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

  // Rolling-window quota for signed-in free users on the extension:
  // 5 rewrites per 48h. Pro users bypass entirely. New turns in an
  // in-progress session (priorAnswers non-empty) don't recount - they're
  // part of the same analysis the user already spent a credit on.
  if (auth && auth.tier === 'free' && priorAnswers.length === 0) {
    const supabase = await createServiceClient()

    const { count } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .eq('event_type', 'prompt_analyzed')
      .gte('created_at', windowStart(REWRITE_WINDOW_HOURS))

    if ((count ?? 0) >= REWRITE_FREE_LIMIT) {
      return withCors(NextResponse.json(
        { error: 'rate_limited_quota', used: count, limit: REWRITE_FREE_LIMIT, windowHours: REWRITE_WINDOW_HOURS },
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

  return withCors(NextResponse.json({
    ...result,
    anon: !auth,
    tier: auth?.tier ?? 'anon',
  }))
}
