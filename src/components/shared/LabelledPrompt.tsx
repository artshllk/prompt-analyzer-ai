'use client'

import { useMemo, useState } from 'react'
import {
  countAdditions,
  renderPrompt,
  type Segment,
} from '@/lib/engine/segments'

/**
 * A rewritten prompt with every added constraint visible and removable.
 *
 * The problem this solves: the rewriter is allowed to commit to sensible
 * defaults where the user left something open, and it should be. What it was
 * not allowed to do, and did anyway, was commit silently. The user got back a
 * prompt carrying a length, an audience and a tone they never chose, sent it
 * to a model, and the model obeyed all three.
 *
 * So the additions are shown. Amber for a guess, with an x on it. Blue for
 * something the user's own answer put there. Everything else is theirs and is
 * styled as nothing at all, because their words are the default and the
 * additions are the exception.
 *
 * Removing one is not a preview toggle. It edits the prompt: the count drops,
 * the text reflows, and Copy hands over what is actually on screen.
 */

interface LabelledPromptProps {
  segments: Segment[]
  /** Called with the current prompt text whenever a removal changes it. */
  onChange?: (prompt: string) => void
}

export function LabelledPrompt({ segments, onChange }: LabelledPromptProps) {
  const [removed, setRemoved] = useState<ReadonlySet<number>>(() => new Set())

  const visible = useMemo(
    () => segments.filter((_, i) => !removed.has(i)),
    [segments, removed]
  )
  const { added, guessed } = useMemo(() => countAdditions(visible), [visible])
  const removedCount = removed.size

  function toggle(index: number) {
    const next = new Set(removed)
    next.add(index)
    setRemoved(next)
    onChange?.(renderPrompt(segments, next))
  }

  function restoreAll() {
    const empty: ReadonlySet<number> = new Set()
    setRemoved(empty)
    onChange?.(renderPrompt(segments, empty))
  }

  return (
    <div>
      <p
        className="text-[15px] sm:text-base leading-[1.9] whitespace-pre-wrap wrap-break-word"
        style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-inter)' }}
      >
        {segments.map((seg, i) => {
          if (removed.has(i)) return null
          if (seg.source === 'yours') return <span key={i}>{seg.text}</span>

          const isGuess = seg.source === 'guessed'
          const color = isGuess ? 'var(--color-guess)' : 'var(--color-machine)'
          const background = isGuess
            ? 'var(--color-guess-bg)'
            : 'var(--color-machine-bg)'

          return (
            <span
              key={i}
              className="inline rounded-md px-1 py-0.5"
              style={{ background, color, boxShadow: `inset 0 0 0 1px ${color}33` }}
            >
              {seg.text}
              {isGuess && (
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-label={`Remove the guess: ${seg.text}`}
                  title="Remove this. You did not ask for it."
                  /* The visible dot stays 16px because a bigger one would
                     shout, but the hit area is padded out to something a
                     thumb can actually land on. -my-2 keeps the padding from
                     pushing the line height around mid-paragraph. */
                  className="ml-1 -my-2 py-2 px-1 inline-flex items-center justify-center align-middle transition-opacity opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-(--color-ink) focus:ring-(--color-guess)"
                  style={{ color }}
                >
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] leading-none"
                    style={{ background: 'var(--guess-accent)', color: 'var(--ink)' }}
                    aria-hidden
                  >
                    ×
                  </span>
                </button>
              )}
            </span>
          )
        })}
      </p>

      {/* The count. It replaced a clarity score, and the whole point of it is
          that a person can check it by looking at the paragraph above. */}
      <div
        className="mt-4 pt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]"
        style={{ borderTop: '1px solid var(--color-rule)' }}
      >
        <span style={{ color: 'var(--color-paper-mute)' }}>
          {added === 0 ? (
            'Nothing added. This is your prompt.'
          ) : (
            <>
              <span style={{ color: 'var(--color-paper)' }}>{added} added</span>
              {guessed > 0 && (
                <>
                  {', '}
                  <span style={{ color: 'var(--color-guess)' }}>
                    {guessed} of them {guessed === 1 ? 'a guess' : 'guesses'}
                  </span>
                </>
              )}
              {guessed === 0 && ', none of them guesses'}
            </>
          )}
        </span>

        {removedCount > 0 && (
          <>
            <span style={{ color: 'var(--color-confirm)' }}>
              {removedCount} removed
            </span>
            <button
              type="button"
              onClick={restoreAll}
              className="underline underline-offset-4 transition-opacity opacity-70 hover:opacity-100"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              Put them back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
