'use client'

import { motion } from 'framer-motion'
import type { Tone } from '@/types/database'

interface ToneSelectorProps {
  value: Tone
  onChange: (tone: Tone) => void
  disabled?: boolean
}

const TONES: { id: Tone; label: string; icon: string; desc: string }[] = [
  { id: 'professional', label: 'Professional', icon: '💼', desc: 'Formal & precise' },
  { id: 'friendly', label: 'Friendly', icon: '😊', desc: 'Warm & approachable' },
  { id: 'persuasive', label: 'Persuasive', icon: '🎯', desc: 'Impact-focused' },
  { id: 'concise', label: 'Concise', icon: '⚡', desc: 'Minimal & direct' },
  { id: 'creative', label: 'Creative', icon: '✨', desc: 'Expressive & vivid' },
]

export function ToneSelector({ value, onChange, disabled }: ToneSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TONES.map(tone => {
        const isSelected = value === tone.id
        return (
          <motion.button
            key={tone.id}
            onClick={() => !disabled && onChange(tone.id)}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.03 } : {}}
            whileTap={!disabled ? { scale: 0.97 } : {}}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
              isSelected
                ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                : 'bg-[#0f1628] border-[#1e2d4a] text-[#8b9cc8] hover:border-[#2d4070] hover:text-[#f0f4ff]'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-violet-500/5"
                layoutId="tone-selection"
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              />
            )}
            <span className="text-base">{tone.icon}</span>
            <span>{tone.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
