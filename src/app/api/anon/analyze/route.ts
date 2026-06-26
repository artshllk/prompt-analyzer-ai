import { NextRequest, NextResponse } from 'next/server'
import { analyzePrompt } from '@/lib/engine'
import { take, getClientIp, ANON_LIMIT } from '@/lib/rate-limit'
import { validateToken, extractBearerToken } from '@/lib/db/api-tokens'
import { createServiceClient } from '@/lib/supabase/server'
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
 *   - Token + free tier → per-user monthly quota (25), DB usage write
 *   - Token + pro tier  → unlimited, DB usage write (for analytics)
 */
export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  const auth = token ? await validateToken(token) : null

  // Anonymous: IP-throttle. Token-bearing: skip IP throttle entirely.
  if (!auth) {
    const ip = getClientIp(req)
    const limit = take(`anon:${ip}`, ANON_LIMIT)
    if (!limit.allowed) {
      return withCors(NextResponse.json(
        { error: 'rate_limited', retryAfterMs: limit.retryAfterMs },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
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

  // Per-user monthly quota for signed-in free users on the extension.
  // Pro users bypass entirely. New turns in an in-progress session (when
  // priorAnswers is non-empty) don't recount - they're part of the same
  // analysis the user already paid for.
  if (auth && auth.tier === 'free' && priorAnswers.length === 0) {
    const supabase = await createServiceClient()
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .eq('event_type', 'prompt_analyzed')
      .gte('created_at', startOfMonth.toISOString())

    const FREE_MONTHLY = 25
    if ((count ?? 0) >= FREE_MONTHLY) {
      return withCors(NextResponse.json(
        { error: 'monthly_limit', used: count, limit: FREE_MONTHLY },
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

  const result = await analyzePrompt({ prompt, tone, priorAnswers })
  if (!result) {
    return withCors(NextResponse.json({ error: 'ai_unavailable' }, { status: 503 }))
  }

  // Record usage for signed-in users, fire-and-forget. Only on the first
  // turn of a session - clarification rounds belong to the same analysis.
  if (auth && priorAnswers.length === 0) {
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
