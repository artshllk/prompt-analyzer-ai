import { NextRequest, NextResponse } from 'next/server'
import { analyzePrompt } from '@/lib/engine'
import { take, getClientIp, ANON_LIMIT } from '@/lib/rate-limit'
import type { Tone } from '@/types/database'
import type { QAPair } from '@/types'

interface AnonAnalyzeBody {
  prompt: string
  tone: Tone
  priorAnswers?: QAPair[]
}

/**
 * Stateless analyze endpoint for unauthenticated users.
 * - No DB persistence (frontend tracks turn count in React state).
 * - Per-IP rate limit prevents abuse.
 * - Frontend enforces the 2-free-analysis cap via localStorage; this endpoint
 *   is a safety net, not the primary gate.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = take(`anon:${ip}`, ANON_LIMIT)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterMs: limit.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
    )
  }

  let body: AnonAnalyzeBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { prompt, tone, priorAnswers = [] } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt_required' }, { status: 400 })
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ error: 'prompt_too_long' }, { status: 400 })
  }

  const result = await analyzePrompt({ prompt, tone, priorAnswers })
  if (!result) {
    return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 })
  }

  return NextResponse.json({ ...result, anon: true })
}
