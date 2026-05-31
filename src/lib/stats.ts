import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Public, lifetime-to-date count of prompts improved. Used as a hero
 * trust signal on the marketing page. Read-only, no PII, safe to expose.
 *
 * Honesty rule: we never inflate. Real number, rounded DOWN. Callers
 * decide whether to show the count based on whether it's credible yet
 * (see DISPLAY_THRESHOLD).
 */

export const DISPLAY_THRESHOLD = 500

function roundDown(n: number): number {
  if (n < 1_000) return n
  if (n < 10_000) return Math.floor(n / 100) * 100
  return Math.floor(n / 1_000) * 1_000
}

export async function getPromptsImprovedCount(): Promise<number> {
  try {
    const supabase = await createServiceClient()
    const { count, error } = await supabase
      .from('prompt_improvements')
      .select('id', { count: 'exact', head: true })
    if (error || count == null) return 0
    return roundDown(count)
  } catch {
    return 0
  }
}

export function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.floor(n / 1_000)}K`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
