import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzePrompt } from '@/lib/engine'
import { getUsageInfo, recordUsage } from '@/lib/db/usage'
import { createSession, updateSessionStatus, addClarificationExchange, saveImprovement } from '@/lib/db/sessions'
import { take, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { compileContextBrief } from '@/lib/context/compile'
import type { Tone } from '@/types/database'
import type { QAPair } from '@/types'

interface AnalyzeBody {
  prompt: string
  tone: Tone
  sessionId?: string
  priorAnswers?: QAPair[]
  deep?: boolean
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Tier decides the burst allowance (Pro priority processing), whether
  // Deep Rewrite is allowed, and the quota gate below.
  const usage = await getUsageInfo(user.id)
  const isProUser = usage.tier === 'pro'

  const burst = take(`user:${user.id}`, isProUser ? PRO_USER_LIMIT : USER_LIMIT)
  if (!burst.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterMs: burst.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(burst.retryAfterMs / 1000)) } }
    )
  }

  const body: AnalyzeBody = await req.json()
  const { prompt, tone, sessionId, priorAnswers = [] } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  if (body.deep && !isProUser) {
    return NextResponse.json({ error: 'pro_required' }, { status: 402 })
  }
  const deep = body.deep === true && isProUser

  // Charge usage once per logical analysis: first call (no sessionId, no priorAnswers).
  // Continuation calls (sessionId set, OR priorAnswers passed for fallback) don't re-charge.
  const isFreshAnalysis = !sessionId && priorAnswers.length === 0
  if (isFreshAnalysis && usage.isAtLimit) {
    return NextResponse.json({
      error: 'usage_limit',
      usage,
    }, { status: 402 })
  }

  // Portable Context Graph: compile the user's identity (+ Pro style
  // hints) into the rewrite. Only on a fresh analysis - continuation turns
  // reuse the same framing the first call established. Never fails the
  // request: no graph just means a context-free rewrite.
  const context = isFreshAnalysis
    ? await compileContextBrief(user.id, { isPro: isProUser }).catch(() => null)
    : null

  const result = await analyzePrompt({ prompt, tone, priorAnswers, deep, context })

  if (!result) {
    return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 })
  }

  // Persist to DB
  let activeSessionId = sessionId

  if (result.type === 'clarifying') {
    if (!activeSessionId && isFreshAnalysis) {
      activeSessionId = await createSession({
        userId: user.id,
        originalPrompt: prompt,
        tone,
        clarityScoreBefore: result.scoreBeforeImprovement,
      }) ?? undefined

      if (activeSessionId) await recordUsage(user.id)
    }

    if (activeSessionId) {
      await addClarificationExchange({
        sessionId: activeSessionId,
        turn: priorAnswers.length + 1,
        aiQuestion: result.question,
        confidenceBefore: result.confidenceSoFar,
      })
    }
  } else {
    if (!activeSessionId && isFreshAnalysis) {
      activeSessionId = await createSession({
        userId: user.id,
        originalPrompt: prompt,
        tone,
        clarityScoreBefore: result.scoreBeforeImprovement,
      }) ?? undefined

      if (activeSessionId) await recordUsage(user.id)
    }

    if (activeSessionId) {
      await saveImprovement({
        sessionId: activeSessionId,
        improvedPrompt: result.improvedPrompt,
        explanation: result.explanation,
        improvementTags: result.improvementTags,
      })

      await updateSessionStatus(activeSessionId, 'completed', {
        finalPrompt: result.improvedPrompt,
        clarityScoreAfter: result.clarityScoreAfter,
        clarifyTurns: priorAnswers.length,
      })
    }
  }

  return NextResponse.json({ ...result, sessionId: activeSessionId })
}
