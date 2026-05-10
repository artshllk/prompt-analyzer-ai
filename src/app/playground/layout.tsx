import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/ui/AppShell'
import { getUsageInfo } from '@/lib/db/usage'

export default async function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Anonymous visitors use the homepage demo, not the playground.
  // This removes the duplicate flow between /#try and /playground.
  if (!user) {
    redirect('/?try=1#try')
  }

  const usage = await getUsageInfo(user.id)
  return (
    <div className="editorial grain min-h-screen" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <AppShell usage={usage}>{children}</AppShell>
    </div>
  )
}
