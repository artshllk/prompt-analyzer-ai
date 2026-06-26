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
  const charCount = text.length

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
              rows={10}
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

          {/* Meta row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-xs tabular-nums">
            <span style={{ color: 'var(--color-paper-mute)' }}>
              <span style={{ color: 'var(--color-paper)' }}>{wordCount}</span>{' '}
              words ·{' '}
              <span style={{ color: 'var(--color-paper)' }}>{charCount}</span>{' '}
              characters
            </span>
            {tooShort && (
              <span style={{ color: 'var(--color-paper-mute)' }}>
                Aim for at least 30 words.
              </span>
            )}
          </div>

          {/* Action */}
          <div className="mt-6 flex items-center gap-4">
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
            {/* <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>
              Free. No account.
            </span> */}
          </div>

          {error && (
            <p className="mt-5 text-sm" style={{ color: '#E89A6B' }}>
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
            <VerdictPanel result={result} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function VerdictPanel({ result, onReset }: { result: Result; onReset: () => void }) {
  return (
    <div>
      {/* Verdict band */}
      <div className="rule-strong" />
      <div className="py-7 md:py-8">
        <p className="eyebrow mb-3">Verdict</p>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span
            className="font-serif text-4xl md:text-[3.25rem] leading-none tracking-tight"
            style={{ color: BAND_COLOR[result.band], fontWeight: 400 }}
          >
            {BAND_LABEL[result.band]}
          </span>
          <span
            className="text-sm"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            {CONFIDENCE_LABEL[result.confidenceLabel]}
          </span>
        </div>
        <p
          className="mt-5 text-base md:text-lg leading-[1.7] max-w-2xl"
          style={{ color: 'var(--color-paper)' }}
        >
          {result.reasoning}
        </p>
      </div>

      {/* Signals breakdown */}
      <div className="rule" />
      <div className="py-7 md:py-8">
        <p className="eyebrow mb-5">Signals we measured</p>
        <ul className="space-y-0">
          <SignalRow
            label="Burstiness"
            value={result.signals.burstiness.toFixed(3)}
            sub="Sentence-length variance ÷ mean. Higher leans human."
            note={result.signalNotes.burstiness}
          />
          <SignalRow
            label="Vocabulary diversity"
            value={result.signals.typeTokenRatio.toFixed(3)}
            sub="Unique words ÷ total. Higher leans human."
            note={result.signalNotes.vocabulary}
          />
          <SignalRow
            label="Em-dash density"
            value={`${result.signals.emDashDensity.toFixed(2)} / 100w`}
            sub="Em-dashes per 100 words. Heavy use leans AI."
            note={result.signalNotes.emDashes}
          />
          <SignalRow
            label="Transition word density"
            value={`${result.signals.transitionDensity.toFixed(2)} / 100w`}
            sub="however, moreover, furthermore, etc. Heavy use leans AI."
            note={result.signalNotes.transitions}
          />
          <SignalRow
            label="AI-cliché matches"
            value={`${result.signals.clicheHits.length}`}
            sub={
              result.signals.clicheHits.length > 0
                ? result.signals.clicheHits
                    .slice(0, 5)
                    .map(h => `"${h.phrase}"`)
                    .join(' · ')
                : 'No matches'
            }
            note={result.signalNotes.cliches}
          />
          {result.signals.llmLeadInCount > 0 && (
            <SignalRow
              label="LLM-style lead-ins"
              value={`${result.signals.llmLeadInCount}`}
              sub='Phrases like "Certainly!", "Of course!", "As an AI" at sentence start.'
            />
          )}
        </ul>
      </div>

      {/* Raw stats - small, secondary */}
      <div className="rule" />
      <div className="py-6">
        <p className="eyebrow mb-3">Raw stats</p>
        <div
          className="flex flex-wrap gap-x-6 gap-y-1 text-sm tabular-nums"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          <span>
            {result.signals.wordCount} words
          </span>
          <span>
            {result.signals.sentenceCount} sentences
          </span>
          <span>
            mean {result.signals.meanSentenceLength} words/sentence
          </span>
          <span>
            σ {result.signals.sentenceLengthStdDev.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rule" />
      <div className="py-6">
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          {result.disclaimer}
        </p>
      </div>

      {/* Action */}
      <div
        className="pt-6 flex items-center gap-3"
        style={{ borderTop: '1px solid var(--color-rule)' }}
      >
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all btn-outline"
          style={{
            border: '1px solid var(--color-rule-strong)',
            color: 'var(--color-paper)',
          }}
        >
          Analyze another text
        </button>
      </div>
    </div>
  )
}

function SignalRow({
  label,
  value,
  sub,
  note,
}: {
  label: string
  value: string
  sub: string
  note?: string
}) {
  return (
    <li>
      <div className="rule" />
      <div className="grid grid-cols-12 gap-3 md:gap-6 py-4">
        <div className="col-span-12 md:col-span-4">
          <p
            className="text-sm md:text-[15px]"
            style={{ color: 'var(--color-paper)', fontWeight: 500 }}
          >
            {label}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            {sub}
          </p>
        </div>
        <div className="col-span-4 md:col-span-2">
          <p
            className="font-serif text-xl tabular-nums"
            style={{ color: 'var(--color-paper)', fontWeight: 400 }}
          >
            {value}
          </p>
        </div>
        <div className="col-span-8 md:col-span-6">
          {note && (
            <p
              className="text-sm leading-snug"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              {note}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}
