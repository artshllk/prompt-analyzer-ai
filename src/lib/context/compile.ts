import type { ContextBrief } from '@/types'
import { getActiveMemories, getIdentity, getRecentStyleSignals } from './graph'
import type { Memory } from './types'

/**
 * Compile a user's Context Graph into the small brief the engine injects.
 *
 * - Identity: only CONFIRMED fields (an unreviewed guess must never steer
 *   a rewrite). Available to every signed-in user - the free taste.
 * - Memories: active standing preferences/facts, selected under a fixed
 *   character budget (see selectMemories) so the block can't bloat as a
 *   user accumulates context.
 * - Style hints: learned from accepted edits, Pro only. Phase 1 uses cheap
 *   deterministic heuristics over recent signals (no LLM); a later phase
 *   distills richer rules. Deterministic keeps rewrites reproducible.
 *
 * Returns null when there's nothing worth injecting, so callers can skip
 * the context block entirely.
 */
export async function compileContextBrief(
  userId: string,
  opts: { isPro: boolean },
): Promise<ContextBrief | null> {
  const [identity, activeMemories] = await Promise.all([
    getIdentity(userId),
    getActiveMemories(userId),
  ])

  const identityLines: string[] = []
  if (identity.confirmed) {
    if (identity.role) identityLines.push(`Role: ${identity.role}`)
    if (identity.company) identityLines.push(`Company: ${identity.company}`)
    if (identity.industry) identityLines.push(`Industry: ${identity.industry}`)
    if (identity.expertiseLevel) identityLines.push(`Expertise: ${identity.expertiseLevel}`)
    if (identity.languages.length) identityLines.push(`Working languages: ${identity.languages.join(', ')}`)
    if (identity.toneNote) identityLines.push(`Tone & style: ${identity.toneNote}`)
  }

  const selected = selectMemories(activeMemories, MEMORY_CHAR_BUDGET)
  const styleHints = opts.isPro ? await compileStyleHints(userId) : []

  if (identityLines.length === 0 && selected.length === 0 && styleHints.length === 0) return null
  return {
    ...(identityLines.length > 0 && { identity: identityLines }),
    ...(selected.length > 0 && {
      memories: selected.map(m => m.content),
      usedMemories: selected.map(m => ({ id: m.id, content: m.content })),
    }),
    ...(styleHints.length > 0 && { styleHints }),
  }
}

// Budget for the memories group of the # CONTEXT block (identity and style
// hints are already tightly bounded). ~1400 chars ≈ 350 tokens keeps the
// whole block cheap even for a memory-heavy Pro user.
const MEMORY_CHAR_BUDGET = 1400
const MEMORY_MAX_LINES = 12

// Preferences shape every rewrite; graduated style rules next; loose facts
// only when there's room left.
const KIND_PRIORITY: Record<Memory['kind'], number> = {
  preference: 0,
  style_rule: 1,
  fact: 2,
}

/**
 * Deterministic selection under a character budget: kind priority, then
 * recency of use, then recency of creation. No semantic ranking on purpose -
 * at the 5-30 memories users actually hold, kind+recency is indistinguishable
 * from it and keeps rewrites reproducible. Swap this function for a ranker
 * if that ever stops being true.
 */
export function selectMemories(memories: Memory[], budget: number): Memory[] {
  const ranked = [...memories].sort((a, b) => {
    const kind = KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind]
    if (kind !== 0) return kind
    const used = (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? '')
    if (used !== 0) return used
    return b.createdAt.localeCompare(a.createdAt)
  })

  const selected: Memory[] = []
  let spent = 0
  for (const m of ranked) {
    if (selected.length >= MEMORY_MAX_LINES) break
    if (spent + m.content.length > budget) continue
    selected.push(m)
    spent += m.content.length
  }
  return selected
}

const MIN_SIGNALS = 3

/**
 * Deterministic style tells from the delta between each AI draft and the
 * version the user actually accepted. Only fires on a real pattern across
 * several edited outputs, so one-off edits don't create phantom rules.
 */
async function compileStyleHints(userId: string): Promise<string[]> {
  const signals = await getRecentStyleSignals(userId, 20)
  // Only pairs the user actually changed carry a style signal.
  const edited = signals.filter(s => s.user_final.trim() !== s.ai_draft.trim())
  if (edited.length < MIN_SIGNALS) return []

  const hints: string[] = []

  // 1. Length tendency.
  const deltas = edited
    .map(s => {
      const before = s.ai_draft.length
      return before > 0 ? (s.user_final.length - before) / before : 0
    })
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length
  if (avgDelta <= -0.15) {
    hints.push(`Prefers shorter output - trims accepted drafts by ~${Math.round(-avgDelta * 100)}% on average. Be more concise than usual.`)
  } else if (avgDelta >= 0.2) {
    hints.push('Tends to expand drafts - errs toward more detail, not less.')
  }

  // 2. Em-dash aversion (a common, strong tell).
  const emDashRemoved = edited.filter(s => s.ai_draft.includes('—') && !s.user_final.includes('—')).length
  const emDashCandidates = edited.filter(s => s.ai_draft.includes('—')).length
  if (emDashCandidates >= MIN_SIGNALS && emDashRemoved / emDashCandidates >= 0.6) {
    hints.push('Removes em-dashes from output. Do not use the — character; rephrase or use commas.')
  }

  // 3. Exclamation aversion.
  const bangRemoved = edited.filter(s => /!/.test(s.ai_draft) && !/!/.test(s.user_final)).length
  const bangCandidates = edited.filter(s => /!/.test(s.ai_draft)).length
  if (bangCandidates >= MIN_SIGNALS && bangRemoved / bangCandidates >= 0.6) {
    hints.push('Avoids exclamation marks - keep the tone measured.')
  }

  return hints
}
