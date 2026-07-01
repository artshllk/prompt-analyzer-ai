'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ToneDropdown } from '@/components/playground/ToneDropdown'
import { SignupGate } from '@/components/playground/SignupGate'
import { PaywallModal } from '@/components/ui/PaywallModal'
import { StreamOut } from '@/components/shared/StreamOut'
import { usePromptSession } from '@/hooks/usePromptSession'
import type { Tone } from '@/types/database'
import type { UsageInfo } from '@/types'

const ANON_LIMIT = 2
const ANON_KEY = 'pc_anon_count'

interface PlaygroundClientProps {
  isSignedIn: boolean
  usage?: UsageInfo
}

const SAMPLES = [
  'Write me a cover letter',
  'Summarize this article',
  'Help me debug this function',
]

export function PlaygroundClient({ isSignedIn, usage }: PlaygroundClientProps) {
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState<Tone>('professional')
  const [answer, setAnswer] = useState('')
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [anonCount, setAnonCount] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  const session = usePromptSession({ anonymous: !isSignedIn })
  const isAnon = !isSignedIn

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const answerRef = useRef<HTMLTextAreaElement>(null)
  const responseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isSignedIn) {
      const raw = window.localStorage.getItem(ANON_KEY)
      const parsed = raw ? parseInt(raw, 10) : 0
      setAnonCount(Number.isFinite(parsed) ? parsed : 0)
    }
    setHydrated(true)
  }, [isSignedIn])

  // Auto-grow inputs.
  useEffect(() => {
    const ta = inputRef.current
    if (!ta) return
    const MAX = 320
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, MAX)}px`
    ta.style.overflowY = ta.scrollHeight > MAX ? 'auto' : 'hidden'
  }, [prompt])

  useEffect(() => {
    if (session.stage !== 'clarifying') return
    answerRef.current?.focus()
  }, [session.stage])

  useEffect(() => {
    const ta = answerRef.current
    if (!ta) return
    const MAX = 200
    ta.style.height = 'auto'
    // Grow to fit, capped at MAX. Past the cap, let it scroll instead of
    // clipping - pasting a long answer must stay readable.
    ta.style.height = `${Math.min(ta.scrollHeight, MAX)}px`
    ta.style.overflowY = ta.scrollHeight > MAX ? 'auto' : 'hidden'
  }, [answer])

  // On mobile, bring the response into view when work begins.
  useEffect(() => {
    if (session.stage === 'analyzing' || session.stage === 'clarifying' || session.stage === 'done') {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        responseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [session.stage])

  const anonGated = isAnon && hydrated && anonCount >= ANON_LIMIT && session.stage === 'idle'
  const started = session.stage !== 'idle'
  const thinking = session.stage === 'analyzing' || session.stage === 'improving'

  async function handleAnalyze() {
    if (!prompt.trim() || thinking) return
    const result = await session.analyze(prompt, tone)
    if (isAnon) {
      const next = anonCount + 1
      setAnonCount(next)
      window.localStorage.setItem(ANON_KEY, String(next))
    }
    if (result?.usageLimitReached) setPaywallOpen(true)
  }

  function handleAnswer() {
    if (!answer.trim() || thinking) return
    session.submitAnswer(answer.trim())
    setAnswer('')
  }

  function handleReset() {
    session.reset()
    setPrompt('')
    setAnswer('')
  }

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-10 py-10 md:py-16">
      {/* Hero - H1 + one sentence. No paragraph. */}
      <header className="mb-8 md:mb-12">
        <h1 className="display text-3xl md:text-5xl tracking-tight" style={{ color: 'var(--color-paper)' }}>
          Sharpen your prompt.
        </h1>
        <p className="mt-3 text-base md:text-lg" style={{ color: 'var(--color-paper-mute)' }}>
          Paste anything. We rewrite it for ChatGPT, Claude, and Gemini.
        </p>
      </header>

      {/* Inline usage note - only for free tier ≥80% used. */}
      {!isAnon && usage && usage.tier === 'free' && usage.limit && usage.used / usage.limit >= 0.8 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 mb-6" style={{ borderTop: '1px solid var(--color-rule-strong)', borderBottom: '1px solid var(--color-rule-strong)' }}>
          <p className="text-sm" style={{ color: usage.isAtLimit ? '#C25E5E' : 'var(--color-accent)' }}>
            {usage.isAtLimit
              ? `You've used all ${usage.limit} free rewrites for now (resets within 48h).`
              : `${usage.limit - usage.used} of ${usage.limit} free rewrites left (48h window).`}
          </p>
          <button onClick={() => setPaywallOpen(true)} className="text-sm underline-offset-4 hover:underline transition-all" style={{ color: 'var(--color-paper)' }}>
            Upgrade to Pro →
          </button>
        </div>
      )}

      {anonGated ? (
        <SignupGate used={anonCount} limit={ANON_LIMIT} />
      ) : (
        <div className="grid md:grid-cols-2 gap-5 md:gap-6 items-start">
          {/* LEFT - the prompt. */}
          <div>
            <p className="eyebrow mb-3">Your prompt</p>
            <div
              className="rounded-2xl p-2.5"
              style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}
            >
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                disabled={started}
                placeholder="A rough idea, a one-liner, or a request you haven't finished writing…"
                rows={5}
                maxLength={4000}
                className="w-full bg-transparent resize-none p-3 text-[15px] sm:text-base outline-none disabled:opacity-60"
                style={{ color: 'var(--color-paper)', caretColor: 'var(--color-paper)', fontFamily: 'var(--font-inter)', lineHeight: 1.6 }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && !started) {
                    e.preventDefault()
                    handleAnalyze()
                  }
                }}
              />
              <div className="flex items-center justify-between gap-3 p-1.5 pt-2">
                <ToneDropdown value={tone} onChange={setTone} disabled={started} />
                {!started ? (
                  <button
                    onClick={handleAnalyze}
                    disabled={!prompt.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all btn-paper disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
                  >
                    Improve
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="text-sm transition-opacity hover:opacity-100 opacity-70 focus:opacity-100 px-2"
                    style={{ color: 'var(--color-paper-mute)' }}
                  >
                    New prompt
                  </button>
                )}
              </div>
            </div>

            {!started && (
              <div className="mt-4 flex flex-wrap gap-2">
                {SAMPLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="text-[13px] px-3 py-1.5 rounded-full chip-hover transition-colors"
                    style={{ color: 'var(--color-paper-mute)', border: '1px solid var(--color-rule-strong)' }}
                  >
                    &ldquo;{s}&rdquo;
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT - Deepclario's response (progressive disclosure). */}
          <div ref={responseRef}>
            <div className="flex items-baseline justify-between mb-3">
              <p className="eyebrow" style={{ color: 'var(--color-accent-bright)' }}>Deepclario</p>
              {session.stage === 'done' && session.improved && (
                <span className="text-xs tabular-nums" style={{ color: 'var(--color-paper-mute)' }}>
                  clarity <span style={{ color: 'var(--color-paper)' }}>{session.improved.scoreBeforeImprovement}</span>
                  <span className="mx-1">→</span>
                  <span style={{ color: 'var(--color-accent-bright)' }}>{session.improved.clarityScoreAfter}</span>
                </span>
              )}
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5 min-h-48 md:min-h-64"
              style={{ background: 'rgba(91,143,237,0.07)', border: '1px solid var(--color-rule-strong)' }}
            >
              <AnimatePresence mode="wait">
                {session.stage === 'idle' && (
                  <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }} className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
                    Your rewrite appears here.
                  </motion.p>
                )}

                {thinking && (
                  <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Writing label={session.stage === 'improving' ? 'Rewriting…' : 'Reading your prompt…'} />
                  </motion.div>
                )}

                {session.stage === 'clarifying' && session.clarifying && (
                  <motion.div key={`q-${session.clarifying.turn}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <p className="text-lg sm:text-xl leading-[1.45]" style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-inter)', fontWeight: 500 }}>
                      {session.clarifying.question}
                    </p>
                    {session.clarifying.targetsGap && (
                      <p className="mt-2 text-xs" style={{ color: 'var(--color-paper-mute)' }}>
                        Filling the gap: <span style={{ color: 'var(--color-paper)' }}>{session.clarifying.targetsGap}</span>
                      </p>
                    )}
                  </motion.div>
                )}

                {session.stage === 'done' && session.improved && (
                  <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <StreamOut
                      text={session.improved.improvedPrompt}
                      className="text-[15px] sm:text-base leading-[1.7] whitespace-pre-wrap wrap-break-word"
                      style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-inter)' }}
                    />
                  </motion.div>
                )}

                {session.stage === 'error' && (
                  <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[15px] sm:text-base leading-[1.6]" style={{ color: '#E89A6B' }}>
                    {errorCopy(session.error)}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Answer field - ONLY while a clarifying question waits. */}
            <AnimatePresence>
              {session.stage === 'clarifying' && (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-4"
                >
                  <div className="flex items-end gap-2.5 p-2.5 rounded-2xl" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
                    <textarea
                      ref={answerRef}
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      placeholder="Type your answer…"
                      rows={1}
                      maxLength={1000}
                      className="flex-1 bg-transparent resize-none py-2 px-2 text-[15px] sm:text-base outline-none"
                      style={{ color: 'var(--color-paper)', caretColor: 'var(--color-paper)', fontFamily: 'var(--font-inter)', lineHeight: 1.55 }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleAnswer()
                        }
                      }}
                    />
                    <button
                      onClick={handleAnswer}
                      disabled={!answer.trim()}
                      aria-label="Send answer"
                      className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full transition-all btn-paper disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                        <path d="M7 12V2M7 2L2 7M7 2L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {session.stage === 'done' && session.improved && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <CopyButton text={session.improved.improvedPrompt} />
                <button onClick={handleReset} className="text-sm transition-opacity hover:opacity-100 opacity-70" style={{ color: 'var(--color-paper-mute)' }}>
                  Try another
                </button>
              </div>
            )}

            {session.stage === 'error' && (
              <button onClick={handleReset} className="mt-4 text-sm underline underline-offset-4 hover:opacity-80" style={{ color: 'var(--color-paper)' }}>
                Start over
              </button>
            )}
          </div>
        </div>
      )}

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all btn-paper"
      style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
    >
      {copied ? 'Copied' : 'Copy rewrite'}
    </button>
  )
}

function Writing({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <span className="inline-flex items-center gap-1" aria-hidden>
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--color-accent-bright)' }}
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
          />
        ))}
      </span>
      <span className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>{label}</span>
    </div>
  )
}

function errorCopy(error: string | null): string {
  switch (error) {
    case 'rate_limited': return 'Slow down a moment - try again in a few seconds.'
    case 'network': return 'Network hiccup. Check your connection and try again.'
    case 'ai_unavailable': return 'The AI service is briefly unreachable. Try again in a moment.'
    case 'session_lost':
    case 'session_not_found': return 'Your session expired. Start a new analysis.'
    default: return 'Something went sideways on our end. Try again.'
  }
}
