import { createClient } from '@/lib/supabase/server'

/**
 * Does this person have any prompt-improver work stored?
 *
 * The sidebar shows History only if so, and the same answer is needed by every
 * surface that renders the sidebar, which is now three of them. One
 * implementation so they cannot drift.
 *
 * Counted with head:true so no rows cross the wire, and it fails toward SHOWING
 * the item: if the count cannot be read we would rather display a nav item that
 * turns out to be empty than hide someone's own work behind our database having
 * a bad minute.
 */
export async function hasStoredHistory(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('prompt_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  return error ? true : (count ?? 0) > 0
}
