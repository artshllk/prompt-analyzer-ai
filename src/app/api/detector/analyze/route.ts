import { NextRequest, NextResponse } from 'next/server'
import { analyzeText } from '@/lib/detector'
import { take, getClientIp, ANON_LIMIT } from '@/lib/rate-limit'
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
 *   - Signed-in free → 5 detections per rolling 24h (402 when spent).
 *   - Signed-in pro  → unlimited.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Per-IP throttle. The detector is heavier than the prompt analyzer
    // (longer Gemini calls) so we share the same anon limit budget.
    const ip = getClientIp(req)
    const limit = take(`detect:${ip}`, ANON_LIMIT)
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
  } else {
    // Signed-in: enforce the rolling free quota (pro is unlimited).
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
