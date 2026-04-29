import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/ui/AppShell'
import { PublicNav } from '@/components/ui/PublicNav'
import { getUsageInfo } from '@/lib/db/usage'

export default async function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e1a]">
        <PublicNav />
        <div className="pt-16">{children}</div>
      </div>
    )
  }

  const usage = await getUsageInfo(user.id)
  return <AppShell usage={usage}>{children}</AppShell>
}
