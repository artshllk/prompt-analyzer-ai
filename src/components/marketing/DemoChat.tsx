'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { StreamOut } from '@/components/shared/StreamOut'
import { SAMPLE_PROMPTS, pickThree } from '@/lib/sample-prompts'

/**
 * Chat-style demo shown inside the hero modal (HeroDemoModal owns the
 * shell, scroll, focus trap, and width animation).
 *
 * Fixed side-by-side layout:
 *   LEFT  - the user's original prompt (set once, never moves).
 *   RIGHT - Deepclario's response: a clarifying question OR the improved
 *           prompt.
 *
 * Conversational intelligence (the engine decides):
 *   - Vague prompt  → one clarifying question on the right, with a
 *     "Type your answer" field UNDER it. The field exists only while we
 *     are waiting on that answer.
 *   - Specific prompt → straight to the improved prompt on the right, no
 *     answer field at all.
 *
 * One free run per browser (localStorage). After it's spent, the panel
 * swaps to the account gate - rendered inline, not a stacked overlay.
 */

/**
 * Content-free counter, same endpoint and same rules as the extension's
 * track(): an event name and a surface, never the prompt, the rewrite, or
 * any identifier. Always fire and forget - a counter must never be able to
 * interrupt the thing it is counting.
 */
function track(event: 'question_shown' | 'question_none') {
  try {
    void fetch('/api/anon/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, tier: 'anon', surface: 'web' }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Never matters.
  }
}

const DEMO_LIMIT = 1
const RUNS_KEY = 'pc_demo_runs'
const MAX_CLARIFY = 1 // demo asks at most one follow-up before improving

type QA = { question: string; answer: string; turn: number }

type ForkOption = { label: string; summary: string }

type Response =
  | { kind: 'question'; text: string; gap?: string; options: ForkOption[] }
  /** `quiet` means we never asked: the prompt only had one sensible reading. */
  | { kind: 'improved'; text: string; quiet: boolean }
  | { kind: 'error'; text: string }

type Phase = 'idle' | 'thinking' | 'awaiting-answer' | 'done' | 'error'

interface DemoChatProps {
  /** Reports whether the panel should widen to the conversation layout. */
  onWide?: (wide: boolean) => void
  /** Reports whether there is unsaved work the shell should protect on
   *  an accidental backdrop click. */
  onDirty?: (dirty: boolean) => void
}

export function DemoChat({ onWide, onDirty }: DemoChatProps) {
  const [input, setInput] = useState('')
  const [rootPrompt, setRootPrompt] = useState('')
  const [response, setResponse] = useState<Response | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [history, setHistory] = useState<QA[]>([])
  const [answer, setAnswer] = useState('')

  const [runs, setRuns] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  // Rotating sample chips: deterministic first three for SSR / first
  // client render, then a fresh random trio each time the modal mounts.
  const [samples, setSamples] = useState<string[]>(() => SAMPLE_PROMPTS.slice(0, 3))

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const answerRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setSamples(pickThree())
    const r = parseInt(window.localStorage.getItem(RUNS_KEY) ?? '0', 10)
    setRuns(Number.isFinite(r) ? r : 0)
    setHydrated(true)
  }, [])

  // Auto-grow the idle composer (scroll past the cap, don't clip).
  useEffect(() => {
    const ta = inputRef.current
    if (!ta) return
    const MAX = 200
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, MAX)}px`
    ta.style.overflowY = ta.scrollHeight > MAX ? 'auto' : 'hidden'
  }, [input])

  // Auto-grow + focus the answer field when a question appears.
  useEffect(() => {
    if (phase !== 'awaiting-answer') return
    answerRef.current?.focus()
  }, [phase])

  useEffect(() => {
    const ta = answerRef.current
    if (!ta) return
    const MAX = 160
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, MAX)}px`
    ta.style.overflowY = ta.scrollHeight > MAX ? 'auto' : 'hidden'
  }, [answer])

  const started = phase !== 'idle'
  const gated = hydrated && runs >= DEMO_LIMIT && !started

  useEffect(() => {
    onWide?.(started)
  }, [started, onWide])

  useEffect(() => {
    const dirty =
      phase === 'thinking' ||
      phase === 'awaiting-answer' ||
      response?.kind === 'improved'
    onDirty?.(dirty)
  }, [phase, response, onDirty])

  function bumpRuns() {
    setRuns(prev => {
      const next = prev + 1
      try { window.localStorage.setItem(RUNS_KEY, String(next)) } catch {}
      return next
    })
  }

  async function callEngine(prompt: string, priorAnswers: QA[]) {
    setPhase('thinking')
    setResponse(null)
    try {
      const res = await fetch('/api/anon/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone: 'professional', priorAnswers }),
      })

      if (res.status === 429) {
        fail('We limit free rewrites by IP. Give it a minute and try again.')
        return
      }
      if (!res.ok) {
        fail('Something went sideways on our end. Try again in a moment.')
        return
      }

      const data = await res.json()
      const askedEnough = priorAnswers.length >= MAX_CLARIFY

      if (data.type === 'clarifying' && !askedEnough) {
        track('question_shown')
        setResponse({
          kind: 'question',
          text: data.question,
          gap: data.targetsGap,
          options: Array.isArray(data.options) ? data.options.slice(0, 3) : [],
        })
        setAnswer('')
        setPhase('awaiting-answer')
        return
      }

      // Past our clarify cap but the engine still wants to ask: force a
      // rewrite with one synthetic "no more detail" answer.
      if (data.type === 'clarifying' && askedEnough) {
        const forced = [
          ...priorAnswers,
          { question: data.question, answer: 'No additional detail - use reasonable assumptions.', turn: priorAnswers.length + 1 },
        ]
        return callEngine(prompt, forced)
      }

      bumpRuns()
      // Nothing was asked and nothing needed to be. Say so, rather than
      // letting the user wonder whether the question step is broken.
      if (priorAnswers.length === 0) track('question_none')
      setResponse({
        kind: 'improved',
        text: data.improvedPrompt,
        quiet: priorAnswers.length === 0,
      })
      setPhase('done')
    } catch {
      fail('Network hiccup. Check your connection and try again.')
    }
  }

  function fail(text: string) {
    setResponse({ kind: 'error', text })
    setPhase('error')
  }

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || phase === 'thinking') return
    setInput('')
    setRootPrompt(text)
    setHistory([])
    callEngine(text, [])
  }

  /**
   * One path for answering, whether they clicked a reading or typed one.
   * Clicking is the intended way in: the engine only ever asks when two
   * concrete readings of the prompt would produce different rewrites, so the
   * readings themselves are the answer set. A text box invites a sentence
   * nobody asked for.
   */
  function submitAnswer(text: string) {
    const clean = text.trim()
    if (!clean || phase === 'thinking') return
    if (response?.kind !== 'question') return

    const turn = history.length + 1
    const nextHistory: QA[] = [
      ...history,
      { question: response.text, answer: clean, turn },
    ]
    setHistory(nextHistory)
    setAnswer('')
    callEngine(rootPrompt, nextHistory)
  }

  function handleAnswer(e?: React.FormEvent) {
    e?.preventDefault()
    submitAnswer(answer)
  }

  function startOver() {
    setInput('')
    setRootPrompt('')
    setResponse(null)
    setHistory([])
    setAnswer('')
    setPhase('idle')
  }

  if (gated) return <Gate />

  // First-open state: hero headline + composer, nothing else.
  if (!started) {
    return (
      <Intro
        input={input}
        setInput={setInput}
        onSend={handleSend}
        inputRef={inputRef}
        samples={samples}
      />
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-5 md:gap-6 items-start min-h-64">
      {/* LEFT - the original prompt, fixed. */}
      <div>
        <p className="eyebrow mb-3">Your prompt</p>
        <div
          className="p-4 sm:p-5 rounded-2xl"
          style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}
        >
          <p className="text-[15px] sm:text-base leading-[1.65] whitespace-pre-wrap wrap-break-word" style={{ color: 'var(--color-paper)' }}>
            {rootPrompt}
          </p>
        </div>
        {(phase === 'done' || phase === 'error') && (
          <button
            onClick={startOver}
            className="mt-4 text-sm transition-opacity hover:opacity-100 opacity-70 focus:outline-none focus:opacity-100"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            Try another prompt
          </button>
        )}
      </div>

      {/* RIGHT - Deepclario's response. */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <p className="eyebrow" style={{ color: 'var(--color-accent-bright)' }}>Deepclario</p>
        </div>

        <div
          className="p-4 sm:p-5 rounded-2xl min-h-28"
          style={{ background: 'rgba(91,143,237,0.07)', border: '1px solid var(--color-rule-strong)' }}
        >
          <AnimatePresence mode="wait">
            {phase === 'thinking' && (
              <motion.div key="writing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Writing />
              </motion.div>
            )}

            {response?.kind === 'question' && (
              <motion.p
                key="question"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-lg sm:text-xl leading-[1.45]"
                style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-inter)', fontWeight: 500 }}
              >
                {response.text}
              </motion.p>
            )}

            {response?.kind === 'improved' && (
              <motion.div key="improved" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {response.quiet && (
                  <p
                    className="text-[13px] mb-3 pb-3"
                    style={{
                      color: 'var(--color-paper-mute)',
                      borderBottom: '1px solid var(--color-rule)',
                    }}
                  >
                    Nothing to ask, this one is clear.
                  </p>
                )}
                <StreamOut
                  text={response.text}
                  className="text-[15px] sm:text-base leading-[1.7] whitespace-pre-wrap wrap-break-word"
                  style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-inter)' }}
                />
              </motion.div>
            )}

            {response?.kind === 'error' && (
              <motion.p
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[15px] sm:text-base leading-[1.65]"
                style={{ color: '#E89A6B' }}
              >
                {response.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* The readings, as buttons. Only while a question is waiting.

            This used to be a text box, which meant the engine went to the
            trouble of working out the two ways a prompt could be read and
            then asked the user to describe one in their own words. Clicking
            a reading is faster, cannot be answered with junk, and tells the
            rewrite exactly which fork to commit to. */}
        <AnimatePresence>
          {phase === 'awaiting-answer' && response?.kind === 'question' && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 flex flex-col gap-2"
            >
              {response.options.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => submitAnswer(`${opt.label}. ${opt.summary}`.trim())}
                  className="text-left px-4 py-3 rounded-2xl transition-colors row-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-(--color-ink) focus:ring-(--color-paper)"
                  style={{
                    background: 'var(--color-ink-card)',
                    border: '1px solid var(--color-rule-strong)',
                  }}
                >
                  <span
                    className="block text-[15px]"
                    style={{ color: 'var(--color-paper)', fontWeight: 500 }}
                  >
                    {opt.label}
                  </span>
                  {opt.summary && (
                    <span
                      className="block text-[13px] mt-0.5 leading-snug"
                      style={{ color: 'var(--color-paper-mute)' }}
                    >
                      {opt.summary}
                    </span>
                  )}
                </button>
              ))}

              {/* Defensive: the engine is not supposed to ask without giving
                  at least two readings, but a malformed response should not
                  strand someone on a question they cannot answer. */}
              {response.options.length === 0 && (
                <button
                  type="button"
                  onClick={() => submitAnswer('Use reasonable assumptions.')}
                  className="text-left px-4 py-3 rounded-2xl transition-colors row-hover"
                  style={{
                    background: 'var(--color-ink-card)',
                    border: '1px solid var(--color-rule-strong)',
                    color: 'var(--color-paper)',
                  }}
                >
                  Just rewrite it
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ===== First-open intro ===== */

function Intro({
  input,
  setInput,
  onSend,
  inputRef,
  samples,
}: {
  input: string
  setInput: (v: string) => void
  onSend: (e?: React.FormEvent) => void
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  samples: string[]
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <h3
        className="font-serif text-[1.6rem] sm:text-3xl leading-[1.15] tracking-tight mb-2.5 pr-10 sm:pr-0"
        style={{ color: 'var(--color-paper)', fontWeight: 400 }}
      >
        Paste a prompt. Watch it get sharper.
      </h3>
      <p
        className="text-[15px] sm:text-base leading-relaxed mb-7 max-w-prose"
        style={{ color: 'var(--color-paper-mute)' }}
      >
        Type something rough below. Deepclario asks a question if it needs to,
        then rewrites it for ChatGPT, Claude, and Gemini.
      </p>

      <form onSubmit={onSend}>
        <div
          className="flex items-end gap-2.5 p-2.5 rounded-2xl"
          style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Message Deepclario…"
            rows={1}
            maxLength={4000}
            className="flex-1 bg-transparent resize-none py-2.5 px-2 text-base focus:outline-none focus-visible:outline-none"
            style={{ color: 'var(--color-paper)', caretColor: 'var(--color-paper)', fontFamily: 'var(--font-inter)', lineHeight: 1.55 }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send"
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full transition-all btn-paper disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-(--color-ink-card) focus:ring-(--color-paper)"
            style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M7 12V2M7 2L2 7M7 2L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {samples.map(s => (
          <button
            key={s}
            onClick={() => setInput(s)}
            className="text-[13px] px-3 py-1.5 rounded-full chip-hover transition-colors focus:outline-none focus:ring-1 focus:ring-(--color-paper-mute)"
            style={{ color: 'var(--color-paper-mute)', border: '1px solid var(--color-rule-strong)' }}
          >
            &ldquo;{s}&rdquo;
          </button>
        ))}
      </div>
      <p className="mt-5 text-xs" style={{ color: 'var(--color-paper-mute)' }}>
        {/* Keyboard shortcuts only make sense with a physical keyboard. */}
        <span className="hidden sm:inline">Enter to send · Shift + Enter for a new line ·{' '}</span>
        <span>
          Your prompts are private and never used to train AI models.{' '}
          <a href="/privacy" className="underline underline-offset-2 transition-opacity hover:opacity-80">
            Privacy
          </a>
        </span>
      </p>
    </motion.div>
  )
}

/* ===== Shared pieces ===== */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all btn-paper focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-(--color-ink) focus:ring-(--color-paper)"
      style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
    >
      {copied ? 'Copied' : 'Copy rewrite'}
    </button>
  )
}

function Writing() {
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
      <span className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
        Writing…
      </span>
    </div>
  )
}

/* ===== Account gate - inline inside the panel ===== */

function Gate() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="text-center py-6 sm:py-8"
    >
      <h3
        className="font-serif text-[1.7rem] sm:text-4xl leading-tight mb-3"
        style={{ color: 'var(--color-paper)', fontWeight: 400 }}
      >
        You&apos;ve seen what it can do.
      </h3>
      <p className="text-[15px] sm:text-lg leading-relaxed mb-8" style={{ color: 'var(--color-paper-mute)' }}>
        Create a free account to keep going.
      </p>
      <Link
        href="/login?signup=1&redirectTo=/extension"
        className="inline-flex items-center justify-center px-7 py-3 rounded-full text-[15px] btn-paper transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-(--color-ink) focus:ring-(--color-paper)"
        style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
      >
        Create account
      </Link>
      <div className="mt-5">
        <Link
          href="/login"
          className="text-xs underline underline-offset-4 transition-opacity hover:opacity-100 opacity-60 focus:outline-none focus:opacity-100"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          Sign in instead
        </Link>
      </div>
    </motion.div>
  )
}
