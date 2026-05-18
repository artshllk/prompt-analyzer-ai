'use client'

import type { Tone } from '@/types/database'

interface ToneSelectorProps {
  value: Tone
  onChange: (tone: Tone) => void
  disabled?: boolean
}

const TONES: { id: Tone; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'persuasive', label: 'Persuasive' },
  { id: 'concise', label: 'Concise' },
  { id: 'creative', label: 'Creative' },
]

/**
 * Editorial tone picker - segmented row of text labels separated by hairlines.
 * No emoji, no pills, no violet. Selected tone is paper-bright; rest are muted.
 */
export function ToneSelector({ value, onChange, disabled }: ToneSelectorProps) {
  return (
    <div className="flex flex-wrap gap-x-1 gap-y-2">
      {TONES.map((tone, i) => {
        const isSelected = value === tone.id
        return (
          <span key={tone.id} className="flex items-center">
            {i > 0 && <span className="mx-2 text-sm" style={{ color: 'var(--color-rule-strong)' }}>·</span>}
            <button
              type="button"
              onClick={() => !disabled && onChange(tone.id)}
              disabled={disabled}
              className={`text-sm transition-opacity ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                color: isSelected ? 'var(--color-paper)' : 'var(--color-paper-mute)',
                fontWeight: isSelected ? 500 : 400,
                textDecorationLine: isSelected ? 'underline' : 'none',
                textUnderlineOffset: '4px',
              }}
            >
              {tone.label}
            </button>
          </span>
        )
      })}
    </div>
  )
}
