import { createClient } from '@/lib/supabase/server'
import { hasStoredHistory } from '@/lib/db/has-history'
import { AppShell } from './AppShell'

/**
 * The app shell, deciding its own contents.
 *
 * THE BUG THIS EXISTS TO MAKE IMPOSSIBLE. AppShell took `hasHistory` as a
 * prop, so the sidebar's contents depended on what each page happened to have
 * fetched. /detector composed the shell itself and passed nothing, so History
 * silently vanished on that one route. The sidebar was different depending on
 * which page you were standing on, which is the second sidebar bug caused by a
 * page-level assumption.
 *
 * A page should be able to render the shell without knowing anything about
 * what is in it. So the shell asks. AppShell is a client component and cannot
 * read the database, so this server wrapper is where "the shell decides"
 * actually lives; every route renders this and passes nothing.
 *
 * See app-shell.test.ts, which asserts no route renders AppShell directly.
 */
export async function AppFrame({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Signed out is not this component's problem: every route that renders it
  // has already decided what to do about that, and they do different things.
  // /check sends people to the landing page, the (app) group sends them to
  // /login.
  const hasHistory = user ? await hasStoredHistory(user.id) : false

  return (
    <div
      className="editorial grain no-page-transition min-h-screen"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      <AppShell hasHistory={hasHistory}>{children}</AppShell>
    </div>
  )
}
