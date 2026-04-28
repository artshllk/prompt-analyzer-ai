import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzePrompt } from '@/lib/engine'
import { addClarificationExchange, updateSessionStatus, saveImprovement, getSessionWithDetails } from '@/lib/db/sessions'

interface AnswerBody {
  answer: string
  turn: number
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

  return NextResponse.json({ ...result, sessionId })
}
