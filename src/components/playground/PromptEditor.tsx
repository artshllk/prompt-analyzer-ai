'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ToneSelector } from './ToneSelector'
import type { Tone } from '@/types/database'
import type { SessionStage } from '@/hooks/usePromptSession'

interface PromptEditorProps {
  value: string
  onChange: (v: string) => void
  tone: Tone
  onToneChange: (t: Tone) => void
  onSubmit: () => void
  stage: SessionStage
  charCount: number
}

const PLACEHOLDER = `Describe what you want the AI to do...

Examples:
• "Write a blog post about..."
• "Create a Python function that..."
• "Explain how to..."`

export function PromptEditor({
  value,
  onChange,
  tone,
  onToneChange,
  onSubmit,
  stage,
  charCount,
}: PromptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isLoading = stage === 'analyzing' || stage === 'improving'
  const isDisabled = isLoading || stage === 'done'

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 400)}px`
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isDisabled && value.trim()) onSubmit()
    }
  }

  return (
    <div className="space-y-4">
      {/* Textarea */}
      <div className={`relative rounded-2xl border transition-all duration-200 ${
        isDisabled
          ? 'border-[#1e2d4a] bg-[#0a0e1a]/50'
          : 'border-[#1e2d4a] bg-[#0f1628] focus-within:border-violet-500/60 focus-within:shadow-lg focus-within:shadow-violet-500/10'
      }`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={PLACEHOLDER}
          rows={6}
          className="w-full bg-transparent resize-none px-5 py-4 text-[#f0f4ff] placeholder:text-[#76819d] leading-relaxed outline-none disabled:opacity-60"
        />
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e2d4a]">
          <span className={`text-xs ${charCount > 2000 ? 'text-amber-400' : 'text-[#4a5a80]'}`}>
            {charCount} chars
          </span>
          <span className="text-xs text-[#2d4070]">Enter to analyze · Shift+Enter for new line</span>
        </div>
      </div>

      {/* Tone selector */}
      <div>
        <p className="text-xs text-[#4a5a80] mb-2 uppercase tracking-wider">Explanation tone</p>
        <ToneSelector value={tone} onChange={onToneChange} disabled={isDisabled} />
      </div>

      {/* Submit button */}
      <motion.button
        onClick={onSubmit}
        disabled={isDisabled || !value.trim()}
        whileHover={!isDisabled && value.trim() ? { scale: 1.01 } : {}}
        whileTap={!isDisabled && value.trim() ? { scale: 0.99 } : {}}
        className={`w-full py-4 rounded-2xl font-semibold text-base transition-all relative overflow-hidden ${
          !value.trim()
            ? 'bg-violet-600/30 border border-violet-500/30 text-violet-200/80 cursor-not-allowed'
            : isLoading
              ? 'bg-violet-600/80 text-white cursor-wait'
              : 'bg-violet-600 hover:bg-violet-500 text-white glow-violet cursor-pointer'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            {stage === 'analyzing' ? 'Analyzing...' : 'Improving...'}
          </span>
        ) : (
          'Analyze Prompt'
        )}
      </motion.button>
    </div>
  )
}
