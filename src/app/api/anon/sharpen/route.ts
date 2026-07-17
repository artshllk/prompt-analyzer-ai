import { NextRequest, NextResponse } from 'next/server'
import { streamSharpen } from '@/lib/engine/sharpen'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { validateToken, extractBearerToken } from '@/lib/db/api-tokens'
import { createServiceClient } from '@/lib/supabase/server'
import { recordExtensionSession } from '@/lib/db/sessions'
import { decideUsage, windowStart, USAGE_WINDOW_HOURS, USAGE_DAILY_LIMIT } from '@/lib/limits'
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
  // Without this the extension cannot read X-Improvements-Left cross-origin.
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

  // Free-tier daily limit: USAGE_DAILY_LIMIT improvements per rolling 24h.
  // Pro bypasses entirely.
  //
  // Headroom is computed on EVERY call, not just when blocking, and handed
  // back on the response - the extension stays silent while there is plenty
  // left and only speaks when the user is nearly out. A meter that is always
  // on screen is nagging, not helping.
  //
  // The policy itself lives in decideUsage() (pure); this route only does the
  // IO around it: count the events in the window, ask, obey.
  //
  // Three distinct outcomes, and the header must tell them apart:
  //   Pro       -> -1  (unlimited; the extension confirms this once)
  //   free      ->  N  (improvements left today)
  //   anonymous -> header omitted entirely (we genuinely do not know)
  // `remaining` stays null ONLY for the anonymous case, which is the signal
  // further down to leave the header off. It used to stay null for Pro too,
  // so Pro and anon both sent -1: not-connected users were told "Pro:
  // unlimited improvements", and Pro was indistinguishable from anon.
  let remaining: number | null = null

  if (auth && auth.tier === 'pro') {
    remaining = -1
  } else if (auth && auth.tier === 'free') {
    const supabase = await createServiceClient()
    const since = windowStart(USAGE_WINDOW_HOURS)

    // One query does both jobs: `count: 'exact'` gives how many were used in
    // the window, and the oldest row tells us when a credit comes back. We
    // only need the oldest, hence limit(1) on an ascending sort.
    const { data: rows, count, error: usageErr } = await supabase
      .from('usage_events')
      .select('created_at', { count: 'exact' })
      .eq('user_id', auth.userId)
      .eq('event_type', 'prompt_analyzed')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(1)

    // Fail open (never lock someone out over our own infrastructure error)
    // but shout, so a broken gate cannot go unnoticed in production.
    if (usageErr) {
      console.error(
        `[anon-sharpen] USAGE GATE DISABLED - usage_events read failed: ${usageErr.message}`
      )
    }

    const decision = decideUsage(count ?? 0, rows?.[0]?.created_at ?? null)

    if (!decision.allow) {
      return corsJson(
        {
          error: 'rate_limited_quota',
          // A wall with a clock on it is a wait; without one it is a dead end.
          resetAt: decision.retryAt,
          dailyLimit: USAGE_DAILY_LIMIT,
        },
        402
      )
    }

    remaining = decision.remaining
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
      let full = ''
      try {
        for await (const delta of streamSharpen({ prompt, tone, choice })) {
          full += delta
          controller.enqueue(encoder.encode(delta))
        }
      } catch (err) {
        console.error(`[anon-sharpen] stream error: ${(err as Error).message}`)
        // Nothing streamed yet? The client sees an empty body and falls
        // back. Mid-stream, the partial result is still usable.
      } finally {
        controller.close()

        // Persist the session once we have the finished text. This is the
        // ONLY place history is written now that the playground is going -
        // without it, /history and /insights are empty forever. Awaited
        // inside the stream (not the request) so it never delays a token,
        // and it can never break the rewrite: recordExtensionSession
        // swallows its own errors.
        if (auth && full.trim()) {
          await recordExtensionSession({
            userId: auth.userId,
            originalPrompt: prompt,
            finalPrompt: full.trim(),
            tone,
            choice,
          })
        }
      }
    },
  })

  // Headroom rides on a header: the body is a plain-text stream, so there
  // is nowhere else to put it. `-1` means unlimited (Pro); a real count
  // means free tier. For anonymous users (remaining === null) we OMIT the
  // header entirely - the client reads a missing header as "unknown" and
  // stays silent, which is the truth. Sending -1 here was the bug that told
  // brand-new users they had Pro's unlimited improvements.
  const headers: Record<string, string> = {
    ...CORS_HEADERS,
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no',
  }
  if (remaining !== null) {
    headers['X-Improvements-Left'] = String(remaining)
  }

  return new NextResponse(stream, { status: 200, headers })
}
