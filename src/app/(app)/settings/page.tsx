import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, tier, subscription_status, subscription_period_end')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Settings</h1>
        <p className="text-sm text-[#8b9cc8] mt-1">Manage your account.</p>
      </div>

      <SettingsClient
        email={profile?.email ?? user.email ?? ''}
        fullName={profile?.full_name ?? null}
        tier={profile?.tier ?? 'free'}
        subscriptionStatus={profile?.subscription_status ?? null}
      />
    </div>
  )
}
