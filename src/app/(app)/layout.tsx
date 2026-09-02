import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/ui/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  /**
   * Does this person have any prompt-improver work stored?
   *
   * History is shown only if so. A new user gets a sidebar with one item on
   * it, which is right, because there is one product. Anyone with stored
   * sessions keeps both the item and the work.
   *
   * Counted with head:true so no rows cross the wire, and it fails toward
   * SHOWING the item: if the count cannot be read we would rather display a
   * nav item that turns out to be empty than hide someone's own work behind
   * our database having a bad minute.
   */
  const { count, error } = await supabase
    .from('prompt_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const hasHistory = error ? true : (count ?? 0) > 0

  return (
    <div className="editorial grain no-page-transition min-h-screen" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <AppShell hasHistory={hasHistory}>{children}</AppShell>
    </div>
  )
}
