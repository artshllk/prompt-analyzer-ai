'use client'

import { useEffect, useState } from 'react'
import { approxTokens, countTokens } from '@/lib/tokens'

/**
 * Live token count for a textarea.
 *
 * Renders the synchronous approximation immediately on every keystroke,
 * then upgrades to the exact gpt-tokenizer count after a short debounce.
 * The UI never blocks waiting for the encoder.
 */
export function useTokenCount(text: string, debounceMs = 180): number {
  const [count, setCount] = useState(() => approxTokens(text))

  useEffect(() => {
    // Immediate, synchronous estimate so the number never feels stale.
    const estimate = approxTokens(text)
    setCount(estimate)

    if (!text.trim()) return

    let cancelled = false
    const handle = setTimeout(async () => {
      const exact = await countTokens(text)
      if (!cancelled) setCount(exact)
    }, debounceMs)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [text, debounceMs])

  return count
}
