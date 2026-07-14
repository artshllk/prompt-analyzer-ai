import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { SessionWithDetails } from '@/types'
import type { Tone, SessionStatus } from '@/types/database'

/**
 * Record a completed extension sharpen as a session.
 *
 * The extension authenticates with a bearer token, not a cookie, so it
 * cannot use the cookie-scoped helpers below - hence the service client.
 *
 * This exists because History and Insights read `prompt_sessions`, and
 * until now ONLY the website playground wrote to it. With the playground
 * gone, the extension is the sole source of history: if it does not write
 * here, the account area is empty forever.
 *
 * Fire-and-forget: a failed write must never break the user's rewrite.
 */
export async function recordExtensionSession(params: {
  userId: string
  originalPrompt: string
  finalPrompt: string
  tone: Tone
  /** The interpretation they picked, when the prompt was ambiguous. */
  choice?: string
}): Promise<void> {
  try {
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('prompt_sessions')
      .insert({
        user_id: params.userId,
        original_prompt: params.originalPrompt,
        final_prompt: params.finalPrompt,
        tone: params.tone,
        status: 'completed',
        clarify_turns: params.choice ? 1 : 0,
        // The fast path deliberately does not score - that is what keeps it
        // under a second. The score arrives later, when the user opens the
        // why? panel (which runs the diagnosis), and backfills these.
        clarity_score_before: null,
        clarity_score_after: null,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[sessions] extension session insert failed:', error?.message)
      return
    }

    // The chosen interpretation is the one thing the user actively decided.
    // Storing it as the clarification exchange keeps History honest about
    // what was asked and what they said.
    if (params.choice) {
      await supabase.from('clarification_exchanges').insert({
        session_id: data.id,
        turn: 1,
        ai_question: 'Which reading did you mean?',
        user_answer: params.choice,
        // The fast path has no confidence score - it does not run the
        // diagnosis. Null rather than a made-up number.
        confidence_before: null,
        confidence_after: null,
      })
    }

    await supabase.from('prompt_improvements').insert({
      session_id: data.id,
      improved_prompt: params.finalPrompt,
      explanation: '',
      improvement_tags: [],
    })
  } catch (err) {
    console.error('[sessions] recordExtensionSession threw:', (err as Error).message)
  }
}

/**
 * Backfill a session with what the diagnosis learned.
 *
 * The fast path does not score (that is what keeps it fast), so sessions
 * land with null scores. When the user opens the why? panel we DO run the
 * diagnosis - so we attach the score and the gaps to the session they were
 * looking at. This is what turns History from a log into something you can
 * learn from, and it is what Insights aggregates over.
 *
 * Matches the newest completed session for this exact original prompt.
 * Fire-and-forget.
 */
export async function attachDiagnosis(params: {
  userId: string
  originalPrompt: string
  score: number
  /** What the diagnosis found was still missing. */
  gaps: unknown
}): Promise<void> {
  try {
    const supabase = await createServiceClient()

    const { data: session } = await supabase
      .from('prompt_sessions')
      .select('id')
      .eq('user_id', params.userId)
      .eq('original_prompt', params.originalPrompt)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!session) return

    await supabase
      .from('prompt_sessions')
      .update({ clarity_score_before: params.score })
      .eq('id', session.id)

    await supabase
      .from('prompt_improvements')
      .update({ analysis: { gaps: params.gaps } })
      .eq('session_id', session.id)
  } catch (err) {
    console.error('[sessions] attachDiagnosis threw:', (err as Error).message)
  }
}

/**
 * The user answered the missing-detail questions, so the prompt improved
 * again. History must show what they actually walked away with.
 * Fire-and-forget.
 */
export async function updateFinalPrompt(params: {
  userId: string
  originalPrompt: string
  finalPrompt: string
}): Promise<void> {
  try {
    const supabase = await createServiceClient()

    const { data: session } = await supabase
      .from('prompt_sessions')
      .select('id')
      .eq('user_id', params.userId)
      .eq('original_prompt', params.originalPrompt)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!session) return

    await supabase
      .from('prompt_sessions')
      .update({ final_prompt: params.finalPrompt })
      .eq('id', session.id)

    await supabase
      .from('prompt_improvements')
      .update({ improved_prompt: params.finalPrompt })
      .eq('session_id', session.id)
  } catch (err) {
    console.error('[sessions] updateFinalPrompt threw:', (err as Error).message)
  }
}

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
