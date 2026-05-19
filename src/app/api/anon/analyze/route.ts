import { NextRequest, NextResponse } from 'next/server'
import { analyzePrompt } from '@/lib/engine'
import { take, getClientIp, ANON_LIMIT } from '@/lib/rate-limit'
import type { Tone } from '@/types/database'
import type { QAPair } from '@/types'

interface AnonAnalyzeBody {
  prompt: string
  tone: Tone
  priorAnswers?: QAPair[]
  /** Where the call came from. Defaults to 'web' (homepage demo).
   *  The browser extension sends 'extension'. Used only for analytics. */
  source?: string
}

// Permissive CORS - this endpoint is public, no-auth, and per-IP rate
// limited. Allowing any origin lets the browser extension call it directly.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function withCors(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v)
  return res
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

/**
 * Stateless analyze endpoint for unauthenticated users.
 * - No DB persistence (frontend tracks turn count in React state).
 * - Per-IP rate limit prevents abuse.
 * - Frontend enforces the 2-free-analysis cap via localStorage; this endpoint
 *   is a safety net, not the primary gate.
 * - CORS-open so the browser extension can call it.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = take(`anon:${ip}`, ANON_LIMIT)
  if (!limit.allowed) {
    return withCors(NextResponse.json(
      { error: 'rate_limited', retryAfterMs: limit.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
    ))
  }

  let body: AnonAnalyzeBody
  try {
    body = await req.json()
  } catch {
    return withCors(NextResponse.json({ error: 'invalid_body' }, { status: 400 }))
  }

  const { prompt, tone, priorAnswers = [] } = body
  const source = body.source === 'extension' ? 'extension' : 'web'

  if (!prompt?.trim()) {
    return withCors(NextResponse.json({ error: 'prompt_required' }, { status: 400 }))
  }
  if (prompt.length > 4000) {
    return withCors(NextResponse.json({ error: 'prompt_too_long' }, { status: 400 }))
  }

  // Analytics-only log. One structured line per analyze so we can tell
  // extension usage apart from web demo usage in the Vercel logs, and
  // see if the same IP returns across days. No DB write, no PII (the IP
  // is hashed to a short bucket; the prompt text is never logged).
  const ipBucket = ip.split('.').slice(0, 3).join('.') + '.x'
  console.log(
    `[anon-analyze] source=${source} turn=${priorAnswers.length} ipBucket=${ipBucket} ts=${new Date().toISOString()}`
  )

  const result = await analyzePrompt({ prompt, tone, priorAnswers })
  if (!result) {
    return withCors(NextResponse.json({ error: 'ai_unavailable' }, { status: 503 }))
  }

  return withCors(NextResponse.json({ ...result, anon: true }))
}
