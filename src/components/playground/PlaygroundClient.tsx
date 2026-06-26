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
import type { UsageInfo } from '@/types'

const ANON_LIMIT = 2
const ANON_EXTRA_KEY = 'pc_anon_extra'
const ANON_KEY = 'pc_anon_count'

interface PlaygroundClientProps {
  isSignedIn: boolean
  usage?: UsageInfo
}

export function PlaygroundClient({ isSignedIn, usage }: PlaygroundClientProps) {
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
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-10">
      <header>
        <p className="eyebrow mb-4">Playground</p>
        <h1
          className="display text-3xl md:text-5xl"
          style={{ color: 'var(--color-paper)' }}
        >
          {isAnon ? (
            <>Bring your worst prompt.</>
          ) : (
            <>Bring your prompt. <span className="tracking-tight" style={{ color: 'var(--color-paper-mute)' }}>We improve it.</span></>
          )}
        </h1>
        <p className="mt-4 text-base md:text-lg leading-[1.55] max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
          {isAnon
            ? `${Math.max(0, effectiveLimit - anonCount)} of ${effectiveLimit} free rewrites left this session.`
            : 'Paste anything - a rough idea, a one-liner, a request you have not finished writing. We catch what is missing and rewrite for clarity.'}
        </p>
      </header>

      {/* Inline usage note - only when free tier and ≥80% used. Quiet, contextual, on the page they're using. */}
      {!isAnon && usage && usage.tier === 'free' && usage.limit && usage.used / usage.limit >= 0.8 && (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3" style={{ borderTop: '1px solid var(--color-rule-strong)', borderBottom: '1px solid var(--color-rule-strong)' }}>
          <p className="text-sm" style={{ color: usage.isAtLimit ? '#C25E5E' : 'var(--color-accent)' }}>
            {usage.isAtLimit
              ? `You've used all ${usage.limit} free analyses this month.`
              : `You've used ${usage.used} of ${usage.limit} free analyses this month.`}
          </p>
          <button
            onClick={() => setPaywallOpen(true)}
            className="text-sm underline-offset-4 hover:underline transition-all"
            style={{ color: 'var(--color-paper)' }}
          >
            Upgrade to Pro for unlimited →
          </button>
        </div>
      )}

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
              maxTurns={2}
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
          className="py-6"
          style={{ borderTop: '1px solid var(--color-rule-strong)', borderBottom: '1px solid var(--color-rule-strong)' }}
        >
          <p className="eyebrow mb-2" style={{ color: '#C25E5E' }}>Hold on</p>
          <p
            className="font-serif text-xl md:text-2xl"
            style={{ color: 'var(--color-paper)', lineHeight: 1.4, fontWeight: 400 }}
          >
            {session.error === 'rate_limited'
              ? 'Slow down a moment - try again in a few seconds.'
              : session.error === 'network'
              ? 'Network hiccup. Check your connection and try again.'
              : session.error === 'ai_unavailable'
              ? 'The AI service is briefly unreachable. Try again in a moment.'
              : session.error === 'session_lost' || session.error === 'session_not_found'
              ? 'Your session expired. Start a new analysis.'
              : 'Something went sideways on our end. Try again.'}
          </p>
          <button
            onClick={handleReset}
            className="mt-4 text-sm underline-offset-4 hover:underline transition-all"
            style={{ color: 'var(--color-paper)' }}
          >
            Try again
          </button>
        </motion.div>
      )}

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  )
}
