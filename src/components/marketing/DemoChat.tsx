'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { StreamOut } from '@/components/shared/StreamOut'
import { LabelledPrompt } from '@/components/shared/LabelledPrompt'
import {
  SAMPLE_ORIGINAL,
  SAMPLE_ANSWER,
  SAMPLE_SEGMENTS,
} from '@/lib/sample-result'
import type { Segment } from '@/lib/engine/segments'
import { CompareAnswers } from '@/components/shared/CompareAnswers'
import { track, trackRun } from '@/lib/track'
import { SAMPLE_PROMPTS, ALREADY_GOOD_SAMPLE, pickSamples } from '@/lib/sample-prompts'
import { IMPROVE_FREE_LIMIT } from '@/lib/limits'

/**
 * The tool. Rendered directly in the homepage hero and on /prompt-improver.
 *
 * It used to live inside a modal behind a CTA, with a scripted animation of
 * itself occupying the hero. Both are gone: this is the hero now, and it owns
 * its own layout rather than borrowing a modal's.
 *
 * Fixed side-by-side layout:
 *   LEFT  - the user's original prompt (set once, never moves).
 *   RIGHT - Deepclario's response: a clarifying question OR the improved
 *           prompt.
 *
 * Conversational intelligence (the engine decides):
 *   - Vague prompt  → one clarifying question on the right, with the two
 *     or three readings under it as buttons. They exist only while we are
 *     waiting on that answer.
 *   - Specific prompt → straight to the improved prompt on the right, and
 *     we say so rather than staying silent about it.
 *
 * One free run per browser (localStorage). After it's spent, the panel
 * swaps to the account gate - rendered inline, not a stacked overlay.
 */

/**
 * Free runs per browser before we ask for an account.
 *
 * One was not enough to understand this product. The labelling and the quiet
 * path both need a second look, and the first prompt someone types is usually
 * a test rather than a real one. Three lets them try a sample, try their own,
 * and come back once. The site-wide daily ceiling is the real cost control;
 * this is just the sign-up moment.
 */
/**
 * "Comes back at 16:00" beats an ISO timestamp, and beats "try later", which
 * is a dead end wearing a clock. Falls back to a plain sentence when the
 * server did not send a reset time.
 */
function resetPhrase(iso: string): string {
  if (!iso) return 'It resets on a rolling 24 hour window.'
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return 'It resets on a rolling 24 hour window.'
  const time = at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const sameDay = at.toDateString() === new Date().toDateString()
  return sameDay ? `Your next one is back at ${time}.` : `Your next one is back tomorrow at ${time}.`
}

const DEMO_LIMIT = 3
const RUNS_KEY = 'pc_demo_runs'
const MAX_CLARIFY = 1 // demo asks at most one follow-up before improving

type QA = { question: string; answer: string; turn: number }

type ForkOption = { label: string; summary: string }

type Response =
  | { kind: 'question'; text: string; gap?: string; options: ForkOption[] }
  /** `quiet` means we never asked: the prompt only had one sensible reading.
   *  `segments` is absent when the rewrite came back without usable markers;
   *  the prompt still ships, just unlabelled. */
  | { kind: 'improved'; text: string; quiet: boolean; segments?: Segment[] }
  /**
   * The prompt was already good and we refused to rewrite it into noise.
   * This branch did not exist, so an already_good response fell through to
   * the improved case and rendered an undefined prompt as a blank panel.
   * One of the three sample chips is deliberately a prompt that lands here.
   */
  | { kind: 'already_good'; message: string; tweaks: string[] }
  /** Not a prompt at all: a greeting, a thank-you, a reaction. */
  | { kind: 'no_task'; message: string }
  /** The whole site's anonymous budget for today is gone. */
  | { kind: 'capacity'; resetAt: string }
  /** Their own plan limit, which is not the same thing as us breaking. */
  | { kind: 'quota'; resetAt: string; dailyLimit: number }
  | { kind: 'error'; text: string }

type Phase = 'idle' | 'thinking' | 'awaiting-answer' | 'done' | 'error'

interface DemoChatProps {
  /** Reports whether the panel should widen to the conversation layout. */
  onWide?: (wide: boolean) => void
  /** Reports whether there is unsaved work a host shell should protect on
   *  an accidental backdrop click. */
  onDirty?: (dirty: boolean) => void
}

export function DemoChat({ onWide, onDirty }: DemoChatProps) {
  const [input, setInput] = useState('')
  const [rootPrompt, setRootPrompt] = useState('')
  const [response, setResponse] = useState<Response | null>(null)
  /** The rewrite as it currently stands, after any guesses were removed. */
  const [copyText, setCopyText] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [history, setHistory] = useState<QA[]>([])

  const [runs, setRuns] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  // Rotating sample chips: deterministic first three for SSR / first
  // client render, then a fresh random trio each time the modal mounts.
  const [samples, setSamples] = useState<string[]>(() => [
    SAMPLE_PROMPTS[0],
    ALREADY_GOOD_SAMPLE,
    SAMPLE_PROMPTS[1],
  ])

  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setSamples(pickSamples())
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
        const d = await res.json().catch(() => ({}))
        // Two different 429s. One is "you personally are going too fast",
        // the other is "the whole site's free budget for today is gone".
        // Telling someone to wait a minute when the answer is tomorrow is
        // just a slower way of wasting their time.
        if (d.error === 'daily_capacity') {
          setResponse({ kind: 'capacity', resetAt: d.resetAt ?? '' })
          setPhase('done')
          return
        }
        fail('That is a lot of rewrites in one go. Give it a minute and try again.')
        return
      }
      /**
       * These three used to fall into one message: "Something went sideways
       * on our end." That is a lie in two of the three cases. Telling someone
       * our servers broke when they have simply used their improvements for
       * the day teaches them the product is unreliable AND hides the upgrade
       * path that would fix it.
       */
      if (res.status === 402) {
        const d = await res.json().catch(() => ({}))
        setResponse({
          kind: 'quota',
          resetAt: d.resetAt ?? '',
          dailyLimit: typeof d.dailyLimit === 'number' ? d.dailyLimit : 10,
        })
        setPhase('done')
        return
      }
      if (res.status === 503) {
        const d = await res.json().catch(() => ({}))
        // Two different 503s, and telling them apart matters. One is the
        // model not answering. The other is us being unable to look up your
        // account, which must never be dressed up as a limit: it is our
        // problem, it is usually brief, and it costs you nothing.
        fail(
          d.error === 'identity_unavailable'
            ? 'We are having trouble reaching your account right now. Nothing was used up. Try again shortly.'
            : 'The model did not come back. That one is on us, and it did not use up any of your improvements. Try again.'
        )
        return
      }
      if (res.status === 400) {
        const d = await res.json().catch(() => ({}))
        fail(
          d.error === 'prompt_too_long'
            ? 'That prompt is too long. Trim it under 4000 characters and try again.'
            : 'That prompt did not come through. Try sending it again.'
        )
        return
      }
      if (!res.ok) {
        fail('Something went wrong on our end. Nothing was used up, so try again.')
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
      // Counted here, not on submit: a call that failed is not a run.
      trackRun()

      if (data.type === 'already_good') {
        setResponse({
          kind: 'already_good',
          message: data.message ?? 'This one is already clear.',
          tweaks: Array.isArray(data.tweaks) ? data.tweaks : [],
        })
        setPhase('done')
        return
      }

      if (data.type === 'no_task') {
        setResponse({
          kind: 'no_task',
          message: data.message ?? 'There is no prompt here to improve yet.',
        })
        setPhase('done')
        return
      }

      // Nothing was asked and nothing needed to be. Say so, rather than
      // letting the user wonder whether the question step is broken.
      if (priorAnswers.length === 0) track('question_none')
      setResponse({
        kind: 'improved',
        text: data.improvedPrompt,
        quiet: priorAnswers.length === 0,
        segments: Array.isArray(data.segments) ? data.segments : undefined,
      })
      // Copy hands over the prompt as it stands, so removals have to update it.
      setCopyText(data.improvedPrompt)
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
    callEngine(rootPrompt, nextHistory)
  }


  function startOver() {
    setInput('')
    setRootPrompt('')
    setResponse(null)
    setHistory([])
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
                {response.segments ? (
                  <LabelledPrompt
                    segments={response.segments}
                    onChange={setCopyText}
                  />
                ) : (
                  <StreamOut
                    text={response.text}
                    className="text-[15px] sm:text-base leading-[1.7] whitespace-pre-wrap wrap-break-word"
                    style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-inter)' }}
                  />
                )}

                <div className="mt-5">
                  <CopyButton text={copyText || response.text} />
                </div>

                <CompareAnswers
                  original={rootPrompt}
                  improved={copyText || response.text}
                />
              </motion.div>
            )}

            {response?.kind === 'already_good' && (
              <motion.div key="already-good" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p
                  className="text-[13px] mb-3 pb-3"
                  style={{
                    color: 'var(--color-confirm)',
                    borderBottom: '1px solid var(--color-rule)',
                  }}
                >
                  Nothing to change. This one is already clear.
                </p>
                <p
                  className="text-[15px] sm:text-base leading-[1.7]"
                  style={{ color: 'var(--color-paper)' }}
                >
                  {response.message}
                </p>
                {response.tweaks.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {response.tweaks.map(t => (
                      <li
                        key={t}
                        className="text-[14px] leading-[1.6] pl-4 relative"
                        style={{ color: 'var(--color-paper-mute)' }}
                      >
                        <span className="absolute left-0" aria-hidden>·</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 text-[13px]" style={{ color: 'var(--color-paper-mute)' }}>
                  We only rewrite when it would actually help. Your prompt is
                  yours.
                </p>
              </motion.div>
            )}

            {response?.kind === 'no_task' && (
              <motion.p
                key="no-task"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[15px] sm:text-base leading-[1.7]"
                style={{ color: 'var(--color-paper)' }}
              >
                {response.message}
              </motion.p>
            )}

            {response?.kind === 'quota' && (
              <motion.div key="quota" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p
                  className="text-[15px] sm:text-base leading-[1.7] mb-2"
                  style={{ color: 'var(--color-paper)' }}
                >
                  That is your {response.dailyLimit} improvements for today.
                </p>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
                  {resetPhrase(response.resetAt)} Pro removes the daily limit and
                  runs a stronger model on every improve.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center px-5 py-2.5 rounded-full text-sm btn-brand transition-all"
                    style={{ fontWeight: 500 }}
                  >
                    See what Pro includes
                  </Link>
                  <Link
                    href="/extension"
                    className="text-sm underline underline-offset-4 opacity-80 hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--color-paper)' }}
                  >
                    Or get the extension
                  </Link>
                </div>
              </motion.div>
            )}

            {response?.kind === 'capacity' && (
              <motion.div key="capacity" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Leads with the way forward, not with the shortage.
                    "Today's free runs used up, across everyone" is accurate
                    and reads like we ran out of money, which is the last
                    thing a stranger should think on the day we launch. The
                    fact is the same either way: signing in moves you off a
                    shared pool onto your own. */}
                <p
                  className="text-[15px] sm:text-base leading-[1.7] mb-2"
                  style={{ color: 'var(--color-paper)' }}
                >
                  {/* Was "ten improvements a day". Improvements moved to a
                      monthly allowance and this page is reachable from the
                      footer, so the number was live and wrong. */}
                  Sign in to keep going. You get your own allowance, {IMPROVE_FREE_LIMIT}{' '}
                  improvements a month, instead of sharing the open one.
                </p>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
                  The version you can use without an account runs on a shared
                  daily pool, and today&apos;s is spent. It refills at midnight
                  UTC if you would rather wait. It is free either way.
                </p>
                <Link
                  href="/login?signup=1"
                  className="mt-4 inline-flex items-center px-5 py-2.5 rounded-full text-sm btn-brand transition-all"
                  style={{ fontWeight: 500 }}
                >
                  Create a free account
                </Link>
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
      {/* No heading here any more. The hero above already carries the
          headline and the subhead, and repeating both inside the card put
          two competing promises on one screen. The chips do the teaching
          instead: one of them is a prompt that needs no help. */}
      <form onSubmit={onSend}>
        <div
          className="flex items-end gap-2.5 p-2.5 rounded-2xl"
          style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste a bad prompt…"
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
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full transition-all btn-brand disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-(--color-ink-card) focus:ring-(--color-paper)"
            
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M7 12V2M7 2L2 7M7 2L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </form>

      <p className="mt-4 mb-2 text-xs" style={{ color: 'var(--color-paper-mute)' }}>
        Or try one of these
      </p>
      <div className="flex flex-wrap gap-2">
        {samples.map(s => (
          <button
            key={s}
            onClick={() => setInput(s)}
            className="text-[13px] text-left px-3 py-2 rounded-2xl chip-hover transition-colors focus:outline-none focus:ring-1 focus:ring-(--color-paper-mute) max-w-full"
            style={{ color: 'var(--color-paper-mute)', border: '1px solid var(--color-rule-strong)' }}
            title={s}
          >
            {/* Truncated on one line: the already-good sample is long on
                purpose, and a chip that wraps to four lines on a phone stops
                looking tappable. */}
            <span className="block truncate max-w-[15rem] sm:max-w-xs">
              &ldquo;{s}&rdquo;
            </span>
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

      <WorkedExample />
    </motion.div>
  )
}

/**
 * A finished result, on the screen before anyone types.
 *
 * The hero used to be an empty box. A stranger arriving from a link had to
 * think of a prompt, type it and wait before seeing the only thing that makes
 * this different from every other rewriter: that it shows what it added and
 * lets you take it back. Most people will not do that for a tool they have
 * never heard of.
 *
 * Static, server-rendered, no API call and no cost. It uses the real parser
 * and the real component, so it cannot drift from what the product actually
 * produces, and it is fully interactive: remove a guess here and the count
 * drops, without typing anything or spending a run.
 */
function WorkedExample() {
  return (
    <div
      className="mt-7 pt-6"
      style={{ borderTop: '1px solid var(--color-rule)' }}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
        <p className="eyebrow">An example, already done</p>
        <span className="text-[12px]" style={{ color: 'var(--color-paper-mute)' }}>
          try removing a guess
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 items-start">
        <div>
          <p className="text-[12px] mb-2" style={{ color: 'var(--color-paper-mute)' }}>
            What someone typed
          </p>
          <p
            className="text-[15px] leading-[1.6] p-3 rounded-xl"
            style={{
              color: 'var(--color-paper-mute)',
              background: 'var(--color-ink-card)',
              border: '1px solid var(--color-rule)',
            }}
          >
            {SAMPLE_ORIGINAL}
          </p>
          <p className="text-[12px] mt-3 leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
            <span style={{ color: 'var(--machine)' }}>We asked one question.</span>{' '}
            They picked: {SAMPLE_ANSWER}
          </p>
        </div>

        <div
          className="p-3 sm:p-4 rounded-xl"
          style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}
        >
          <p className="text-[12px] mb-2" style={{ color: 'var(--color-paper-mute)' }}>
            What it wrote back
          </p>
          <LabelledPrompt segments={SAMPLE_SEGMENTS} />
        </div>
      </div>
    </div>
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
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all btn-brand focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-(--color-ink) focus:ring-(--color-paper)"
      style={{ fontWeight: 500 }}
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
        You&apos;ve seen what it does.
      </h3>
      <p className="text-[15px] sm:text-lg leading-relaxed mb-8" style={{ color: 'var(--color-paper-mute)' }}>
        Three free rewrites is the taste. An account gets you {IMPROVE_FREE_LIMIT} a month.
      </p>
      <Link
        href="/login?signup=1&redirectTo=/playground"
        className="inline-flex items-center justify-center px-7 py-3 rounded-full text-[15px] btn-brand transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-(--color-ink) focus:ring-(--color-paper)"
        style={{ fontWeight: 500 }}
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
