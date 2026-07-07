import { createClient } from '@/lib/supabase/server'
import type { ContextIdentityRow, ContextStyleSignalRow, Json } from '@/types/database'
import { EMPTY_IDENTITY, type Identity, type IdentitySuggestion } from './types'

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

/** Append one accepted-output signal for the Style layer. */
export async function recordStyleSignal(input: {
  userId: string
  sessionId?: string | null
  aiDraft: string
  userFinal: string
  source?: 'web' | 'extension'
}): Promise<void> {
  const supabase = await createClient()
  await supabase.from('context_style_signals').insert({
    user_id: input.userId,
    session_id: input.sessionId ?? null,
    ai_draft: input.aiDraft,
    user_final: input.userFinal,
    source: input.source ?? 'web',
  })
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
