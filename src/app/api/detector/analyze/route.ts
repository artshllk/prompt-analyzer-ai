import { NextRequest, NextResponse } from 'next/server'
import { analyzeText } from '@/lib/detector'
import { take, getClientIp, ANON_DETECT_DAY } from '@/lib/rate-limit'
import { consumeAnonRun } from '@/lib/db/anon-budget'
import { alertOps } from '@/lib/alert'
import { createClient } from '@/lib/supabase/server'
import { getDetectorUsage, recordDetectorUsage } from '@/lib/db/usage'

interface DetectorBody {
  text: string
}

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
 * AI-detection endpoint. Tiered:
 *   - Anonymous → loose per-IP abuse throttle. The "1 free detection"
 *     rule is enforced client-side (localStorage) with a sign-in gate,
 *     mirroring the homepage rewrite demo; the IP throttle here is just
 *     abuse protection.
 *   - Signed-in free → DETECT_FREE_LIMIT a month (402 when spent).
 *   - Signed-in pro  → PRO_DETECT_LIMIT a month. Capped, not unlimited.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Per-IP throttle. The detector is heavier than the prompt analyzer
    // (longer Gemini calls) so we share the same anon limit budget.
    const ip = getClientIp(req)
    /**
     * Two gates, and they do different jobs.
     *
     * ANON_DETECT_DAY is per IP, in memory, and BEST EFFORT: a recycled
     * instance forgets it and a second address walks around it. It shapes an
     * honest visitor's day and nothing more.
     *
     * The bucket below is the one that bounds the bill. It is in Postgres, it
     * is global, and it fails closed. Until it existed the detector had no
     * ceiling that survived an instance recycle, on the more expensive of the
     * two products at $0.018 a run.
     */
    const limit = take(`detect:${ip}`, ANON_DETECT_DAY)
    if (!limit.allowed) {
      return withCors(
        NextResponse.json(
          { error: 'rate_limited', retryAfterMs: limit.retryAfterMs },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)),
            },
          },
        ),
      )
    }

    const budget = await consumeAnonRun('detector')
    if (!budget.allowed) {
      /**
       * Same alert as the checker's cap, for the same reason: a silent
       * refusal and no demand look identical from outside and are opposite
       * problems. Fires on the FIRST refusal only, because `used` is the
       * post-increment count from an atomic RPC.
       */
      if (budget.used === budget.cap + 1) {
        console.error(`[detector] daily cap ${budget.cap} reached`)
        await alertOps(
          `Deepclario hit its daily detector cap of ${budget.cap}.`,
          `Anonymous detections are refused until ${budget.resetAt}. ` +
            `The detector is frozen, so this is more likely a script than demand.`
        )
      }
      return withCors(
        NextResponse.json({ error: 'daily_capacity', resetAt: budget.resetAt }, { status: 429 })
      )
    }
  } else {
    // Signed-in: free and pro both have a monthly ceiling. See getDetectorUsage.
    const usage = await getDetectorUsage(user.id)
    if (usage.isAtLimit) {
      return withCors(
        NextResponse.json({ error: 'detect_limit', usage }, { status: 402 }),
      )
    }
  }

  let body: DetectorBody
  try {
    body = await req.json()
  } catch {
    return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    return withCors(NextResponse.json({ error: 'empty_text' }, { status: 400 }))
  }
  if (text.length > 20000) {
    return withCors(
      NextResponse.json(
        { error: 'too_long', message: 'Maximum 20,000 characters.' },
        { status: 400 },
      ),
    )
  }

  const result = await analyzeText(text)
  if (!result) {
    return withCors(
      NextResponse.json({ error: 'engine_failed' }, { status: 502 }),
    )
  }

  // Record a detection for signed-in users so the rolling quota is
  // accurate. Awaited (not fire-and-forget) so the count is durable on
  // serverless before the response returns.
  if (user) {
    await recordDetectorUsage(user.id).catch(() => {})
  }

  return withCors(NextResponse.json(result))
}
