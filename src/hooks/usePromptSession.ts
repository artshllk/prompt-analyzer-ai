'use client'

import { useState, useCallback, useRef } from 'react'
import type { Tone, ImprovementTag } from '@/types/database'
import type { QAPair, ForkOption, RubricAudit } from '@/types'

export type SessionStage =
  | 'idle'
  | 'analyzing'
  | 'clarifying'
  | 'improving'
  | 'done'
  | 'already_good'
  | 'error'

interface ClarifyingState {
  question: string
  targetsGap: string
  /** Interpretation forks offered as one-click answers. */
  options: ForkOption[]
  confidenceSoFar: number
  scoreBeforeImprovement: number
  audit: RubricAudit | null
  turn: number
}

interface ImprovedState {
  improvedPrompt: string
  minimalEdit: string | null
  template: string | null
  explanation: string
  improvementTags: ImprovementTag[]
  clarityScoreAfter: number
  scoreBeforeImprovement: number
  audit: RubricAudit | null
  critique: string | null
}

interface AlreadyGoodState {
  message: string
  tweaks: string[]
  scoreBeforeImprovement: number
  audit: RubricAudit | null
}

interface SessionState {
  stage: SessionStage
  sessionId: string | null
  clarifying: ClarifyingState | null
  improved: ImprovedState | null
  alreadyGood: AlreadyGoodState | null
  priorAnswers: QAPair[]
  error: string | null
}

const INITIAL_STATE: SessionState = {
  stage: 'idle',
  sessionId: null,
  clarifying: null,
  improved: null,
  alreadyGood: null,
  priorAnswers: [],
  error: null,
}

interface UsePromptSessionOptions {
  /** When true, calls the unauthenticated /api/anon/analyze endpoint and tracks count locally. */
  anonymous?: boolean
}

interface AnalyzeOutcome {
  usageLimitReached: boolean
  usage?: unknown
  /** 'already_good' analyses are free - the caller must not count them. */
  resultType?: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toImproved(data: any): ImprovedState {
  return {
    improvedPrompt: data.improvedPrompt,
    minimalEdit: data.minimalEdit ?? null,
    template: data.template ?? null,
    explanation: data.explanation,
    improvementTags: data.improvementTags ?? [],
    clarityScoreAfter: data.clarityScoreAfter,
    scoreBeforeImprovement: data.scoreBeforeImprovement,
    audit: data.audit ?? null,
    critique: data.critique ?? null,
  }
}

function toClarifying(data: any, turn: number): ClarifyingState {
  return {
    question: data.question,
    targetsGap: data.targetsGap,
    options: data.options ?? [],
    confidenceSoFar: data.confidenceSoFar,
    scoreBeforeImprovement: data.scoreBeforeImprovement,
    audit: data.audit ?? null,
    turn,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function usePromptSession(options: UsePromptSessionOptions = {}) {
  const { anonymous = false } = options
  const [state, setState] = useState<SessionState>(INITIAL_STATE)

  const sessionIdRef = useRef<string | null>(null)
  const clarifyingRef = useRef<ClarifyingState | null>(null)
  const priorAnswersRef = useRef<QAPair[]>([])
  const promptRef = useRef<string>('')
  const toneRef = useRef<Tone>('professional')
  const deepRef = useRef<boolean>(false)

  const apply = useCallback((next: Partial<SessionState>) => {
    setState(prev => {
      const merged = { ...prev, ...next }
      sessionIdRef.current = merged.sessionId
      clarifyingRef.current = merged.clarifying
      priorAnswersRef.current = merged.priorAnswers
      return merged
    })
  }, [])

  const analyze = useCallback(async (prompt: string, tone: Tone, deep = false): Promise<AnalyzeOutcome | null> => {
    promptRef.current = prompt
    toneRef.current = tone
    deepRef.current = deep && !anonymous
    apply({
      stage: 'analyzing',
      error: null,
      priorAnswers: [],
      clarifying: null,
      improved: null,
      alreadyGood: null,
      sessionId: null,
    })

    const endpoint = anonymous ? '/api/anon/analyze' : '/api/prompts/analyze'

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, priorAnswers: [], deep: deepRef.current }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'usage_limit') {
          apply({ stage: 'error', error: 'usage_limit' })
          return { usageLimitReached: true, usage: data.usage }
        }
        if (data.error === 'rate_limited') {
          apply({ stage: 'error', error: 'rate_limited' })
          return null
        }
        apply({ stage: 'error', error: data.error ?? 'unknown' })
        return null
      }

      if (data.type === 'clarifying') {
        apply({
          stage: 'clarifying',
          sessionId: data.sessionId ?? null,
          clarifying: toClarifying(data, 1),
        })
      } else if (data.type === 'already_good') {
        apply({
          stage: 'already_good',
          sessionId: null,
          alreadyGood: {
            message: data.message,
            tweaks: data.tweaks ?? [],
            scoreBeforeImprovement: data.scoreBeforeImprovement,
            audit: data.audit ?? null,
          },
        })
      } else {
        apply({
          stage: 'done',
          sessionId: data.sessionId ?? null,
          improved: toImproved(data),
        })
      }
      return { usageLimitReached: false, usage: data.usage, resultType: data.type }
    } catch {
      apply({ stage: 'error', error: 'network' })
    }

    return null
  }, [apply, anonymous])

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
      // Anon mode + no-session-yet path → always go through the stateless analyze endpoint.
      const useAnon = anonymous || !sessionId
      const url = useAnon
        ? (anonymous ? '/api/anon/analyze' : '/api/prompts/analyze')
        : `/api/prompts/${sessionId}/answer`

      const body = useAnon
        ? {
            prompt: promptRef.current,
            tone: toneRef.current,
            priorAnswers: newPriorAnswers,
            deep: deepRef.current,
          }
        : { answer, turn: clarifying.turn, deep: deepRef.current }

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
          clarifying: toClarifying(data, clarifying.turn + 1),
        })
      } else {
        // Continuation turns never return already_good (the engine owes a
        // rewrite once it asked a question), so everything else is improved.
        apply({
          stage: 'done',
          sessionId: data.sessionId ?? sessionId,
          improved: toImproved(data),
        })
      }
    } catch {
      apply({ stage: 'error', error: 'network' })
    }
  }, [apply, anonymous])

  const reset = useCallback(() => {
    sessionIdRef.current = null
    clarifyingRef.current = null
    priorAnswersRef.current = []
    promptRef.current = ''
    deepRef.current = false
    setState(INITIAL_STATE)
  }, [])

  return { ...state, analyze, submitAnswer, reset }
}
