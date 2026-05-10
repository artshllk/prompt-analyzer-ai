'use client'

import { useRef, useEffect } from 'react'
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

const PLACEHOLDER = 'A rough idea, a one-liner, or a request you have not finished writing…'

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
    ta.style.height = `${Math.min(ta.scrollHeight, 360)}px`
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isDisabled && value.trim()) onSubmit()
    }
  }

  const overLimit = charCount > 2000

  return (
    <div className={isDisabled ? 'opacity-60 pointer-events-none' : ''}>
      <p className="eyebrow mb-3">Your prompt</p>

      {/* Textarea — hairlines, no chunky card */}
      <div style={{ borderTop: '1px solid var(--color-rule-strong)', borderBottom: '1px solid var(--color-rule-strong)' }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={PLACEHOLDER}
          rows={6}
          className="w-full bg-transparent resize-none py-5 text-base focus:outline-none"
          style={{
            color: 'var(--color-paper)',
            fontFamily: 'var(--font-inter)',
            lineHeight: 1.55,
          }}
        />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <span
          className="text-xs tabular-nums"
          style={{ color: overLimit ? 'var(--color-accent)' : 'var(--color-paper-mute)' }}
        >
          {charCount} characters
        </span>
        <span className="hidden sm:block text-xs" style={{ color: 'var(--color-paper-mute)' }}>
          Enter to analyze · Shift + Enter for newline
        </span>
      </div>

      {/* Tone */}
      <div className="mt-8">
        <p className="eyebrow mb-3">Tone</p>
        <ToneSelector value={tone} onChange={onToneChange} disabled={isDisabled} />
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={isDisabled || !value.trim()}
        className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] transition-all hover:gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'var(--color-paper)',
          color: 'var(--color-ink)',
          fontWeight: 500,
        }}
      >
        {isLoading ? (
          <>
            <SpinnerDots />
            {stage === 'analyzing' ? 'Reading your prompt…' : 'Rewriting…'}
          </>
        ) : (
          <>
            Analyze prompt
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
      </button>
    </div>
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
