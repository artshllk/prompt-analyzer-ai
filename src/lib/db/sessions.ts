import { createClient } from '@/lib/supabase/server'
import type { SessionWithDetails } from '@/types'
import type { Tone, SessionStatus } from '@/types/database'

export async function createSession(params: {
  userId: string
  originalPrompt: string
  tone: Tone
  clarityScoreBefore: number
}): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('prompt_sessions')
    .insert({
      user_id: params.userId,
      original_prompt: params.originalPrompt,
      tone: params.tone,
      status: 'clarifying',
      clarity_score_before: params.clarityScoreBefore,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createSession error:', error)
    return null
  }
  return data.id
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  extra?: { finalPrompt?: string; clarityScoreAfter?: number; clarifyTurns?: number }
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('prompt_sessions')
    .update({
      status,
      ...(extra?.finalPrompt && { final_prompt: extra.finalPrompt }),
      ...(extra?.clarityScoreAfter !== undefined && { clarity_score_after: extra.clarityScoreAfter }),
      ...(extra?.clarifyTurns !== undefined && { clarify_turns: extra.clarifyTurns }),
    })
    .eq('id', sessionId)
}

export async function addClarificationExchange(params: {
  sessionId: string
  turn: number
  aiQuestion: string
  userAnswer?: string
  confidenceBefore?: number
  confidenceAfter?: number
}): Promise<void> {
  const supabase = await createClient()
  await supabase.from('clarification_exchanges').upsert({
    session_id: params.sessionId,
    turn: params.turn,
    ai_question: params.aiQuestion,
    user_answer: params.userAnswer ?? null,
    confidence_before: params.confidenceBefore ?? null,
    confidence_after: params.confidenceAfter ?? null,
  }, { onConflict: 'session_id,turn' })
}

export async function saveImprovement(params: {
  sessionId: string
  improvedPrompt: string
  explanation: string
  improvementTags: string[]
  /** Pipeline extras (minimal edit, template, rubric audit, critique, intent). */
  analysis?: Record<string, unknown>
}): Promise<void> {
  const supabase = await createClient()
  const row = {
    session_id: params.sessionId,
    improved_prompt: params.improvedPrompt,
    explanation: params.explanation,
    improvement_tags: params.improvementTags as import('@/types/database').ImprovementTag[],
  }

  // The analysis JSONB column arrives with migration 006. Until it has
  // run in an environment, fall back to inserting without it so the core
  // improvement is never lost to a schema mismatch.
  if (params.analysis) {
    const { error } = await supabase
      .from('prompt_improvements')
      .insert({ ...row, analysis: params.analysis })
    if (!error) return
    console.error('saveImprovement with analysis failed, retrying without:', error.message)
  }
  await supabase.from('prompt_improvements').insert(row)
}

export async function getSessionWithDetails(
  sessionId: string,
  userId: string
): Promise<SessionWithDetails | null> {
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('prompt_sessions')
    .select(`
      *,
      clarification_exchanges(*),
      prompt_improvements(*)
    `)
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (error || !session) return null

  const exchanges = ((session.clarification_exchanges as unknown) as Array<{
    turn: number
    ai_question: string
    user_answer: string | null
  }> ?? []).sort((a, b) => a.turn - b.turn)

  const imp = ((session.prompt_improvements as unknown) as Array<{
    improved_prompt: string
    explanation: string
    improvement_tags: string[]
  }>)?.[0]

  return {
    id: session.id,
    originalPrompt: session.original_prompt,
    finalPrompt: session.final_prompt,
    tone: session.tone as Tone,
    status: session.status as SessionStatus,
    clarityScoreBefore: session.clarity_score_before,
    clarityScoreAfter: session.clarity_score_after,
    clarifyTurns: session.clarify_turns,
    createdAt: session.created_at,
    exchanges: exchanges.map(e => ({
      turn: e.turn,
      question: e.ai_question,
      answer: e.user_answer,
    })),
    improvement: imp ? {
      improvedPrompt: imp.improved_prompt,
      explanation: imp.explanation,
      improvementTags: imp.improvement_tags as import('@/types/database').ImprovementTag[],
    } : null,
  }
}

export async function getUserSessions(
  userId: string,
  limit = 20,
  offset = 0,
  /** ISO timestamp - only sessions created at or after this moment (free-tier history cap). */
  since?: string
): Promise<{ sessions: SessionWithDetails[]; total: number }> {
  const supabase = await createClient()

  let listQuery = supabase
    .from('prompt_sessions')
    .select(`
      *,
      clarification_exchanges(turn, ai_question, user_answer),
      prompt_improvements(improved_prompt, explanation, improvement_tags)
    `)
    .eq('user_id', userId)
  let countQuery = supabase
    .from('prompt_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (since) {
    listQuery = listQuery.gte('created_at', since)
    countQuery = countQuery.gte('created_at', since)
  }

  const [sessionsResult, countResult] = await Promise.all([
    listQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    countQuery,
  ])

  const sessions = (sessionsResult.data ?? []).map(session => {
    const exchanges = ((session.clarification_exchanges as unknown) as Array<{
      turn: number
      ai_question: string
      user_answer: string | null
    }> ?? []).sort((a, b) => a.turn - b.turn)

    const imp = ((session.prompt_improvements as unknown) as Array<{
      improved_prompt: string
      explanation: string
      improvement_tags: string[]
    }>)?.[0]

    return {
      id: session.id,
      originalPrompt: session.original_prompt,
      finalPrompt: session.final_prompt,
      tone: session.tone as Tone,
      status: session.status as SessionStatus,
      clarityScoreBefore: session.clarity_score_before,
      clarityScoreAfter: session.clarity_score_after,
      clarifyTurns: session.clarify_turns,
      createdAt: session.created_at,
      exchanges: exchanges.map(e => ({
        turn: e.turn,
        question: e.ai_question,
        answer: e.user_answer,
      })),
      improvement: imp ? {
        improvedPrompt: imp.improved_prompt,
        explanation: imp.explanation,
        improvementTags: imp.improvement_tags as import('@/types/database').ImprovementTag[],
      } : null,
    } satisfies SessionWithDetails
  })

  return { sessions, total: countResult.count ?? 0 }
}
