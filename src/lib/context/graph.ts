import { createClient } from '@/lib/supabase/server'
import type { ContextIdentityRow, ContextMemoryRow, ContextStyleSignalRow, Json } from '@/types/database'
import {
  EMPTY_IDENTITY,
  type Identity,
  type IdentitySuggestion,
  type Memory,
  type MemoryKind,
  type MemorySource,
  type MemoryStatus,
} from './types'

/**
 * Server-side data access for the Context Graph. Everything is RLS-scoped
 * to the authenticated user, so these read/write only the caller's own
 * graph. Reads never throw: a missing graph is just an empty Identity.
 */

function rowToIdentity(row: ContextIdentityRow | null): Identity {
  if (!row) return EMPTY_IDENTITY
  return {
    role: row.role,
    company: row.company,
    industry: row.industry,
    expertiseLevel: row.expertise_level,
    languages: row.languages ?? [],
    toneNote: row.tone_note,
    confirmed: row.confirmed,
    suggestion: (row.suggestion as IdentitySuggestion | null) ?? null,
  }
}

export async function getIdentity(userId: string): Promise<Identity> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('context_identity')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return rowToIdentity(data as ContextIdentityRow | null)
}

/**
 * Upsert confirmed identity fields. Marks the graph confirmed and clears
 * any pending suggestion, since the user has now spoken for these values.
 */
export async function saveIdentity(
  userId: string,
  fields: Partial<Pick<Identity, 'role' | 'company' | 'industry' | 'expertiseLevel' | 'languages' | 'toneNote'>>,
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('context_identity').upsert(
    {
      user_id: userId,
      ...(fields.role !== undefined && { role: fields.role }),
      ...(fields.company !== undefined && { company: fields.company }),
      ...(fields.industry !== undefined && { industry: fields.industry }),
      ...(fields.expertiseLevel !== undefined && { expertise_level: fields.expertiseLevel }),
      ...(fields.languages !== undefined && { languages: fields.languages }),
      ...(fields.toneNote !== undefined && { tone_note: fields.toneNote }),
      confirmed: true,
      suggestion: null,
    },
    { onConflict: 'user_id' },
  )
}

/** Store an auto-extracted suggestion without touching confirmed fields. */
export async function saveSuggestion(userId: string, suggestion: IdentitySuggestion): Promise<void> {
  const supabase = await createClient()
  await supabase.from('context_identity').upsert(
    { user_id: userId, suggestion: suggestion as unknown as Json },
    { onConflict: 'user_id' },
  )
}

export async function dismissSuggestion(userId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('context_identity').update({ suggestion: null }).eq('user_id', userId)
}

/**
 * Record one accepted-output signal for the Style layer. A session carries
 * at most one signal: edit-commit then copy must update the same row, not
 * stack duplicates that would double-weight one edit in the heuristics.
 */
export async function recordStyleSignal(input: {
  userId: string
  sessionId?: string | null
  aiDraft: string
  userFinal: string
  source?: 'web' | 'extension'
}): Promise<void> {
  const supabase = await createClient()
  const row = {
    user_id: input.userId,
    session_id: input.sessionId ?? null,
    ai_draft: input.aiDraft,
    user_final: input.userFinal,
    source: input.source ?? 'web',
  }
  if (row.session_id) {
    await supabase.from('context_style_signals').upsert(row, { onConflict: 'session_id' })
  } else {
    await supabase.from('context_style_signals').insert(row)
  }
}

export async function getRecentStyleSignals(
  userId: string,
  limit = 20,
): Promise<Pick<ContextStyleSignalRow, 'ai_draft' | 'user_final'>[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('context_style_signals')
    .select('ai_draft, user_final')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

function rowToMemory(row: ContextMemoryRow): Memory {
  return {
    id: row.id,
    kind: row.kind,
    content: row.content,
    source: row.source,
    status: row.status,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
  }
}

/** All non-archived memories, newest first. Archived rows stay in the DB but out of the UI. */
export async function listMemories(userId: string): Promise<Memory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('context_memories')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
  return ((data ?? []) as ContextMemoryRow[]).map(rowToMemory)
}

/** Active memories only - what compile is allowed to inject. */
export async function getActiveMemories(userId: string): Promise<Memory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('context_memories')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  return ((data ?? []) as ContextMemoryRow[]).map(rowToMemory)
}

export async function countActiveMemories(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('context_memories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')
  return count ?? 0
}

export async function addMemory(input: {
  userId: string
  kind: MemoryKind
  content: string
  source?: MemorySource
  status?: MemoryStatus
  confidence?: number | null
  evidence?: Json | null
}): Promise<Memory | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('context_memories')
    .insert({
      user_id: input.userId,
      kind: input.kind,
      content: input.content,
      source: input.source ?? 'user',
      status: input.status ?? 'active',
      confidence: input.confidence ?? null,
      evidence: input.evidence ?? null,
    })
    .select('*')
    .single()
  return data ? rowToMemory(data as ContextMemoryRow) : null
}

export async function updateMemory(
  userId: string,
  id: string,
  fields: Partial<Pick<Memory, 'content' | 'kind' | 'status'>>,
): Promise<Memory | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('context_memories')
    .update({
      ...(fields.content !== undefined && { content: fields.content }),
      ...(fields.kind !== undefined && { kind: fields.kind }),
      ...(fields.status !== undefined && { status: fields.status }),
    })
    .eq('user_id', userId)
    .eq('id', id)
    .select('*')
    .maybeSingle()
  return data ? rowToMemory(data as ContextMemoryRow) : null
}

export async function deleteMemory(userId: string, id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('context_memories').delete().eq('user_id', userId).eq('id', id)
}

/** Stamp the memories a rewrite actually used - powers "used 2d ago" and recency selection. */
export async function markMemoriesUsed(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const supabase = await createClient()
  await supabase
    .from('context_memories')
    .update({ last_used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .in('id', ids)
}

/**
 * Wipe the user's whole Context Graph: identity, memories, and raw style
 * signals. The destructive escape hatch every memory feature owes its users.
 */
export async function clearContext(userId: string): Promise<void> {
  const supabase = await createClient()
  await Promise.all([
    supabase.from('context_identity').delete().eq('user_id', userId),
    supabase.from('context_memories').delete().eq('user_id', userId),
    supabase.from('context_style_signals').delete().eq('user_id', userId),
  ])
}

/** Recent original prompts - the raw material for identity auto-extraction. */
export async function getRecentPrompts(userId: string, limit = 15): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('prompt_sessions')
    .select('original_prompt')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map(r => r.original_prompt)
}
