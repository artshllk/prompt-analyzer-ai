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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-[#2d4070] bg-[#0f1628] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d4a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1C3.686 1 1 3.686 1 7C1 10.314 3.686 13 7 13C10.314 13 13 10.314 13 7C13 3.686 10.314 1 7 1ZM7 10.5C6.586 10.5 6.25 10.164 6.25 9.75C6.25 9.336 6.586 9 7 9C7.414 9 7.75 9.336 7.75 9.75C7.75 10.164 7.414 10.5 7 10.5ZM7.75 7.25C7.75 7.664 7.414 8 7 8C6.586 8 6.25 7.664 6.25 7.25V4.25C6.25 3.836 6.586 3.5 7 3.5C7.414 3.5 7.75 3.836 7.75 4.25V7.25Z" fill="#f59e0b"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-amber-400">Clarification needed</p>
              <p className="text-xs text-[#4a5a80]">Turn {turn} of {maxTurns}</p>
            </div>
          </div>

          {/* Confidence meter */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-[#4a5a80]">Confidence</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-[#1e2d4a] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${confidenceSoFar}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-medium text-amber-400">{confidenceSoFar}%</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="px-5 py-4">
          <p className="text-[#f0f4ff] leading-relaxed font-medium">{question}</p>
        </div>

        {/* Answer input */}
        <div className="px-5 pb-5 space-y-3">
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Your answer..."
            rows={3}
            className="w-full bg-[#0a0e1a] border border-[#1e2d4a] focus:border-violet-500/60 rounded-xl px-4 py-3 text-[#f0f4ff] placeholder:text-[#2d4070] text-sm resize-none outline-none transition-colors disabled:opacity-50"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#2d4070]">Enter to submit · Shift+Enter for new line</span>
            <motion.button
              onClick={handleSubmit}
              disabled={!answer.trim() || isLoading}
              whileHover={answer.trim() && !isLoading ? { scale: 1.02 } : {}}
              whileTap={answer.trim() && !isLoading ? { scale: 0.98 } : {}}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full inline-block"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Processing...
                </span>
              ) : (
                'Submit Answer'
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
