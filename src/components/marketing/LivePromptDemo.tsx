'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

/**
 * Live interactive demo on the homepage.
 *
 * Visitors paste a real prompt and get a real response from the engine
 * via /api/anon/analyze (IP rate-limited, no auth required).
 *
 * Two-turn maximum:
 *   - Turn 1: paste → score + first clarifying question (or rewrite if confident).
 *   - Turn 2: answer → score + final rewrite.
 *
 * Editorial visual language: hairlines, tabular numerals, no glow, no
 * gradient buttons. Designed to feel like a serious tool, not a marketing widget.
 */

type AnalyzeResponse =
  | {
      type: 'clarifying'
      question: string
      targetsGap: string
      confidenceSoFar: number
      scoreBeforeImprovement: number
    }
  | {
      type: 'improved'
      improvedPrompt: string
      explanation: string
      improvementTags: string[]
      clarityScoreAfter: number
      scoreBeforeImprovement: number
    }

type State =
  | { kind: 'idle' }
  | { kind: 'thinking' }
  | { kind: 'asked'; question: string; gap: string; score: number; answer: string }
  | { kind: 'rewriting' }
  | { kind: 'done'; before: number; after: number; rewrite: string; explanation: string }
  | { kind: 'error'; message: string }

const SAMPLES = [
  'Write me a blog post about AI',
  'Help me fix this bug',
  'Summarize this paper for me',
]

type QA = { question: string; answer: string; turn: number }

const MAX_TURNS = 3

interface LivePromptDemoProps {
  /** Pre-populate the textarea with a sample prompt so visitors can hit Analyze immediately. */
  defaultPrompt?: string
  /** When true, hide the built-in headline so the surrounding page can provide its own. */
  compact?: boolean
}

export function LivePromptDemo({ defaultPrompt = '', compact = false }: LivePromptDemoProps = {}) {
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [state, setState] = useState<State>({ kind: 'idle' })
  // Accumulate answers across turns so the engine sees the full conversation.
  const [history, setHistory] = useState<QA[]>([])
  const answerRef = useRef<HTMLTextAreaElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Focus the answer textarea + scroll into view ONLY when we transition
  // into a stage - never on every keystroke.
  useEffect(() => {
    if (state.kind === 'asked' && answerRef.current) {
      answerRef.current.focus()
    }
    if ((state.kind === 'asked' || state.kind === 'done' || state.kind === 'error') && resultsRef.current) {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
     
  }, [state.kind])

  async function analyze(currentPrompt: string, qaHistory: QA[]) {
    setState({ kind: qaHistory.length > 0 ? 'rewriting' : 'thinking' })

    try {
      const res = await fetch('/api/anon/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          tone: 'professional',
          priorAnswers: qaHistory,
        }),
      })

      if (res.status === 429) {
        setState({
          kind: 'error',
          message: 'Slow down a moment - we limit free analyses by IP. Try again in a minute, or open the playground for unlimited use.',
        })
        return
      }
      if (!res.ok) {
        setState({ kind: 'error', message: 'Something went sideways on our end. Try again, or open the playground.' })
        return
      }

      const data = (await res.json()) as AnalyzeResponse

      if (data.type === 'clarifying') {
        // Defensive cap: if the engine somehow keeps asking past MAX_TURNS,
        // tell the user we've hit the demo limit and push them to the playground.
        if (qaHistory.length >= MAX_TURNS) {
          setState({
            kind: 'error',
            message: 'We need more context than we can ask for here. Continue in the playground for the full conversation.',
          })
          return
        }
        setState({
          kind: 'asked',
          question: data.question,
          gap: data.targetsGap,
          score: data.scoreBeforeImprovement,
          answer: '',
        })
      } else {
        setState({
          kind: 'done',
          before: data.scoreBeforeImprovement,
          after: data.clarityScoreAfter,
          rewrite: data.improvedPrompt,
          explanation: data.explanation,
        })
      }
    } catch {
      setState({ kind: 'error', message: 'Network hiccup. Try again.' })
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!prompt.trim() || state.kind === 'thinking' || state.kind === 'rewriting') return
    setHistory([])
    analyze(prompt.trim(), [])
  }

  function handleAnswer() {
    if (state.kind !== 'asked') return
    if (!state.answer.trim()) return
    const next: QA[] = [
      ...history,
      { question: state.question, answer: state.answer.trim(), turn: history.length + 1 },
    ]
    setHistory(next)
    analyze(prompt.trim(), next)
  }

  function reset() {
    setPrompt('')
    setHistory([])
    setState({ kind: 'idle' })
  }

  const thinking = state.kind === 'thinking' || state.kind === 'rewriting'
  const showInputForm = state.kind === 'idle' || state.kind === 'thinking' || state.kind === 'error'

  return (
    <div className="grid md:grid-cols-12 gap-8 md:gap-16">
      {/* Left: input column (asymmetric - narrower on desktop) */}
      <div className="md:col-span-5">
        {!compact && (
          <>
            <p className="eyebrow mb-6">Try it now</p>
            <h2
              className="display text-4xl md:text-5xl mb-6"
              style={{ color: 'var(--color-paper)' }}
            >
              Paste a prompt.<br />
              <span className="tracking-tight" style={{ color: 'var(--color-paper-mute)' }}>
                See it scored.
              </span>
            </h2>
            <p className="text-base md:text-lg leading-[1.65] mb-3" style={{ color: 'var(--color-paper-mute)' }}>
              A real prompt, your prompt analyzed by the same engine running in the playground.
            </p>
          </>
        )}
        {/* <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--color-paper-mute)' }}>
          We do not store anything you paste here. The text is sent to the model, analyzed once, and discarded.
        </p> */}

        {/* Textarea form */}
        <form onSubmit={handleSubmit} className={!showInputForm ? 'opacity-50 pointer-events-none' : ''}>
          <label htmlFor="demo-prompt" className="sr-only">Your prompt</label>
          <textarea
            id="demo-prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={!showInputForm}
            placeholder="Type a prompt - even a rough one. e.g. “Write me a blog post about AI”"
            rows={5}
            maxLength={4000}
            className="w-full p-4 text-base resize-none focus:outline-none transition-colors"
            style={{
              background: 'var(--color-ink-card)',
              color: 'var(--color-paper)',
              border: '1px solid var(--color-rule-strong)',
              borderRadius: '12px',
              fontFamily: 'var(--font-inter)',
              lineHeight: 1.55,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-paper-mute)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-rule-strong)' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
            <button
              type="submit"
              disabled={!prompt.trim() || thinking}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] transition-all btn-paper disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-inter)',
                fontWeight: 500,
              }}
            >
              {thinking ? 'Analyzing…' : 'Analyze prompt'}
              {!thinking && (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>
              Enter to submit · Shift + Enter for newline
            </span>
          </div>
        </form>

        {/* Sample prompts (only when idle) */}
        {state.kind === 'idle' && !prompt && (
          <div className="mt-8">
            <p className="eyebrow mb-3">Or try one</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLES.map(s => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="text-sm px-3 py-1.5 rounded-full chip-hover"
                  style={{
                    color: 'var(--color-paper-mute)',
                    border: '1px solid var(--color-rule-strong)',
                  }}
                >
                  &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: results column */}
      <div ref={resultsRef} className="md:col-span-7 min-h-[18rem]">
        <AnimatePresence mode="wait">
          {state.kind === 'idle' && <IdlePanel key="idle" />}
          {(state.kind === 'thinking' || state.kind === 'rewriting') && (
            <ThinkingPanel key="thinking" label={state.kind === 'rewriting' ? 'Rewriting…' : 'Reading your prompt…'} />
          )}
          {state.kind === 'asked' && (
            <AskedPanel
              key="asked"
              question={state.question}
              gap={state.gap}
              score={state.score}
              answerRef={answerRef}
              answer={state.answer}
              onAnswer={(answer: string) => setState({ ...state, answer })}
              onSubmit={handleAnswer}
              onSkip={reset}
            />
          )}
          {state.kind === 'done' && (
            <DonePanel key="done" before={state.before} after={state.after} rewrite={state.rewrite} explanation={state.explanation} onReset={reset} />
          )}
          {state.kind === 'error' && <ErrorPanel key="error" message={state.message} onRetry={reset} />}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ===== Result panels ===== */

const panelMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
}

function IdlePanel() {
  return (
    <motion.div {...panelMotion} className="h-full flex flex-col justify-center" style={{ minHeight: '18rem' }}>
      <div className="rule-strong mb-6" />
      <p className="eyebrow mb-4">What you'll see</p>
      <ol className="space-y-4">
        {[
          { n: '01', t: 'A clarity score, 0–100', d: 'Scored across five dimensions: goal, context, format, constraints, examples.' },
          { n: '02', t: 'A real follow-up question', d: 'The thing the model would have had to guess. We ask it instead.' },
          { n: '03', t: 'The rewrite', d: 'Your prompt, improved. Ready to paste into ChatGPT, Claude, or Gemini.' },
        ].map(({ n, t, d }) => (
          <li key={n} className="grid grid-cols-12 gap-3 md:gap-4">
            <span className="col-span-2 md:col-span-1 font-serif text-xl tabular-nums" style={{ color: 'var(--color-paper-mute)' }}>{n}</span>
            <div className="col-span-10 md:col-span-11">
              <p className="text-base" style={{ color: 'var(--color-paper)' }}>{t}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-paper-mute)' }}>{d}</p>
            </div>
          </li>
        ))}
      </ol>
    </motion.div>
  )
}

function ThinkingPanel({ label }: { label: string }) {
  return (
    <motion.div {...panelMotion} className="flex flex-col justify-center h-full" style={{ minHeight: '18rem' }}>
      <div className="rule-strong mb-6" />
      <div className="flex items-center gap-3">
        <ThinkingDots />
        <span className="eyebrow">{label}</span>
      </div>
      <p className="mt-4 font-serif text-2xl md:text-3xl tracking-tight" style={{ color: 'var(--color-paper-mute)' }}>
        Reading what you wrote, the way a senior engineer reads a ticket.
      </p>
    </motion.div>
  )
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="block w-1 h-1 rounded-full"
          style={{ background: 'var(--color-paper)' }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

function ScoreNumber({ value }: { value: number }) {
  const color = value < 30 ? '#C25E5E' : value < 60 ? 'var(--color-paper-mute)' : 'var(--color-paper)'
  return (
    <span className="font-serif tabular-nums" style={{ color, fontWeight: 400 }}>
      {value}
    </span>
  )
}

function AskedPanel({
  question,
  gap,
  score,
  answerRef,
  answer,
  onAnswer,
  onSubmit,
  onSkip,
}: {
  question: string
  gap: string
  score: number
  answerRef: React.RefObject<HTMLTextAreaElement | null>
  answer?: string
  onAnswer: (a: string) => void
  onSubmit?: () => void
  onSkip: () => void
}) {
  return (
    <motion.div {...panelMotion}>
      <div className="rule-strong mb-6" />
      <div className="flex items-baseline justify-between mb-6">
        <p className="eyebrow">Score</p>
        <p className="text-3xl md:text-4xl"><ScoreNumber value={score} /><span className="text-sm ml-1" style={{ color: 'var(--color-paper-mute)' }}>/ 100</span></p>
      </div>

      <p className="eyebrow mb-2" style={{ color: 'var(--color-accent)' }}>What we&rsquo;d ask</p>
      <p className="font-serif tracking-tight text-2xl md:text-[2rem] leading-[1.2]" style={{ color: 'var(--color-paper)' }}>
        {question}
      </p>
      {gap && (
        <p className="mt-3 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
          Targets the gap: <span style={{ color: 'var(--color-paper)' }}>{gap}</span>
        </p>
      )}

      <form
        onSubmit={e => { e.preventDefault(); onSubmit?.() }}
        className="mt-8"
      >
        <label htmlFor="demo-answer" className="sr-only">Your answer</label>
        <textarea
          id="demo-answer"
          ref={answerRef}
          value={answer ?? ''}
          onChange={e => onAnswer(e.target.value)}
          placeholder="Answer in a sentence or two…"
          rows={3}
          maxLength={1000}
          className="w-full p-4 text-base resize-none focus:outline-none"
          style={{
            background: 'transparent',
            color: 'var(--color-paper)',
            borderTop: '1px solid var(--color-rule-strong)',
            borderBottom: '1px solid var(--color-rule-strong)',
            borderLeft: 'none',
            borderRight: 'none',
            borderRadius: 0,
            fontFamily: 'var(--font-inter)',
            lineHeight: 1.55,
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSubmit?.()
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <button
            type="submit"
            disabled={!answer?.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] transition-all btn-paper disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--color-paper)',
              color: 'var(--color-ink)',
              fontWeight: 500,
            }}
          >
            Get the rewrite
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm transition-opacity"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            Start over
          </button>
        </div>
      </form>
    </motion.div>
  )
}

function DonePanel({
  before,
  after,
  rewrite,
  explanation,
  onReset,
}: {
  before: number
  after: number
  rewrite: string
  explanation: string
  onReset: () => void
}) {
  const delta = after - before
  return (
    <motion.div {...panelMotion}>
      <div className="rule-strong mb-6" />

      {/* Score bar */}
      <div className="flex items-baseline justify-between mb-6">
        <p className="eyebrow">Clarity</p>
        <div className="flex items-baseline gap-3 text-3xl md:text-4xl">
          <ScoreNumber value={before} />
          <span style={{ color: 'var(--color-paper-mute)' }}>→</span>
          <ScoreNumber value={after} />
          <span className="text-sm ml-1" style={{ color: 'var(--color-accent)' }}>+{delta}</span>
        </div>
      </div>

      <p className="eyebrow mb-3" style={{ color: 'var(--color-paper)' }}>The rewrite</p>
      <div
        className="p-5 mb-5"
        style={{
          borderTop: '1px solid var(--color-rule-strong)',
          borderBottom: '1px solid var(--color-rule-strong)',
        }}
      >
        <p
          className="font-serif text-base md:text-lg leading-[1.55] whitespace-pre-line"
          style={{ color: 'var(--color-paper)', fontWeight: 400 }}
        >
          {rewrite}
        </p>
      </div>

      {explanation && (
        <>
          <p className="eyebrow mb-2">Why it&rsquo;s better</p>
          <p className="text-sm md:text-base leading-[1.65] mb-6" style={{ color: 'var(--color-paper-mute)' }}>
            {explanation}
          </p>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigator.clipboard.writeText(rewrite)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all btn-paper"
          style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
        >
          Copy rewrite
        </button>
        <Link
          href="/playground"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all btn-outline"
          style={{ border: '1px solid var(--color-rule-strong)', color: 'var(--color-paper)' }}
        >
          Open playground
        </Link>
        <button
          onClick={onReset}
          className="text-sm transition-opacity btn-text"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          Try another
        </button>
      </div>
    </motion.div>
  )
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div {...panelMotion}>
      <div className="rule-strong mb-6" />
      <p className="eyebrow mb-4" style={{ color: '#C25E5E' }}>Hold on</p>
      <p className="font-serif text-xl md:text-2xl" style={{ color: 'var(--color-paper)', lineHeight: 1.4 }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all btn-outline"
        style={{ border: '1px solid var(--color-rule-strong)', color: 'var(--color-paper)' }}
      >
        Try again
      </button>
    </motion.div>
  )
}
