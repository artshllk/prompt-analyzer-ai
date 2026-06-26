import { NextRequest, NextResponse } from 'next/server'
import { analyzeText } from '@/lib/detector'
import { take, getClientIp, ANON_LIMIT } from '@/lib/rate-limit'

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
 * Public AI-detection endpoint. Anonymous + IP-rate-limited for now.
 * Signed-in user history will land in a follow-up phase.
 */
export async function POST(req: NextRequest) {
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

  return withCors(NextResponse.json(result))
}
