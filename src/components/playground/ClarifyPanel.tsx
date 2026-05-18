'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ClarifyPanelProps {
  question: string
  turn: number
  maxTurns: number
  confidenceSoFar: number
  onSubmit: (answer: string) => void
  isLoading: boolean
}

/**
 * Editorial clarification panel - hairlines, serif question, no boxes.
 * Replaces the previous violet/amber chunky-card variant.
 */
export function ClarifyPanel({
  question,
  turn,
  maxTurns,
  confidenceSoFar,
  onSubmit,
  isLoading,
}: ClarifyPanelProps) {
  const [answer, setAnswer] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setAnswer('')
    textareaRef.current?.focus()
  }, [question])

  function handleSubmit() {
    if (!answer.trim() || isLoading) return
    onSubmit(answer.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top row: stage + confidence */}
        <div className="rule-strong" />
        <div className="flex items-baseline justify-between py-4">
          <p className="eyebrow" style={{ color: 'var(--color-accent)' }}>
            One question · turn {turn} of {maxTurns}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="eyebrow">Confidence</span>
            <span
              className="font-serif text-lg tabular-nums"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              {confidenceSoFar}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>/ 100</span>
          </div>
        </div>
        <div className="rule" />

        {/* The question itself, in display serif */}
        <p
          className="font-serif tracking-tight text-2xl md:text-[2rem] leading-[1.2] py-7"
          style={{ color: 'var(--color-paper)' }}
        >
          {question}
        </p>

        {/* Answer */}
        <div style={{ borderTop: '1px solid var(--color-rule-strong)', borderBottom: '1px solid var(--color-rule-strong)' }}>
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Answer in a sentence or two…"
            rows={3}
            className="w-full bg-transparent resize-none py-4 text-base focus:outline-none disabled:opacity-50"
            style={{
              color: 'var(--color-paper)',
              fontFamily: 'var(--font-inter)',
              lineHeight: 1.55,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
          <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>
            Enter to submit · Shift + Enter for newline
          </span>
          <button
            onClick={handleSubmit}
            disabled={!answer.trim() || isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] transition-all btn-paper disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--color-paper)',
              color: 'var(--color-ink)',
              fontWeight: 500,
            }}
          >
            {isLoading ? (
              <>
                <SpinnerDots />
                Reading…
              </>
            ) : (
              <>
                Submit answer
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function SpinnerDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="block w-1 h-1 rounded-full"
          style={{
            background: 'var(--color-ink)',
            animation: `pulse-dot 1.2s infinite ${i * 0.18}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
      `}</style>
    </span>
  )
}
