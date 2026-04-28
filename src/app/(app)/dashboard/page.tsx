import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserSessions } from '@/lib/db/sessions'
import { getUsageInfo } from '@/lib/db/usage'
import { ClarityScoreBadge } from '@/components/ui/ClarityScoreBadge'
import { UpgradeButton } from '@/components/ui/UpgradeButton'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const [{ data: profile }, { sessions }, usage] = await Promise.all([
    supabase.from('profiles').select('full_name, tier, onboarding_completed').eq('id', user.id).single(),
    getUserSessions(user.id, 5, 0),
    getUsageInfo(user.id),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const avgImprovement = sessions.length
    ? Math.round(
        sessions
          .filter(s => s.clarityScoreAfter && s.clarityScoreBefore)
          .reduce((acc, s) => acc + (s.clarityScoreAfter! - s.clarityScoreBefore!), 0) /
          Math.max(sessions.filter(s => s.clarityScoreAfter && s.clarityScoreBefore).length, 1)
      )
    : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f4ff]">
            {params.upgraded ? '🎉 Welcome to Pro!' : `Hey, ${firstName}`}
          </h1>
          <p className="text-sm text-[#8b9cc8] mt-1">
            {params.upgraded
              ? 'Unlimited analyses, insights, and full history are now unlocked.'
              : 'Ready to engineer a better prompt?'}
          </p>
        </div>
        <Link
          href="/playground"
          className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all glow-violet"
        >
          New Prompt →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Prompts analyzed', value: usage.used, sub: 'this month' },
          { label: 'Avg improvement', value: avgImprovement ? `+${avgImprovement}` : '—', sub: 'clarity points' },
          { label: 'Sessions saved', value: sessions.length, sub: 'total' },
        ].map(stat => (
          <div key={stat.label} className="glass rounded-2xl p-5 border border-[#1e2d4a]">
            <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-[#f0f4ff] mb-0.5">{stat.value}</p>
            <p className="text-xs text-[#4a5a80]">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#f0f4ff] uppercase tracking-wider">Recent sessions</h2>
          <Link href="/history" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            View all →
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center border border-[#1e2d4a]">
            <p className="text-[#8b9cc8] text-sm mb-4">No sessions yet. Write your first prompt!</p>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-600/30 transition-all"
            >
              Open Playground →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div
                key={session.id}
                className="glass rounded-2xl p-4 border border-[#1e2d4a] hover:border-[#2d4070] transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <ClarityScoreBadge
                      score={session.clarityScoreAfter ?? session.clarityScoreBefore ?? 0}
                      size="sm"
                      animate={false}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#f0f4ff] truncate font-medium">
                      {session.originalPrompt.slice(0, 100)}
                      {session.originalPrompt.length > 100 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-[#4a5a80] capitalize">{session.tone}</span>
                      {session.clarifyTurns > 0 && (
                        <span className="text-xs text-[#4a5a80]">{session.clarifyTurns} clarification{session.clarifyTurns !== 1 ? 's' : ''}</span>
                      )}
                      <span className="text-xs text-[#4a5a80]">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {session.clarityScoreBefore && session.clarityScoreAfter && (
                    <div className="shrink-0 text-xs font-bold text-emerald-400">
                      +{session.clarityScoreAfter - session.clarityScoreBefore}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pro upgrade CTA for free users */}
      {profile?.tier === 'free' && (
        <div className="relative overflow-hidden rounded-2xl p-6 border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-cyan-500/5">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
          <h3 className="text-base font-bold text-[#f0f4ff] mb-1">Unlock Pro insights</h3>
          <p className="text-sm text-[#8b9cc8] mb-4">
            Weekly pattern reports, unlimited analyses, and full history. Starting at $5/mo.
          </p>
          <UpgradeButton
            plan="pro_monthly"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all cursor-pointer"
          >
            Upgrade to Pro →
          </UpgradeButton>
        </div>
      )}
    </div>
  )
}
