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
    /**
     * Anchored, not centred. The column used to be centred in the space left
     * over beside the sidebar, which put about 500px of nothing between the
     * nav and the content on a wide screen. Now it sits a fixed distance from
     * the sidebar and the space falls on the right, where empty space is
     * ordinary rather than a gap.
     */
    <div className="px-6 md:pl-14 md:pr-10 py-10 md:py-14">
      <div className="max-w-[680px]">
        <h1
          className="display text-3xl md:text-4xl tracking-tight mb-8 md:mb-10"
          style={{ color: 'var(--ink)' }}
        >
          Settings
        </h1>

        <SettingsClient
          email={profile?.email ?? user.email ?? ''}
          fullName={profile?.full_name ?? null}
          tier={profile?.tier ?? 'free'}
          subscriptionStatus={profile?.subscription_status ?? null}
        />
      </div>
    </div>
  )
}
