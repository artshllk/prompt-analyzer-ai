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
    <div className="max-w-2xl mx-auto px-6 py-10 md:py-14 space-y-8">
      <header>
        <p className="eyebrow mb-3">Settings</p>
        <h1 className="display text-3xl md:text-4xl tracking-tight" style={{ color: 'var(--color-paper)' }}>
          Your account.
        </h1>
      </header>

      <SettingsClient
        email={profile?.email ?? user.email ?? ''}
        fullName={profile?.full_name ?? null}
        tier={profile?.tier ?? 'free'}
        subscriptionStatus={profile?.subscription_status ?? null}
      />
    </div>
  )
}
