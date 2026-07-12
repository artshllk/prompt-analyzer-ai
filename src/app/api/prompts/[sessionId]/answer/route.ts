import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzePrompt } from '@/lib/engine'
import { addClarificationExchange, updateSessionStatus, saveImprovement, getSessionWithDetails } from '@/lib/db/sessions'
import { recordDeepUsage, isAtDeepLimit } from '@/lib/db/usage'

interface AnswerBody {
  answer: string
  turn: number
  /** Carried through from the client so a Deep Rewrite session stays deep. */
  deep?: boolean
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

  // Tier gates both the Pro rewrite model and Deep Rewrite; re-check it
  // rather than trusting the client.
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()
  const isProUser = profile?.tier === 'pro'
  let deep = body.deep === true && isProUser
  if (deep && (await isAtDeepLimit(user.id))) deep = false

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

  // Re-analyze with accumulated context
  const result = await analyzePrompt({
    prompt: session.originalPrompt,
    tone: session.tone,
    priorAnswers,
    deep,
    pro: isProUser,
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
  } else if (result.type === 'improved') {
    await saveImprovement({
      sessionId,
      improvedPrompt: result.improvedPrompt,
      explanation: result.explanation,
      improvementTags: result.improvementTags,
      analysis: {
        minimalEdit: result.minimalEdit,
        template: result.template,
        audit: result.audit,
        critique: result.critique,
        intent: result.intent,
      },
    })

    await updateSessionStatus(sessionId, 'completed', {
      finalPrompt: result.improvedPrompt,
      clarityScoreAfter: result.clarityScoreAfter,
      clarifyTurns: priorAnswers.length,
    })

    if (deep) await recordDeepUsage(user.id)
  }

  return NextResponse.json({ ...result, sessionId })
}
