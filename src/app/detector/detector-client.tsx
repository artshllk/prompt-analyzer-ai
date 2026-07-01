'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Band = 'likely-human' | 'mixed' | 'likely-ai'
type ConfidenceLabel = 'low' | 'moderate' | 'high'

interface Signals {
  wordCount: number
  sentenceCount: number
  meanSentenceLength: number
  sentenceLengthStdDev: number
  burstiness: number
  typeTokenRatio: number
  emDashDensity: number
  transitionDensity: number
  clicheScore: number
  clicheHits: { phrase: string; weight: number; index: number }[]
  llmLeadInCount: number
}

interface Result {
  band: Band
  confidenceLabel: ConfidenceLabel
  reasoning: string
  disclaimer: string
  signals: Signals
  signalNotes: Record<string, string>
}

const BAND_LABEL: Record<Band, string> = {
  'likely-human': 'Likely human',
  'mixed': 'Mixed signals',
  'likely-ai': 'Likely AI',
}

const BAND_COLOR: Record<Band, string> = {
  'likely-human': '#5ECF7B',
  'mixed': 'var(--color-paper)',
  'likely-ai': '#E89A6B',
}

const CONFIDENCE_LABEL: Record<ConfidenceLabel, string> = {
  low: 'Low confidence',
  moderate: 'Moderate confidence',
  high: 'Higher confidence',
}

export function DetectorClient() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    const trimmed = text.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/detector/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'rate_limited') {
          setError('Slow down a moment - too many requests in a short window.')
        } else if (data.error === 'too_long') {
          setError(data.message || 'Text is too long.')
        } else if (data.error === 'empty_text') {
          setError('Paste some text first.')
        } else {
          setError('Something went wrong. Try again.')
        }
        return
      }
      setResult(data as Result)
    } catch {
      setError('Network error. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError(null)
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0
  const tooShort = wordCount > 0 && wordCount < 30

  return (
    <div>
      {/* Input */}
      {!result && (
        <>
          <div
            className="rounded-2xl p-1"
            style={{
              background: 'var(--color-ink-card-elevated)',
              border: '1px solid var(--color-rule-strong)',
            }}
          >
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              disabled={loading}
              placeholder="Paste text - an article, an email, a paragraph from anywhere. At least 30 words for a useful read."
              rows={9}
              maxLength={20000}
              className="w-full resize-none px-5 py-4 text-base focus:outline-none rounded-2xl"
              style={{
                background: 'transparent',
                color: 'var(--color-paper)',
                fontFamily: 'var(--font-inter)',
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Meta + action on one row */}
          <div className="flex items-center justify-between gap-4 mt-3">
            <span className="text-xs tabular-nums" style={{ color: 'var(--color-paper-mute)' }}>
              {tooShort ? (
                'Aim for at least 30 words.'
              ) : (
                <>
                  <span style={{ color: 'var(--color-paper)' }}>{wordCount}</span> words
                </>
              )}
            </span>
            <button
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] btn-paper disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                fontWeight: 500,
              }}
            >
              {loading ? 'Analyzing…' : 'Analyze text'}
              {!loading && (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 7H12M12 7L7 2M12 7L7 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-sm" style={{ color: '#E89A6B' }}>
              {error}
            </p>
          )}
        </>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <VerdictPanel result={result} submittedText={text.trim()} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function VerdictPanel({
  result,
  submittedText,
  onReset,
}: {
  result: Result
  submittedText: string
  onReset: () => void
}) {
  const s = result.signals
  const [showSignals, setShowSignals] = useState(false)

  return (
    <div>
      {/* Verdict + analyzed text, side by side on desktop */}
      <div className="grid md:grid-cols-5 gap-3 md:gap-4">
        {/* Verdict */}
        <div
          className="md:col-span-3 rounded-2xl p-6 md:p-7 flex flex-col"
          style={{
            background: 'var(--color-ink-card-elevated)',
            border: '1px solid var(--color-rule-strong)',
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="eyebrow">Verdict</p>
            <span
              className="text-[11px] font-medium tracking-[0.12em] uppercase px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{ color: 'var(--color-paper-mute)', border: '1px solid var(--color-rule-strong)' }}
            >
              {CONFIDENCE_LABEL[result.confidenceLabel]}
            </span>
          </div>
          <span
            className="font-serif text-4xl md:text-[3rem] leading-none tracking-tight"
            style={{ color: BAND_COLOR[result.band], fontWeight: 400 }}
          >
            {BAND_LABEL[result.band]}
          </span>
          <p
            className="mt-4 text-base leading-[1.7]"
            style={{ color: 'var(--color-paper)' }}
          >
            {result.reasoning}
          </p>
        </div>

        {/* Analyzed text */}
        <div
          className="md:col-span-2 rounded-2xl p-5 flex flex-col min-h-0"
          style={{
            background: 'var(--color-ink-card)',
            border: '1px solid var(--color-rule)',
          }}
        >
          <p
            className="text-[11px] font-medium tracking-[0.14em] uppercase mb-3 shrink-0"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            Your text · {s.wordCount} words
          </p>
          <div
            className="flex-1 max-h-40 md:max-h-56 overflow-y-auto overscroll-contain text-sm leading-[1.65] whitespace-pre-wrap pr-1"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            {submittedText}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all btn-outline"
          style={{ border: '1px solid var(--color-rule-strong)', color: 'var(--color-paper)' }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M12 7H2M2 7L7 2M2 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Analyze another
        </button>

        <button
          onClick={() => setShowSignals(v => !v)}
          className="inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--color-paper-mute)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-paper)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-paper-mute)')}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 10 10"
            fill="none"
            style={{ transform: showSignals ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
            aria-hidden
          >
            <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {showSignals ? 'Hide the signals' : 'Show the signals we measured'}
        </button>
      </div>

      {/* Signals - optional, grid */}
      <AnimatePresence initial={false}>
        {showSignals && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <StatCard
                label="Burstiness"
                value={s.burstiness.toFixed(3)}
                hint="Sentence-length variation. Higher leans human."
              />
              <StatCard
                label="Vocabulary diversity"
                value={s.typeTokenRatio.toFixed(3)}
                hint="Unique words ÷ total. Higher leans human."
              />
              <StatCard
                label="Em-dash density"
                value={`${s.emDashDensity.toFixed(2)} / 100w`}
                hint="Real em/en-dashes. Heavy use leans AI."
              />
              <StatCard
                label="Transition words"
                value={`${s.transitionDensity.toFixed(2)} / 100w`}
                hint="however, moreover, furthermore… Heavy use leans AI."
              />
              <StatCard
                label="AI-cliché matches"
                value={`${s.clicheHits.length}`}
                hint={
                  s.clicheHits.length > 0
                    ? s.clicheHits.slice(0, 4).map(h => `"${h.phrase}"`).join(' · ')
                    : 'No common LLM clichés found.'
                }
                className="sm:col-span-2"
              />
            </div>

            <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
              {result.disclaimer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** A single measured signal, shown as a compact stat card. */
function StatCard({
  label,
  value,
  hint,
  className = '',
}: {
  label: string
  value: string
  hint: string
  className?: string
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3.5 ${className}`}
      style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p
          className="text-[11px] font-medium tracking-[0.12em] uppercase"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          {label}
        </p>
        <p
          className="font-serif text-xl tabular-nums shrink-0"
          style={{ color: 'var(--color-paper)', fontWeight: 400 }}
        >
          {value}
        </p>
      </div>
      <p className="text-xs mt-1.5 leading-snug" style={{ color: 'var(--color-paper-mute)' }}>
        {hint}
      </p>
    </div>
  )
}
