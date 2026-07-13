import { NextRequest, NextResponse } from 'next/server'
import { explainSharpen, applyAnswers } from '@/lib/engine/explain'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { validateToken, extractBearerToken } from '@/lib/db/api-tokens'

/**
 * Explain a sharpen that already happened: what was weak in the original,
 * what the rewrite changed, and what it could not fix.
 *
 * Produces no rewrite and asks no question - the question is asked inline,
 * before the rewrite. Costs no quota: an explanation is not a rewrite, and
 * charging users to understand their own result would be perverse.
 */

interface ExplainBody {
  original: string
  sharpened: string
  /** When present, fold these answers into the prompt instead of explaining. */
  answers?: Array<{ label: string; answer: string }>
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

  let body: ExplainBody
  try {
    body = await req.json()
  } catch {
    return corsJson({ error: 'invalid_body' }, 400)
  }

  const original = body.original?.trim()
  const sharpened = body.sharpened?.trim()
  if (!original || !sharpened) return corsJson({ error: 'prompts_required' }, 400)
  if (original.length > 4000 || sharpened.length > 6000) {
    return corsJson({ error: 'prompt_too_long' }, 400)
  }

  // Applying answers: the user filled in a gap, so fold it into the prompt
  // and hand back the improved version. Still no quota - they are completing
  // the rewrite they already paid for, not buying a new one.
  const answers = Array.isArray(body.answers)
    ? body.answers.filter(a => a && a.label && a.answer?.trim()).slice(0, 3)
    : []

  if (answers.length > 0) {
    const updated = await applyAnswers({ prompt: sharpened, answers })
    if (!updated) return corsJson({ error: 'ai_unavailable' }, 503)
    return corsJson({ prompt: updated }, 200)
  }

  const result = await explainSharpen({ original, sharpened })
  if (!result) return corsJson({ error: 'ai_unavailable' }, 503)

  return corsJson(result, 200)
}
