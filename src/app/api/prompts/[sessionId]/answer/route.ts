import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzePrompt } from '@/lib/engine'
import { addClarificationExchange, updateSessionStatus, saveImprovement, getSessionWithDetails } from '@/lib/db/sessions'
import { compileContextBrief } from '@/lib/context/compile'
import { markMemoriesUsed } from '@/lib/context/graph'
import type { ContextApplied } from '@/types'

interface AnswerBody {
  answer: string
  turn: number
  /** Carried through from the client so a Deep Rewrite session stays deep. */
  deep?: boolean
  /** Carried through so a context-off session stays context-off. */
  useContext?: boolean
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { sessionId } = await params
  const body: AnswerBody = await req.json()
  const { answer, turn } = body

  if (!answer?.trim()) {
    return NextResponse.json({ error: 'answer is required' }, { status: 400 })
  }

  // Tier gates Deep Rewrite (re-checked, never trusted from the client)
  // and decides whether Pro style hints join the context brief.
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()
  const isPro = profile?.tier === 'pro'
  const deep = body.deep === true && isPro

  const session = await getSessionWithDetails(sessionId, user.id)
  if (!session) {
    return NextResponse.json(
      { error: 'session_not_found', message: 'This session is no longer available. Start a new analysis.' },
      { status: 404 }
    )
  }

  // Record user's answer to the current question
  await addClarificationExchange({
    sessionId,
    turn,
    aiQuestion: session.exchanges[turn - 1]?.question ?? '',
    userAnswer: answer,
  })

  // Build updated prior answers
  const priorAnswers = [
    ...session.exchanges.slice(0, turn - 1).map(e => ({
      question: e.question,
      answer: e.answer ?? '',
      turn: e.turn,
    })),
    {
      question: session.exchanges[turn - 1]?.question ?? '',
      answer,
      turn,
    },
  ]

  // The Context Graph must reach the FINAL rewrite too, and with a clarify
  // loop that rewrite lands here - each turn rebuilds the system prompt
  // from scratch, so skipping compile here would silently drop the user's
  // profile from the result. Fail-open like the fresh-analysis route.
  const context = body.useContext === false
    ? null
    : await compileContextBrief(user.id, { isPro }).catch(() => null)

  // Re-analyze with accumulated context
  const result = await analyzePrompt({
    prompt: session.originalPrompt,
    tone: session.tone,
    priorAnswers,
    deep,
    context,
  })

  if (!result) {
    return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 })
  }

  if (result.type === 'clarifying') {
    await addClarificationExchange({
      sessionId,
      turn: turn + 1,
      aiQuestion: result.question,
      confidenceBefore: result.confidenceSoFar,
    })
  } else {
    await saveImprovement({
      sessionId,
      improvedPrompt: result.improvedPrompt,
      explanation: result.explanation,
      improvementTags: result.improvementTags,
    })

    await updateSessionStatus(sessionId, 'completed', {
      finalPrompt: result.improvedPrompt,
      clarityScoreAfter: result.clarityScoreAfter,
      clarifyTurns: priorAnswers.length,
    })
  }

  const contextApplied: ContextApplied | null = context
    ? {
        identity: context.identity ?? [],
        memories: context.usedMemories ?? [],
        styleHints: context.styleHints ?? [],
      }
    : null
  // Awaited: on serverless, work started after the response can be frozen.
  if (context?.usedMemories?.length) {
    await markMemoriesUsed(user.id, context.usedMemories.map(m => m.id)).catch(() => {})
  }

  return NextResponse.json({ ...result, sessionId, contextApplied })
}
