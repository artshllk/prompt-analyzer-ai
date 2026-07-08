import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/SettingsClient'
import { ContextSettingsSection } from '@/components/context/ContextSettingsSection'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, tier, subscription_status, subscription_period_end')
    .eq('id', user.id)
    .single()

  const tier = profile?.tier ?? 'free'

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Settings</h1>
        <p className="text-sm text-[#8b9cc8] mt-1">Manage your account.</p>
      </div>

      <ContextSettingsSection />

      <SettingsClient
        email={profile?.email ?? user.email ?? ''}
        fullName={profile?.full_name ?? null}
        tier={tier}
        subscriptionStatus={profile?.subscription_status ?? null}
      />
    </div>
  )
}
