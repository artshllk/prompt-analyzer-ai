'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PromptEditor } from '@/components/playground/PromptEditor'
import { ClarifyPanel } from '@/components/playground/ClarifyPanel'
import { AnalysisPanel } from '@/components/playground/AnalysisPanel'
import { ProgressiveStatus } from '@/components/playground/ProgressiveStatus'
import { PaywallModal } from '@/components/ui/PaywallModal'
import { usePromptSession } from '@/hooks/usePromptSession'
import type { Tone } from '@/types/database'

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState<Tone>('professional')
  const [paywallOpen, setPaywallOpen] = useState(false)

  const session = usePromptSession()

  async function handleAnalyze() {
    if (!prompt.trim()) return
    const result = await session.analyze(prompt, tone)
    if (result?.usageLimitReached) {
      setPaywallOpen(true)
    }
  }

  function handleReset() {
    session.reset()
    setPrompt('')
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Prompt Playground</h1>
        <p className="text-sm text-[#8b9cc8] mt-1">
          Enter a prompt. I&apos;ll coach you to make it significantly better.
        </p>
      </div>

      {/* Editor — always shown unless done */}
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

      {/* Clarifying question — stays mounted while answer is in flight so user keeps context */}
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

      {/* Top-of-flow analyzer state (initial click only — clarify panel has its own spinner) */}
      {session.stage === 'analyzing' && (
        <ProgressiveStatus mode="analyzing" />
      )}
      {session.stage === 'improving' && !session.clarifying && (
        <ProgressiveStatus mode="improving" />
      )}

      {/* Results */}
      <AnimatePresence>
        {session.stage === 'done' && session.improved && (
          <AnalysisPanel
            originalPrompt={prompt}
            improvedPrompt={session.improved.improvedPrompt}
            explanation={session.improved.explanation}
            improvementTags={session.improved.improvementTags}
            clarityScoreBefore={session.improved.scoreBeforeImprovement}
            clarityScoreAfter={session.improved.clarityScoreAfter}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>

      {/* Error */}
      {session.stage === 'error' && session.error !== 'usage_limit' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 py-4 rounded-2xl border border-red-500/20 bg-red-500/5"
        >
          <p className="text-sm text-red-400">
            {session.error === 'network'
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
