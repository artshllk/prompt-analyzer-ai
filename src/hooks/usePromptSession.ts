'use client'

import { useState, useCallback, useRef } from 'react'
import type { Tone, ImprovementTag } from '@/types/database'
import type { QAPair } from '@/types'

export type SessionStage = 'idle' | 'analyzing' | 'clarifying' | 'improving' | 'done' | 'error'

interface ClarifyingState {
  question: string
  targetsGap: string
  confidenceSoFar: number
  scoreBeforeImprovement: number
  turn: number
}

interface ImprovedState {
  improvedPrompt: string
  explanation: string
  improvementTags: ImprovementTag[]
  clarityScoreAfter: number
  scoreBeforeImprovement: number
}

interface SessionState {
  stage: SessionStage
  sessionId: string | null
  clarifying: ClarifyingState | null
  improved: ImprovedState | null
  priorAnswers: QAPair[]
  error: string | null
}

const INITIAL_STATE: SessionState = {
  stage: 'idle',
  sessionId: null,
  clarifying: null,
  improved: null,
  priorAnswers: [],
  error: null,
}

export function usePromptSession() {
  const [state, setState] = useState<SessionState>(INITIAL_STATE)

  // Refs for current values — avoids stale closures inside async callbacks.
  const sessionIdRef = useRef<string | null>(null)
  const clarifyingRef = useRef<ClarifyingState | null>(null)
  const priorAnswersRef = useRef<QAPair[]>([])
  const promptRef = useRef<string>('')
  const toneRef = useRef<Tone>('professional')

  const apply = useCallback((next: Partial<SessionState>) => {
    setState(prev => {
      const merged = { ...prev, ...next }
      sessionIdRef.current = merged.sessionId
      clarifyingRef.current = merged.clarifying
      priorAnswersRef.current = merged.priorAnswers
      return merged
    })
  }, [])

  const analyze = useCallback(async (prompt: string, tone: Tone) => {
    promptRef.current = prompt
    toneRef.current = tone
    apply({ stage: 'analyzing', error: null, priorAnswers: [], clarifying: null, improved: null, sessionId: null })

    try {
      const res = await fetch('/api/prompts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, priorAnswers: [] }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'usage_limit') {
          apply({ stage: 'error', error: 'usage_limit' })
          return { usageLimitReached: true, usage: data.usage }
        }
        apply({ stage: 'error', error: data.error ?? 'unknown' })
        return null
      }

      if (data.type === 'clarifying') {
        apply({
          stage: 'clarifying',
          sessionId: data.sessionId ?? null,
          clarifying: {
            question: data.question,
            targetsGap: data.targetsGap,
            confidenceSoFar: data.confidenceSoFar,
            scoreBeforeImprovement: data.scoreBeforeImprovement,
            turn: 1,
          },
        })
      } else {
        apply({
          stage: 'done',
          sessionId: data.sessionId ?? null,
          improved: {
            improvedPrompt: data.improvedPrompt,
            explanation: data.explanation,
            improvementTags: data.improvementTags,
            clarityScoreAfter: data.clarityScoreAfter,
            scoreBeforeImprovement: data.scoreBeforeImprovement,
          },
        })
      }
    } catch {
      apply({ stage: 'error', error: 'network' })
    }

    return null
  }, [apply])

  const submitAnswer = useCallback(async (answer: string) => {
    const sessionId = sessionIdRef.current
    const clarifying = clarifyingRef.current
    const priorAnswers = priorAnswersRef.current

    if (!clarifying) {
      apply({ stage: 'error', error: 'session_lost' })
      return
    }

    const newPriorAnswers: QAPair[] = [
      ...priorAnswers,
      { question: clarifying.question, answer, turn: clarifying.turn },
    ]

    apply({ stage: 'improving', error: null, priorAnswers: newPriorAnswers })

    try {
      // Prefer the session-scoped answer endpoint; fall back to /analyze if the
      // session was never persisted (e.g. DB outage on first call).
      const url = sessionId
        ? `/api/prompts/${sessionId}/answer`
        : '/api/prompts/analyze'

      const body = sessionId
        ? { answer, turn: clarifying.turn }
        : {
            prompt: promptRef.current,
            tone: toneRef.current,
            priorAnswers: newPriorAnswers,
          }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        apply({ stage: 'error', error: data.error ?? 'unknown' })
        return
      }

      if (data.type === 'clarifying') {
        apply({
          stage: 'clarifying',
          sessionId: data.sessionId ?? sessionId,
          clarifying: {
            question: data.question,
            targetsGap: data.targetsGap,
            confidenceSoFar: data.confidenceSoFar,
            scoreBeforeImprovement: data.scoreBeforeImprovement,
            turn: clarifying.turn + 1,
          },
        })
      } else {
        apply({
          stage: 'done',
          sessionId: data.sessionId ?? sessionId,
          improved: {
            improvedPrompt: data.improvedPrompt,
            explanation: data.explanation,
            improvementTags: data.improvementTags,
            clarityScoreAfter: data.clarityScoreAfter,
            scoreBeforeImprovement: data.scoreBeforeImprovement,
          },
        })
      }
    } catch {
      apply({ stage: 'error', error: 'network' })
    }
  }, [apply])

  const reset = useCallback(() => {
    sessionIdRef.current = null
    clarifyingRef.current = null
    priorAnswersRef.current = []
    promptRef.current = ''
    setState(INITIAL_STATE)
  }, [])

  return { ...state, analyze, submitAnswer, reset }
}
