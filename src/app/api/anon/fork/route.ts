import { NextRequest, NextResponse } from 'next/server'
import { quickFork } from '@/lib/engine/quick-fork'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { validateToken, extractBearerToken } from '@/lib/db/api-tokens'

/**
 * Quick fork check: is this prompt genuinely ambiguous, and if so, what are
 * the 2-3 readings?
 *
 * The extension fires this IN PARALLEL with /anon/sharpen, so the rewrite
 * still streams in ~1s and the question (when there is one) appears right
 * after, offering to refine. That way the user gets the clarifying question
 * at the moment it matters, without paying its latency on every prompt.
 *
 * Costs no quota: this is a decision, not a rewrite. Rate-limited only.
 */

interface ForkBody {
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

  let body: ForkBody
  try {
    body = await req.json()
  } catch {
    return corsJson({ error: 'invalid_body' }, 400)
  }

  const prompt = body.prompt?.trim()
  if (!prompt) return corsJson({ error: 'prompt_required' }, 400)
  if (prompt.length > 4000) return corsJson({ error: 'prompt_too_long' }, 400)

  const fork = await quickFork(prompt)
  // A failure here is not user-facing: no question simply means no chips.
  return corsJson(fork ?? { question: '', options: [] }, 200)
}
