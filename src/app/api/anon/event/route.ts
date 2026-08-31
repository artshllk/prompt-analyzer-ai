import { NextRequest, NextResponse } from 'next/server'
import { take, getClientIp, EVENT_LIMIT } from '@/lib/rate-limit'
import { createServiceClient } from '@/lib/supabase/server'
import type { ExtensionEvent, ExtensionSurface, Tier } from '@/types/database'

/**
 * Counters for the extension. No prompt text, no user id, no IP.
 *
 * 0.9.0 is live and nothing measures it. The extension already knows the most
 * important thing about its own quality - whether the user sent the rewrite or
 * took it back - and discards it at the moment it happens. This is where that
 * goes.
 *
 * UNAUTHENTICATED ON PURPOSE
 * Anonymous users are most of a new install's life (five free tries before we
 * ask for anything), so requiring a token would blind us to exactly the part
 * of the funnel in question. The cost of an open write endpoint is handled by
 * making it worthless to abuse rather than hard to reach: the event name is
 * checked against a closed list here AND by a CHECK constraint in the table,
 * there is no free-text column to inject into, and nothing written is ever
 * shown to another user.
 *
 * ALWAYS 204
 * This endpoint cannot be allowed to matter. A rate limit, a malformed body, a
 * database that is down, a migration that has not been applied yet - every one
 * of them returns the same empty success. The client fires and forgets, and
 * the day this breaks is a day nobody notices, which is the correct behaviour
 * for analytics sitting in front of the product's main action.
 */

const EVENTS = new Set<ExtensionEvent>([
  'improve_started',
  'improve_finished',
  'improve_failed',
  'question_shown',
  'question_answered',
  'question_skipped',
  'question_none',
  'rewrite_accepted',
  'rewrite_edited',
  'rewrite_undone',
])

const TIERS = new Set<Tier | 'anon'>(['anon', 'free', 'pro'])
const SURFACES = new Set<ExtensionSurface>(['chatgpt', 'claude', 'gemini', 'web'])

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/** The only response this route ever gives. */
function ok(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  // Per-IP ceiling on its own namespace, so a flood of counters can never eat
  // into the buckets that gate real work. The IP is used to throttle and is
  // never stored.
  const limit = take(`event:${getClientIp(req)}`, EVENT_LIMIT)
  if (!limit.allowed) return ok()

  let body: { event?: unknown; tier?: unknown; surface?: unknown }
  try {
    body = await req.json()
  } catch {
    return ok()
  }

  const event = body.event as ExtensionEvent
  if (typeof event !== 'string' || !EVENTS.has(event)) return ok()

  const maybeTier = body.tier as Tier | 'anon'
  const tier = typeof maybeTier === 'string' && TIERS.has(maybeTier) ? maybeTier : 'anon'

  const maybeSurface = body.surface as ExtensionSurface
  const surface =
    typeof maybeSurface === 'string' && SURFACES.has(maybeSurface) ? maybeSurface : null

  try {
    const supabase = await createServiceClient()
    const { error } = await supabase.from('extension_events').insert({ event, tier, surface })

    // Silent to the CLIENT, loud to us.
    //
    // supabase-js returns a failed insert as a value rather than throwing, so
    // the catch below never sees it. Without this line a missing table - the
    // exact state of production until migration 010 is applied - would drop
    // every event forever and look identical to nobody using the extension.
    // That is the worst way for analytics to fail, because the number it
    // produces is a plausible one.
    if (error) {
      console.error(`[anon-event] insert failed (${event}): ${error.message}`)
    }
  } catch (err) {
    // Unreachable database, bad credentials. Same rule: the extension must
    // never learn that this endpoint exists, let alone that it broke.
    console.error(`[anon-event] insert threw: ${(err as Error).message}`)
  }

  return ok()
}
