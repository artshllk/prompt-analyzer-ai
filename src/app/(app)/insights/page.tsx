import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InsightsClient } from '@/components/insights/InsightsClient'
import { UpgradeButton } from '@/components/ui/UpgradeButton'

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  const isPro = profile?.tier === 'pro'

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Insights</h1>
        <p className="text-sm text-[#8b9cc8] mt-1">Weekly patterns and improvement trends.</p>
      </div>

      {isPro ? (
        <InsightsClient />
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-[#1e2d4a]">
          {/* Blurred preview */}
          <div className="blur-sm pointer-events-none select-none p-8 space-y-6" aria-hidden>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass rounded-2xl p-5 border border-[#1e2d4a]">
                  <div className="h-3 w-16 rounded shimmer mb-3" />
                  <div className="h-8 w-12 rounded shimmer" />
                </div>
              ))}
            </div>
            <div className="glass rounded-2xl p-5 border border-[#1e2d4a] h-32 shimmer" />
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e1a]/60 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-lg font-bold text-[#f0f4ff] mb-1">Pro Feature</p>
            <p className="text-sm text-[#8b9cc8] text-center max-w-xs mb-5">
              Weekly insights show your common mistakes, improvement trends, and patterns.
            </p>
            <UpgradeButton
              plan="pro_monthly"
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all glow-violet cursor-pointer"
            >
              Upgrade to Pro — $5/mo
            </UpgradeButton>
          </div>
        </div>
      )}
    </div>
  )
}
