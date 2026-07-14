import { createServiceClient } from '@/lib/supabase/server'

/**
 * Memory: what the user keeps telling us.
 *
 * The engine asks what a prompt is missing ("Who is this for?"). The user
 * answers. We used to fold that into the prompt and forget it, so the next
 * vague prompt got the same question, cold, as if we had never met.
 *
 * Now we remember the ANSWER. "You usually say engineering leads" is worth far
 * more than "you usually forget audience" - it is the difference between a
 * tool that scores you and an assistant that knows you.
 *
 * Everything here is fire-and-forget: memory is a nice-to-have, and a failed
 * write must never break someone's rewrite.
 */

export interface Memory {
  label: string
  answer: string
  timesUsed: number
}

/** Same gap, different capitalisation, is the same memory. */
function normalise(label: string): string {
  return label.trim().toLowerCase()
}

/**
 * The user answered a question. Remember it - or, if we already remembered
 * something for this gap, update it and count the repeat.
 *
 * Answering the same thing repeatedly is what turns a guess into a habit, so
 * times_used is what we later use to decide whether we trust a memory enough
 * to offer it.
 */
export async function rememberAnswers(
  userId: string,
  answers: Array<{ label: string; answer: string }>
): Promise<void> {
  if (!answers.length) return

  try {
    const supabase = await createServiceClient()

    for (const a of answers) {
      const label = normalise(a.label)
      const answer = a.answer.trim()
      // Long answers are prose, not a reusable fact. Do not remember an essay.
      if (!label || !answer || answer.length > 120) continue

      // Read-then-write is not atomic: two answers landing together both read
      // the old count and both write the same value, so a repeat can silently
      // fail to count. Let Postgres do it - the unique (user_id, label) index
      // turns this into an atomic insert-or-increment.
      const { error } = await supabase.rpc('bump_memory', {
        p_user_id: userId,
        p_label: label,
        p_answer: answer,
      })

      if (error) {
        console.error('[memory] bump_memory failed:', error.message)
      }
    }
  } catch (err) {
    console.error('[memory] rememberAnswers threw:', (err as Error).message)
  }
}

/**
 * What we know about this user. Ordered by how often they have said it, so the
 * strongest habits come first.
 */
export async function recallMemory(userId: string): Promise<Memory[]> {
  try {
    const supabase = await createServiceClient()
    const { data } = await supabase
      .from('user_memory')
      .select('label, answer, times_used')
      .eq('user_id', userId)
      .order('times_used', { ascending: false })
      .limit(12)

    return (data ?? []).map(r => ({
      label: r.label,
      answer: r.answer,
      timesUsed: r.times_used ?? 1,
    }))
  } catch (err) {
    console.error('[memory] recallMemory threw:', (err as Error).message)
    return []
  }
}

/** Forget one thing. */
export async function forgetMemory(userId: string, label: string): Promise<void> {
  try {
    const supabase = await createServiceClient()
    await supabase
      .from('user_memory')
      .delete()
      .eq('user_id', userId)
      .eq('label', normalise(label))
  } catch (err) {
    console.error('[memory] forgetMemory threw:', (err as Error).message)
  }
}

/** Forget everything. */
export async function forgetAll(userId: string): Promise<void> {
  try {
    const supabase = await createServiceClient()
    await supabase.from('user_memory').delete().eq('user_id', userId)
  } catch (err) {
    console.error('[memory] forgetAll threw:', (err as Error).message)
  }
}
