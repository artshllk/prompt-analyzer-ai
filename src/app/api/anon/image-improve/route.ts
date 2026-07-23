import { NextRequest, NextResponse } from 'next/server'
import { streamImagePrompt } from '@/lib/engine/image/image-rewrite'
import type { StyleFamily } from '@/lib/engine/image/image-knowledge'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { validateToken, extractBearerToken } from '@/lib/db/api-tokens'
import { createServiceClient } from '@/lib/supabase/server'
import { recordExtensionSession } from '@/lib/db/sessions'
import { decideUsage, windowStart, USAGE_WINDOW_HOURS, USAGE_DAILY_LIMIT } from '@/lib/limits'

/**
 * Image feature, rewrite stage. Streams a finished natural-language image
 * prompt into the chat box, the same way /api/anon/sharpen streams a text
 * rewrite.
 *
 * This is a real improvement, so it charges one credit against the SAME daily
 * quota as text (an improvement is an improvement) and follows the identical
 * tier -> model split. The auth/quota/CORS/streaming shape is copied from
 * sharpen/route.ts; only the engine call differs.
 */

const FAMILY_KEYS = [
  'photoreal', 'cinematic', 'anime', '3d-render',
  'illustration', 'product', 'logo', 'concept-art',
] as const

interface ImageImproveBody {
  prompt: string
  styleFamily?: string
  /** Refinement answers the user tapped after the first result. */
  answers?: Array<{ question: string; answer: string }>
  source?: string
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Expose-Headers': 'X-Improvements-Left',
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

  if (!auth) {
    const ip = getClientIp(req)
    const limit = take(`anon:${ip}`, ANON_LIMIT)
    if (!limit.allowed) return corsJson({ error: 'rate_limited', retryAfterMs: limit.retryAfterMs }, 429)
  } else {
    const burst = take(`user:${auth.userId}`, auth.tier === 'pro' ? PRO_USER_LIMIT : USER_LIMIT)
    if (!burst.allowed) return corsJson({ error: 'rate_limited', retryAfterMs: burst.retryAfterMs }, 429)
  }

  let body: ImageImproveBody
  try {
    body = await req.json()
  } catch {
    return corsJson({ error: 'invalid_body' }, 400)
  }

  const prompt = body.prompt?.trim()
  const source = body.source === 'extension' ? 'extension' : 'web'
  const styleFamily = FAMILY_KEYS.includes(body.styleFamily as StyleFamily)
    ? (body.styleFamily as StyleFamily)
    : null
  const answers = Array.isArray(body.answers)
    ? body.answers
        .filter(a => a && typeof a.question === 'string' && typeof a.answer === 'string')
        .slice(0, 3)
    : []

  if (!prompt) return corsJson({ error: 'prompt_required' }, 400)
  if (prompt.length > 4000) return corsJson({ error: 'prompt_too_long' }, 400)

  // Same daily quota as text improvements (see sharpen/route.ts for the full
  // rationale). Pro bypasses; free is gated; anon has the header omitted.
  let remaining: number | null = null

  if (auth && auth.tier === 'pro') {
    remaining = -1
  } else if (auth && auth.tier === 'free') {
    const supabase = await createServiceClient()
    const since = windowStart(USAGE_WINDOW_HOURS)

    const { data: rows, count, error: usageErr } = await supabase
      .from('usage_events')
      .select('created_at', { count: 'exact' })
      .eq('user_id', auth.userId)
      .eq('event_type', 'prompt_analyzed')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(1)

    if (usageErr) {
      console.error(`[anon-image] USAGE GATE DISABLED - usage_events read failed: ${usageErr.message}`)
    }

    const decision = decideUsage(count ?? 0, rows?.[0]?.created_at ?? null)
    if (!decision.allow) {
      return corsJson({ error: 'rate_limited_quota', resetAt: decision.retryAt, dailyLimit: USAGE_DAILY_LIMIT }, 402)
    }
    remaining = decision.remaining
  }

  console.log(
    `[anon-image] source=${source} style=${styleFamily ?? '-'} answers=${answers.length} auth=${auth ? `${auth.tier}:${auth.userId.slice(0, 8)}` : 'anon'} ts=${new Date().toISOString()}`
  )

  if (auth) {
    const supabase = await createServiceClient()
    supabase.from('usage_events').insert({ user_id: auth.userId, event_type: 'prompt_analyzed' }).then(() => {})
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = ''
      try {
        for await (const delta of streamImagePrompt({
          prompt,
          styleFamily,
          answers,
          pro: auth?.tier === 'pro',
        })) {
          full += delta
          controller.enqueue(encoder.encode(delta))
        }
      } catch (err) {
        console.error(`[anon-image] stream error: ${(err as Error).message}`)
      } finally {
        controller.close()
        if (auth && full.trim()) {
          // No tone concept for images; 'professional' is a neutral placeholder
          // so history has a valid row. The style family rides in the choice
          // field so /history shows what look was chosen.
          await recordExtensionSession({
            userId: auth.userId,
            originalPrompt: prompt,
            finalPrompt: full.trim(),
            tone: 'professional',
            choice: styleFamily ? `image: ${styleFamily}` : 'image',
          })
        }
      }
    },
  })

  const headers: Record<string, string> = {
    ...CORS_HEADERS,
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no',
  }
  if (remaining !== null) headers['X-Improvements-Left'] = String(remaining)

  return new NextResponse(stream, { status: 200, headers })
}
