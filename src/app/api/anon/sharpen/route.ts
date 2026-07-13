import { NextRequest, NextResponse } from 'next/server'
import { streamSharpen } from '@/lib/engine/sharpen'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { validateToken, extractBearerToken } from '@/lib/db/api-tokens'
import { createServiceClient } from '@/lib/supabase/server'
import { REWRITE_FREE_LIMIT, REWRITE_WINDOW_HOURS, windowStart } from '@/lib/limits'
import type { Tone } from '@/types/database'

/**
 * Fast-path streaming sharpen. The extension's default inline action:
 * one nano-model call, streamed token-by-token so the first word lands
 * in under a second. Same auth/quota/rate-limit rules as /anon/analyze
 * (the heavy pipeline), so this can't be used to dodge limits.
 *
 * Streams plain text (Content-Type text/plain). The client appends chunks
 * straight into the prompt box. Errors before the stream starts return
 * JSON; a mid-stream failure just ends the stream.
 */

interface SharpenBody {
  prompt: string
  tone?: Tone
  source?: string
  /** The interpretation the user picked from the inline fork chips. */
  choice?: string
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
  const token = extractBearerToken(req.headers.get('authorization'))
  const auth = token ? await validateToken(token) : null

  // Burst / IP throttle, identical tiers to the analyze route.
  if (!auth) {
    const ip = getClientIp(req)
    const limit = take(`anon:${ip}`, ANON_LIMIT)
    if (!limit.allowed) {
      return corsJson({ error: 'rate_limited', retryAfterMs: limit.retryAfterMs }, 429)
    }
  } else {
    const burst = take(`user:${auth.userId}`, auth.tier === 'pro' ? PRO_USER_LIMIT : USER_LIMIT)
    if (!burst.allowed) {
      return corsJson({ error: 'rate_limited', retryAfterMs: burst.retryAfterMs }, 429)
    }
  }

  let body: SharpenBody
  try {
    body = await req.json()
  } catch {
    return corsJson({ error: 'invalid_body' }, 400)
  }

  const prompt = body.prompt?.trim()
  const tone: Tone = body.tone ?? 'professional'
  const source = body.source === 'extension' ? 'extension' : 'web'
  const choice = body.choice?.trim() || undefined

  if (!prompt) return corsJson({ error: 'prompt_required' }, 400)
  if (prompt.length > 4000) return corsJson({ error: 'prompt_too_long' }, 400)

  // The clarifying question is asked BEFORE any rewrite (see the extension's
  // ask-first flow), so a call carrying a `choice` is still the one and only
  // rewrite of that prompt - it charges like any other. Every sharpen = one
  // credit, whether or not a question was answered on the way.

  // Rolling quota for signed-in free users (same 5/48h bucket as analyze -
  // a sharpen is a rewrite). Pro bypasses.
  if (auth && auth.tier === 'free') {
    const supabase = await createServiceClient()
    const { count } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .eq('event_type', 'prompt_analyzed')
      .gte('created_at', windowStart(REWRITE_WINDOW_HOURS))
    if ((count ?? 0) >= REWRITE_FREE_LIMIT) {
      return corsJson(
        { error: 'rate_limited_quota', used: count, limit: REWRITE_FREE_LIMIT, windowHours: REWRITE_WINDOW_HOURS },
        402
      )
    }
  }

  console.log(
    `[anon-sharpen] source=${source} answered=${!!choice} auth=${auth ? `${auth.tier}:${auth.userId.slice(0, 8)}` : 'anon'} ts=${new Date().toISOString()}`
  )

  // Record usage for signed-in users, fire-and-forget.
  if (auth) {
    const supabase = await createServiceClient()
    supabase
      .from('usage_events')
      .insert({ user_id: auth.userId, event_type: 'prompt_analyzed' })
      .then(() => {})
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of streamSharpen({ prompt, tone, choice })) {
          controller.enqueue(encoder.encode(delta))
        }
      } catch (err) {
        console.error(`[anon-sharpen] stream error: ${(err as Error).message}`)
        // Nothing streamed yet? The client sees an empty body and falls
        // back. Mid-stream, the partial result is still usable.
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
