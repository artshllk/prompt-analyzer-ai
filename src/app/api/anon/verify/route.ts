import { NextRequest, NextResponse } from 'next/server'
import { verifyPrompts, VERIFY_TARGETS } from '@/lib/engine/verify'
import { take, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { validateToken, extractBearerToken } from '@/lib/db/api-tokens'
import { getVerifyAllowance, recordVerifyUsage } from '@/lib/db/usage'

/**
 * Proof. Runs the user's ORIGINAL prompt and the IMPROVED one against a real
 * model and hands back both answers side by side, plus one line naming the
 * difference.
 *
 * This is the only thing on the product that does not ask the user to take our
 * word for it. Everything else shows a better PROMPT, which asks a
 * non-technical person to judge prompt quality - the exact skill they came here
 * without. An answer they can read is evidence they can actually weigh.
 *
 * The engine stage (verify.ts) has existed and been unreachable. This is the
 * route that reaches it.
 *
 * WHY THIS ONE COSTS A CREDIT, WHEN EXPLAIN DOES NOT
 * Explain is one cheap call about text we already have. This is three
 * generations: both prompts run in parallel, then a contrast pass. It is the
 * most expensive thing the product does per press, so it is the one thing that
 * has to be counted.
 *
 * WHY IT REQUIRES AN ACCOUNT
 * Not to be stingy. The free allowance is a LIFETIME credit
 * (FREE_VERIFY_LIFETIME_CREDITS), and a lifetime is a thing you can only count
 * against an identity. An anonymous caller has none, so there is no honest way
 * to meter it - and three generations a press is not something to hand to an
 * un-metered IP. Asking for a free account at the moment someone wants proof
 * is also a fair trade rather than a wall: they get the proof, we get the
 * signup.
 */

interface VerifyBody {
  original: string
  improved: string
  /** Optional. Must be one of VERIFY_TARGETS; anything else falls back. */
  targetModel?: string
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

/**
 * Two ways in, because there are two kinds of client.
 *
 * This route used to read a `dc_` bearer token and nothing else, which meant a
 * signed-in visitor on deepclario.com got `account_required` while looking at
 * their own account. The web app authenticates with a Supabase cookie session
 * and has no bearer token to send; only the extension has one. So the feature
 * was unreachable from the surface it was designed for.
 *
 * Bearer is tried first: it is the cheaper check and it is what every
 * extension request carries. The cookie session is the fallback.
 */
async function resolveCaller(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'))
  const viaToken = token ? await validateToken(token) : null
  if (viaToken) return viaToken

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .maybeSingle()

  return { userId: user.id, tier: (profile?.tier ?? 'free') as 'free' | 'pro' }
}

export async function POST(req: NextRequest) {
  const auth = await resolveCaller(req)

  // No account, no run. See the header comment: a lifetime credit needs
  // someone to spend it. Named error so the client can offer sign-in rather
  // than reporting a failure.
  if (!auth) {
    return corsJson({ error: 'account_required' }, 401)
  }

  // Burst protection on its OWN namespace. Sharing a bucket across endpoints is
  // what made one improve cost two of an anonymous user's six hourly tokens,
  // so every endpoint added from here on gets its own key.
  const burst = take(
    `verify:user:${auth.userId}`,
    auth.tier === 'pro' ? PRO_USER_LIMIT : USER_LIMIT
  )
  if (!burst.allowed) {
    return corsJson({ error: 'rate_limited', retryAfterMs: burst.retryAfterMs }, 429)
  }

  let body: VerifyBody
  try {
    body = await req.json()
  } catch {
    return corsJson({ error: 'invalid_body' }, 400)
  }

  const original = body.original?.trim()
  const improved = body.improved?.trim()
  if (!original || !improved) return corsJson({ error: 'prompts_required' }, 400)
  if (original.length > 4000 || improved.length > 6000) {
    return corsJson({ error: 'prompt_too_long' }, 400)
  }
  // Nothing to prove if they are the same text. Running it anyway would spend a
  // credit to show two identical answers, which is the worst possible first
  // impression of the feature that exists to be convincing.
  if (original === improved) {
    return corsJson({ error: 'prompts_identical' }, 400)
  }

  // serviceRole: true is load-bearing. This request is authenticated by a
  // bearer token, so there are no cookies for RLS to read - the default client
  // would count zero and the gate would never close.
  const allowance = await getVerifyAllowance(auth.userId, auth.tier, true)
  if (allowance.isAtLimit) {
    return corsJson(
      {
        error: 'verify_limit',
        used: allowance.used,
        limit: allowance.limit,
        tier: auth.tier,
      },
      402
    )
  }

  console.log(
    `[anon-verify] auth=${auth.tier}:${auth.userId.slice(0, 8)} ` +
    `used=${allowance.used}/${allowance.limit} ts=${new Date().toISOString()}`
  )

  const targetModel =
    body.targetModel && (VERIFY_TARGETS as readonly string[]).includes(body.targetModel)
      ? body.targetModel
      : undefined

  const result = await verifyPrompts({ original, improved, targetModel })

  // Charge only for work delivered. A failed run that still burned one of three
  // lifetime credits would be indefensible, and this path is three model calls
  // deep so it has real ways to fail.
  if (!result) {
    return corsJson({ error: 'verify_unavailable' }, 503)
  }

  await recordVerifyUsage(auth.userId, true)

  return corsJson(
    {
      ...result,
      // Post-spend, so the client can say "2 left" without a second request.
      remaining: Math.max(0, allowance.remaining - 1),
      limit: allowance.limit,
      tier: auth.tier,
    },
    200
  )
}
