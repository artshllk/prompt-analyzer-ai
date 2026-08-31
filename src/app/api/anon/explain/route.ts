import { NextRequest, NextResponse } from 'next/server'
import { explainSharpen, applyAnswers } from '@/lib/engine/explain'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { validateToken, extractBearerToken } from '@/lib/db/api-tokens'
import { attachDiagnosis, updateFinalPrompt } from '@/lib/db/sessions'
import { rememberAnswers, recallMemory } from '@/lib/db/memory'

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

    // Remember what they said. This is the whole of memory: the engine asks
    // what is missing, they tell us, and until now we folded it into the
    // prompt and threw it away - so the next vague prompt asked the same
    // question cold, as if we had never met.
    if (auth) void rememberAnswers(auth.userId, answers)

    // They filled in the details only they knew, so the prompt improved
    // again. History must show what they actually ended up with, not the
    // intermediate version.
    if (auth) {
      void updateFinalPrompt({
        userId: auth.userId,
        originalPrompt: original,
        finalPrompt: updated,
      })
    }

    return corsJson({ prompt: updated }, 200)
  }

  // What this user keeps telling us. Only memories they have given more than
  // once: a single answer is a fact about one prompt, not a habit, and
  // offering it back would be presumptuous.
  const memory = auth
    ? (await recallMemory(auth.userId))
        .filter(m => m.timesUsed >= 2)
        .map(m => ({ label: m.label, answer: m.answer }))
    : []

  const result = await explainSharpen({ original, sharpened, memory })
  if (!result) return corsJson({ error: 'ai_unavailable' }, 503)

  // Backfill the session with what this call worked out was still missing.
  // That is what makes History teachable.
  if (auth) {
    void attachDiagnosis({
      userId: auth.userId,
      originalPrompt: original,
      gaps: result.gaps,
    })
  }

  return corsJson(result, 200)
}
