import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/ui/AppShell'

export default async function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Anonymous visitors use the homepage demo, not the playground.
  if (!user) {
    redirect('/?try=1#try')
  }

  return (
    <div className="editorial grain min-h-screen" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <AppShell>{children}</AppShell>
    </div>
  )
}
