/**
 * Shared insight aggregation helpers.
 *
 * Extracted from the weekly-insights route so the Skill Profile route and
 * the Insights route compute before/after scores and tag frequencies the
 * exact same way - the two surfaces must never disagree on the same data.
 */

export interface ScoredSession {
  clarity_score_before: number | null
  clarity_score_after: number | null
  created_at: string
}

/** Average before/after clarity and the lift (after - before) across a set
 *  of completed sessions. Returns zeros for an empty set so callers can
 *  render an empty state without guarding. */
export function avgScores(items: Pick<ScoredSession, 'clarity_score_before' | 'clarity_score_after'>[]) {
  if (!items.length) return { before: 0, after: 0, lift: 0 }
  const before = Math.round(items.reduce((a, b) => a + (b.clarity_score_before ?? 0), 0) / items.length)
  const after = Math.round(items.reduce((a, b) => a + (b.clarity_score_after ?? 0), 0) / items.length)
  return { before, after, lift: after - before }
}

/** Count how often each improvement tag appears across linked improvement
 *  rows. This is the raw "which prompting skills does the rewrite keep
 *  adding for you" signal. */
export function countTags(rows: { improvement_tags: string[] | null }[]): Record<string, number> {
  const counts: Record<string, number> = {}
  rows.forEach(r => {
    ;(r.improvement_tags ?? []).forEach(tag => {
      counts[tag] = (counts[tag] ?? 0) + 1
    })
  })
  return counts
}

/** Only sessions with both a before and after score are usable for
 *  averages and trends. Centralized so every surface filters identically. */
export function onlyScored<T extends { clarity_score_before: number | null; clarity_score_after: number | null }>(
  sessions: T[]
): T[] {
  return sessions.filter(s => s.clarity_score_before != null && s.clarity_score_after != null)
}

export interface WeekBucket {
  weekStart: string // ISO date (YYYY-MM-DD) of the Monday that starts the week
  avgBefore: number
  avgAfter: number
  count: number
}

/** ISO date (YYYY-MM-DD) of the Monday starting the week that contains `d`. */
function mondayOf(d: Date): string {
  const copy = new Date(d)
  copy.setUTCHours(0, 0, 0, 0)
  const day = copy.getUTCDay() // 0 = Sun ... 6 = Sat
  const diff = (day + 6) % 7 // days since Monday
  copy.setUTCDate(copy.getUTCDate() - diff)
  return copy.toISOString().slice(0, 10)
}

/**
 * Bucket scored sessions into weekly before/after averages, oldest first.
 * This is the core of the "improvement over time" trend - the whole point
 * of the Skill Profile MVP. Only weeks that actually contain sessions
 * appear (no zero-filled gaps), so a sparse user still gets a clean line.
 */
export function weeklyTrend(sessions: ScoredSession[]): WeekBucket[] {
  const scored = onlyScored(sessions)
  const byWeek = new Map<string, ScoredSession[]>()

  for (const s of scored) {
    const key = mondayOf(new Date(s.created_at))
    const bucket = byWeek.get(key)
    if (bucket) bucket.push(s)
    else byWeek.set(key, [s])
  }

  return [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, items]) => {
      const { before, after } = avgScores(items)
      return { weekStart, avgBefore: before, avgAfter: after, count: items.length }
    })
}
