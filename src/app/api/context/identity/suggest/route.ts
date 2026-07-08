import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRecentPrompts, saveSuggestion, dismissSuggestion } from '@/lib/context/graph'
import { suggestIdentity } from '@/lib/context/extract'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Auto-extract an identity suggestion from the user's recent prompts. The
 * result is stored as a pending suggestion (never applied) for the user to
 * confirm in settings - the "we noticed you might be X" flow.
 */
export async function POST() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const prompts = await getRecentPrompts(user.id, 15)
  if (prompts.length < 3) {
    return NextResponse.json({ suggestion: null, reason: 'not_enough_history' })
  }

  const suggestion = await suggestIdentity(prompts)
  if (!suggestion) {
    await dismissSuggestion(user.id)
    return NextResponse.json({ suggestion: null, reason: 'nothing_inferred' })
  }

  await saveSuggestion(user.id, suggestion)
  return NextResponse.json({ suggestion })
}

/**
 * Dismiss the pending suggestion for real. The UI's Dismiss button calls
 * this - clearing local state alone would let the stored suggestion
 * reappear on the next page load.
 */
export async function DELETE() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  await dismissSuggestion(user.id)
  return NextResponse.json({ ok: true })
}
