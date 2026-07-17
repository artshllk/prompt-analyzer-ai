import { NextRequest, NextResponse } from 'next/server'
import { validateToken, extractBearerToken } from '@/lib/db/api-tokens'
import { createServiceClient } from '@/lib/supabase/server'
import { decideUsage, windowStart, USAGE_WINDOW_HOURS, USAGE_DAILY_LIMIT } from '@/lib/limits'

/**
 * Account status for the extension's toolbar popup.
 *
 * The popup is the one place a user can always go to get a straight answer
 * to "am I signed in, what plan am I on, how many improvements do I have
 * left". Before this existed, that was only visible inside the compare
 * panel, which most users never open - so the honest answer to "how do I
 * know?" was "you don't".
 *
 * Read-only and free: this spends no quota and runs no model. It reports
 * the same numbers the sharpen route enforces, by calling the same
 * decideUsage(), so the popup can never disagree with the gate.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

export async function GET(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  const auth = token ? await validateToken(token) : null

  // No token, or a token that has been revoked / no longer resolves. Both
  // mean the same thing to the popup: you are not signed in. Saying so is
  // what lets it stop claiming a stale "Pro" after a revoke.
  if (!auth) {
    return corsJson({ tier: 'anon', dailyLimit: USAGE_DAILY_LIMIT }, 200)
  }

  const supabase = await createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', auth.userId)
    .maybeSingle()
  const email = profile?.email ?? null

  if (auth.tier === 'pro') {
    return corsJson({ tier: 'pro', email }, 200)
  }

  const { data: rows, count, error } = await supabase
    .from('usage_events')
    .select('created_at', { count: 'exact' })
    .eq('user_id', auth.userId)
    .eq('event_type', 'prompt_analyzed')
    .gte('created_at', windowStart(USAGE_WINDOW_HOURS))
    .order('created_at', { ascending: true })
    .limit(1)

  // Match the sharpen route: if we cannot read usage we fail open there, so
  // we must not show a scary "0 left" here. Report the limit as untouched
  // and let the gate be the authority.
  if (error) {
    console.error(`[anon-status] usage_events read failed: ${error.message}`)
    return corsJson(
      { tier: 'free', email, left: USAGE_DAILY_LIMIT, dailyLimit: USAGE_DAILY_LIMIT, resetAt: null },
      200
    )
  }

  const used = count ?? 0
  const decision = decideUsage(used, rows?.[0]?.created_at ?? null)

  return corsJson(
    {
      tier: 'free',
      email,
      // decideUsage reports what is left AFTER the improvement it is being
      // asked about. The popup is not asking about one, so it wants the
      // count as it stands right now.
      left: Math.max(0, USAGE_DAILY_LIMIT - used),
      dailyLimit: USAGE_DAILY_LIMIT,
      // Only meaningful at zero: when the next credit comes back.
      resetAt: decision.allow ? null : decision.retryAt,
    },
    200
  )
}
