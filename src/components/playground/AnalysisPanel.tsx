'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { ImprovementTag } from '@/types/database'

interface AnalysisPanelProps {
  originalPrompt: string
  improvedPrompt: string
  explanation: string
  improvementTags: ImprovementTag[]
  clarityScoreBefore: number
  clarityScoreAfter: number
  onReset: () => void
}

/**
 * Editorial result panel — hairlines, serif scores, no chunky cards.
 * Side-by-side stays as the default layout, but each side is hairline-bound,
 * not boxed.
 */
export function AnalysisPanel({
  originalPrompt,
  improvedPrompt,
  explanation,
  improvementTags,
  clarityScoreBefore,
  clarityScoreAfter,
  onReset,
}: AnalysisPanelProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'split' | 'original' | 'improved'>('split')

  async function handleCopy() {
    await navigator.clipboard.writeText(improvedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const delta = clarityScoreAfter - clarityScoreBefore

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Score row — editorial, no boxes */}
      <div className="rule-strong" />
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 py-6">
        <div className="flex items-baseline gap-3">
          <span className="eyebrow">Clarity</span>
          <span className="font-serif tabular-nums text-3xl md:text-4xl" style={{ color: scoreColor(clarityScoreBefore), fontWeight: 400 }}>
            {clarityScoreBefore}
          </span>
          <span style={{ color: 'var(--color-paper-mute)' }}>→</span>
          <span className="font-serif tabular-nums text-3xl md:text-4xl" style={{ color: scoreColor(clarityScoreAfter), fontWeight: 400 }}>
            {clarityScoreAfter}
          </span>
          <span className="text-sm ml-1" style={{ color: 'var(--color-accent)' }}>+{delta}</span>
        </div>
        {improvementTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="eyebrow">What was added</span>
            <span className="text-sm" style={{ color: 'var(--color-paper)' }}>
              {improvementTags.map((t, i) => (
                <span key={t}>
                  {i > 0 && <span style={{ color: 'var(--color-paper-mute)' }}>, </span>}
                  <span className="capitalize">{t}</span>
                </span>
              ))}
            </span>
          </div>
        )}
      </div>
      <div className="rule" />

      {/* View toggle — text-only segmented control */}
      <div className="flex items-center gap-x-2 gap-y-1 py-5">
        <span className="eyebrow mr-2">View</span>
        {(['split', 'original', 'improved'] as const).map((tab, i) => (
          <span key={tab} className="flex items-center">
            {i > 0 && <span className="mx-2 text-sm" style={{ color: 'var(--color-rule-strong)' }}>·</span>}
            <button
              onClick={() => setActiveTab(tab)}
              className="text-sm transition-opacity"
              style={{
                color: activeTab === tab ? 'var(--color-paper)' : 'var(--color-paper-mute)',
                fontWeight: activeTab === tab ? 500 : 400,
                textDecorationLine: activeTab === tab ? 'underline' : 'none',
                textUnderlineOffset: '4px',
              }}
            >
              {tab === 'split' ? 'Side by side' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </span>
        ))}
      </div>

      {/* Prompt comparison */}
      {activeTab === 'split' ? (
        <div className="grid md:grid-cols-2 gap-px">
          <div className="md:pr-8 py-7" style={{ borderRight: '1px solid var(--color-rule-strong)' }}>
            <p className="eyebrow mb-3" style={{ color: 'var(--color-paper-mute)' }}>Original</p>
            <p
              className="font-serif tracking-tight text-base md:text-lg leading-[1.55] whitespace-pre-wrap"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              {originalPrompt}
            </p>
          </div>
          <div className="md:pl-8 py-7">
            <p className="eyebrow mb-3" style={{ color: 'var(--color-paper)' }}>Improved</p>
            <p
              className="font-serif text-base md:text-[1.05rem] leading-[1.55] whitespace-pre-wrap"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              {improvedPrompt}
            </p>
          </div>
        </div>
      ) : (
        <div className="py-7" style={{ borderTop: '1px solid var(--color-rule-strong)', borderBottom: '1px solid var(--color-rule-strong)' }}>
          <p className="eyebrow mb-3" style={{ color: activeTab === 'improved' ? 'var(--color-paper)' : 'var(--color-paper-mute)' }}>
            {activeTab === 'original' ? 'Original' : 'Improved'}
          </p>
          <p
            className="font-serif text-base md:text-[1.05rem] leading-[1.55] whitespace-pre-wrap"
            style={{
              color: activeTab === 'improved' ? 'var(--color-paper)' : 'var(--color-paper-mute)',
              fontStyle: activeTab === 'improved' ? 'normal' : 'italic',
              fontWeight: 400,
            }}
          >
            {activeTab === 'original' ? originalPrompt : improvedPrompt}
          </p>
        </div>
      )}

      {/* Explanation */}
      <div className="mt-10">
        <p className="eyebrow mb-3">Why it&rsquo;s sharper</p>
        <p className="text-base md:text-lg leading-[1.65] max-w-3xl" style={{ color: 'var(--color-paper-mute)' }}>
          {explanation}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
          style={{
            background: 'var(--color-paper)',
            color: 'var(--color-ink)',
            fontWeight: 500,
          }}
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 7L6 11L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied
            </>
          ) : (
            <>
              Copy improved prompt
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
        <button
          onClick={onReset}
          className="text-sm underline-offset-4 hover:underline transition-all px-2"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          Start over
        </button>
      </div>
    </motion.div>
  )
}

function scoreColor(score: number): string {
  if (score < 30) return '#C25E5E'
  if (score < 60) return 'var(--color-paper-mute)'
  return 'var(--color-paper)'
}
