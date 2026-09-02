import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/ui/AppShell'
import { hasStoredHistory } from '@/lib/db/has-history'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const hasHistory = await hasStoredHistory(user.id)

  return (
    <div className="editorial grain no-page-transition min-h-screen" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <AppShell hasHistory={hasHistory}>{children}</AppShell>
    </div>
  )
}
