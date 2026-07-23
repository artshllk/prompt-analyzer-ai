import { NextRequest, NextResponse } from 'next/server'
import { imagePlan } from '@/lib/engine/image/image-plan'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { validateToken, extractBearerToken } from '@/lib/db/api-tokens'

/**
 * Image feature, ask stage. Given a rough image request, returns the plan:
 * the detected style family, the one pivotal question to ask before rewriting
 * (or none), up to 2 refinements to offer after, and a decline when the request
 * is one we will not craft (real-person likeness, third-party IP, explicit).
 *
 * Mirrors /api/anon/fork exactly: costs no quota (this is a decision, not a
 * rewrite), rate-limited only. The extension fires it only when the user clicks
 * the image action, so it never runs on a normal text improve.
 */

interface ImagePlanBody {
  prompt: string
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

  if (!auth) {
    const ip = getClientIp(req)
    const limit = take(`anon:${ip}`, ANON_LIMIT)
    if (!limit.allowed) return corsJson({ error: 'rate_limited' }, 429)
  } else {
    const burst = take(`user:${auth.userId}`, auth.tier === 'pro' ? PRO_USER_LIMIT : USER_LIMIT)
    if (!burst.allowed) return corsJson({ error: 'rate_limited' }, 429)
  }

  let body: ImagePlanBody
  try {
    body = await req.json()
  } catch {
    return corsJson({ error: 'invalid_body' }, 400)
  }

  const prompt = body.prompt?.trim()
  if (!prompt) return corsJson({ error: 'prompt_required' }, 400)
  if (prompt.length > 4000) return corsJson({ error: 'prompt_too_long' }, 400)

  const plan = await imagePlan(prompt)
  // A failure here is not user-facing: the client falls back to rewriting with
  // no style chosen, exactly as if the plan had found nothing to ask.
  return corsJson(
    plan ?? { isImage: true, styleFamily: null, pivotal: { question: '', options: [] }, refinements: [], decline: null },
    200
  )
}
