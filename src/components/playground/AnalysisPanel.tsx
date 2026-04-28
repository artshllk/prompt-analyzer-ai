'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ClarityScoreBadge } from '@/components/ui/ClarityScoreBadge'
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

const TAG_COLORS: Record<ImprovementTag, { bg: string; text: string; border: string }> = {
  context: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  role: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  action: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  format: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  constraints: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  examples: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  specificity: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
}

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Score header */}
      <div className="glass rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-1">Clarity score</p>
          <div className="flex items-center gap-4">
            <ClarityScoreBadge score={clarityScoreBefore} size="sm" animate={false} />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 40 }}
              className="h-px bg-gradient-to-r from-[#4a5a80] to-violet-500"
            />
            <ClarityScoreBadge score={clarityScoreAfter} size="sm" />
            <div className="text-sm font-bold text-emerald-400">
              +{clarityScoreAfter - clarityScoreBefore}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {improvementTags.map(tag => {
            const colors = TAG_COLORS[tag] ?? TAG_COLORS.context
            return (
              <span
                key={tag}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${colors.bg} ${colors.text} ${colors.border}`}
              >
                +{tag}
              </span>
            )
          })}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex rounded-xl bg-[#0a0e1a] border border-[#1e2d4a] p-1">
        {(['split', 'original', 'improved'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-[#0f1628] border border-[#2d4070] text-[#f0f4ff]'
                : 'text-[#4a5a80] hover:text-[#8b9cc8]'
            }`}
          >
            {tab === 'split' ? 'Side by Side' : tab}
          </button>
        ))}
      </div>

      {/* Prompt comparison */}
      {activeTab === 'split' ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#1e2d4a] bg-[#0a0e1a]/50 p-4">
            <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-3">Original</p>
            <p className="text-[#8b9cc8] text-sm leading-relaxed whitespace-pre-wrap">{originalPrompt}</p>
          </div>
          <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4">
            <p className="text-xs text-violet-400 uppercase tracking-wider mb-3">Improved</p>
            <p className="text-[#f0f4ff] text-sm leading-relaxed whitespace-pre-wrap">{improvedPrompt}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1628] p-4">
          <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-3 capitalize">{activeTab} prompt</p>
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
            activeTab === 'improved' ? 'text-[#f0f4ff]' : 'text-[#8b9cc8]'
          }`}>
            {activeTab === 'original' ? originalPrompt : improvedPrompt}
          </p>
        </div>
      )}

      {/* Explanation */}
      <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1628] p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-cyan-400">
            <path d="M7 1C3.686 1 1 3.686 1 7C1 10.314 3.686 13 7 13C10.314 13 13 10.314 13 7C13 3.686 10.314 1 7 1Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 6.5V10M7 4.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-xs font-medium text-cyan-400 uppercase tracking-wider">Why this works better</p>
        </div>
        <p className="text-[#8b9cc8] text-sm leading-relaxed">{explanation}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <motion.button
          onClick={handleCopy}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-violet-600 hover:bg-violet-500 text-white glow-violet'
          }`}
        >
          {copied ? '✓ Copied!' : 'Copy Improved Prompt'}
        </motion.button>

        <button
          onClick={onReset}
          className="px-5 py-3.5 rounded-xl font-semibold text-sm border border-[#1e2d4a] text-[#8b9cc8] hover:border-[#2d4070] hover:text-[#f0f4ff] transition-all"
        >
          Start Over
        </button>
      </div>
    </motion.div>
  )
}
