'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PromptEditor } from '@/components/playground/PromptEditor'
import { ClarifyPanel } from '@/components/playground/ClarifyPanel'
import { AnalysisPanel } from '@/components/playground/AnalysisPanel'
import { ProgressiveStatus } from '@/components/playground/ProgressiveStatus'
import { SignupGate } from '@/components/playground/SignupGate'
import { PaywallModal } from '@/components/ui/PaywallModal'
import { usePromptSession } from '@/hooks/usePromptSession'
import type { Tone } from '@/types/database'

const ANON_LIMIT = 2
const ANON_EXTRA_KEY = 'pc_anon_extra'
const ANON_KEY = 'pc_anon_count'

interface PlaygroundClientProps {
  isSignedIn: boolean
}

export function PlaygroundClient({ isSignedIn }: PlaygroundClientProps) {
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState<Tone>('professional')
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [anonCount, setAnonCount] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  const session = usePromptSession({ anonymous: !isSignedIn })

  useEffect(() => {
    if (!isSignedIn) {
      const raw = window.localStorage.getItem(ANON_KEY)
      const parsed = raw ? parseInt(raw, 10) : 0
      setAnonCount(Number.isFinite(parsed) ? parsed : 0)
    }
    setHydrated(true)
  }, [isSignedIn])

  const isAnon = !isSignedIn
  const extraAnalyses = hydrated ? parseInt(window.localStorage.getItem(ANON_EXTRA_KEY) ?? '0', 10) || 0 : 0
  const effectiveLimit = ANON_LIMIT + extraAnalyses
  const anonGated = isAnon && hydrated && anonCount >= effectiveLimit && session.stage === 'idle'

  function handleEmailCaptured(extra: number) {
    const current = parseInt(window.localStorage.getItem(ANON_EXTRA_KEY) ?? '0', 10) || 0
    window.localStorage.setItem(ANON_EXTRA_KEY, String(current + extra))
  }

  async function handleAnalyze() {
    if (!prompt.trim()) return
    if (isAnon && anonCount >= effectiveLimit) return

    const result = await session.analyze(prompt, tone)

    if (isAnon) {
      const next = anonCount + 1
      setAnonCount(next)
      window.localStorage.setItem(ANON_KEY, String(next))
    }

    if (result?.usageLimitReached) setPaywallOpen(true)
  }

  function handleReset() {
    session.reset()
    setPrompt('')
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Prompt Playground</h1>
        <p className="text-sm text-[#8b9cc8] mt-1">
          {isAnon
            ? `Try it free — ${Math.max(0, effectiveLimit - anonCount)} of ${effectiveLimit} analyses left, no signup needed.`
            : "Enter a prompt. I'll coach you to make it significantly better."}
        </p>
      </div>

      {anonGated ? (
        <SignupGate used={anonCount} limit={effectiveLimit} onEmailCaptured={handleEmailCaptured} />
      ) : (
        <AnimatePresence>
          {session.stage !== 'done' && (
            <motion.div
              initial={false}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PromptEditor
                value={prompt}
                onChange={setPrompt}
                tone={tone}
                onToneChange={setTone}
                onSubmit={handleAnalyze}
                stage={session.stage}
                charCount={prompt.length}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <AnimatePresence mode="wait">
        {(session.stage === 'clarifying' || session.stage === 'improving') && session.clarifying && (
          <motion.div
            key={`clarify-${session.clarifying.turn}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ClarifyPanel
              question={session.clarifying.question}
              turn={session.clarifying.turn}
              maxTurns={3}
              confidenceSoFar={session.clarifying.confidenceSoFar}
              onSubmit={session.submitAnswer}
              isLoading={session.stage === 'improving'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {session.stage === 'analyzing' && <ProgressiveStatus mode="analyzing" />}
      {session.stage === 'improving' && !session.clarifying && <ProgressiveStatus mode="improving" />}

      <AnimatePresence>
        {session.stage === 'done' && session.improved && (
          <>
            <AnalysisPanel
              originalPrompt={prompt}
              improvedPrompt={session.improved.improvedPrompt}
              explanation={session.improved.explanation}
              improvementTags={session.improved.improvementTags}
              clarityScoreBefore={session.improved.scoreBeforeImprovement}
              clarityScoreAfter={session.improved.clarityScoreAfter}
              onReset={handleReset}
            />
            {isAnon && anonCount >= ANON_LIMIT && (
              <SignupGate used={anonCount} limit={effectiveLimit} onEmailCaptured={handleEmailCaptured} />
            )}
          </>
        )}
      </AnimatePresence>

      {session.stage === 'error' && session.error !== 'usage_limit' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 py-4 rounded-2xl border border-red-500/20 bg-red-500/5"
        >
          <p className="text-sm text-red-400">
            {session.error === 'rate_limited'
              ? 'You\'re going a bit fast. Try again in a moment.'
              : session.error === 'network'
              ? 'Network error. Please check your connection and try again.'
              : session.error === 'ai_unavailable'
              ? 'AI service is temporarily unavailable. Please try again in a moment.'
              : session.error === 'session_lost' || session.error === 'session_not_found'
              ? 'Your session expired. Please start a new analysis.'
              : 'Something went wrong. Please try again.'}
          </p>
          <button
            onClick={handleReset}
            className="mt-2 text-xs text-red-400/70 hover:text-red-400 underline transition-colors"
          >
            Try again
          </button>
        </motion.div>
      )}

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  )
}
