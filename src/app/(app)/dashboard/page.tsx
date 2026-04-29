import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserSessions } from '@/lib/db/sessions'
import { getUsageInfo } from '@/lib/db/usage'
import { ClarityScoreBadge } from '@/components/ui/ClarityScoreBadge'
import { UpgradeButton } from '@/components/ui/UpgradeButton'

function ProgressRing({ used, limit }: { used: number; limit: number | null }) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0
  const r = 20
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct > 80 ? '#f97316' : pct > 60 ? '#eab308' : '#7c3aed'
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#1e2d4a" strokeWidth="4" />
      <circle
        cx="26" cy="26" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="26" y="30" textAnchor="middle" fill="#f0f4ff" fontSize="11" fontWeight="bold">
        {limit ? `${used}` : '∞'}
      </text>
    </svg>
  )
}

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

  const completedSessions = sessions.filter(s => s.clarityScoreAfter && s.clarityScoreBefore)
  const avgImprovement = completedSessions.length
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.clarityScoreAfter! - s.clarityScoreBefore!), 0) / completedSessions.length)
    : 0
  const avgScoreAfter = completedSessions.length
    ? Math.round(completedSessions.reduce((acc, s) => acc + s.clarityScoreAfter!, 0) / completedSessions.length)
    : 0

  const isNew = sessions.length === 0
  const streakDays = sessions.length > 0 ? Math.min(sessions.length, 7) : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f4ff]">
            {params.upgraded ? '🎉 Welcome to Pro!' : `Hey, ${firstName}`}
          </h1>
          <p className="text-sm text-[#8b9cc8] mt-1">
            {params.upgraded
              ? 'Unlimited analyses, insights, and full history are now unlocked.'
              : isNew
              ? 'Paste your first prompt and see how good it is.'
              : 'Keep improving — your scores are trending up.'}
          </p>
        </div>
        <Link
          href="/playground"
          className="shrink-0 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all glow-violet"
        >
          New prompt →
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Usage */}
        <div className="glass rounded-2xl p-4 border border-[#1e2d4a] flex items-center gap-3">
          <ProgressRing used={usage.used} limit={usage.limit} />
          <div>
            <p className="text-xs text-[#4a5a80] uppercase tracking-wider">Used</p>
            <p className="text-sm font-bold text-[#f0f4ff]">
              {usage.used}{usage.limit ? `/${usage.limit}` : ''}
            </p>
            <p className="text-xs text-[#4a5a80]">this month</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 border border-[#1e2d4a]">
          <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-1">Avg score</p>
          <p className="text-2xl font-bold text-[#f0f4ff]">{avgScoreAfter || '—'}</p>
          <p className="text-xs text-[#4a5a80]">after improvement</p>
        </div>

        <div className="glass rounded-2xl p-4 border border-[#1e2d4a]">
          <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-1">Avg lift</p>
          <p className={`text-2xl font-bold ${avgImprovement > 0 ? 'text-emerald-400' : 'text-[#f0f4ff]'}`}>
            {avgImprovement > 0 ? `+${avgImprovement}` : '—'}
          </p>
          <p className="text-xs text-[#4a5a80]">clarity points</p>
        </div>

        <div className="glass rounded-2xl p-4 border border-[#1e2d4a]">
          <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-1">Sessions</p>
          <p className="text-2xl font-bold text-[#f0f4ff]">{sessions.length}</p>
          <p className="text-xs text-[#4a5a80]">total</p>
        </div>
      </div>

      {/* Streak nudge — only show when user has some sessions */}
      {streakDays > 0 && streakDays < 7 && (
        <div className="flex items-center gap-3 px-5 py-3.5 glass rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <span className="text-amber-400 text-lg">🔥</span>
          <p className="text-sm text-[#f0f4ff]">
            <span className="font-semibold">{streakDays} prompt{streakDays !== 1 ? 's' : ''} improved</span>
            <span className="text-[#8b9cc8] ml-1">— keep going to build your streak</span>
          </p>
          <Link href="/playground" className="ml-auto text-xs text-amber-400 hover:text-amber-300 transition-colors shrink-0 font-semibold">
            Continue →
          </Link>
        </div>
      )}

      {/* Recent sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#f0f4ff] uppercase tracking-wider">Recent sessions</h2>
          {sessions.length > 0 && (
            <Link href="/history" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              View all →
            </Link>
          )}
        </div>

        {isNew ? (
          <div className="rounded-2xl p-8 border border-violet-500/20 bg-gradient-to-br from-violet-600/8 to-cyan-500/4 relative overflow-hidden">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
            <div className="relative">
              <h3 className="text-lg font-bold text-[#f0f4ff] mb-1.5">Analyze your first prompt</h3>
              <p className="text-sm text-[#8b9cc8] mb-5 max-w-md">
                Paste any prompt — even rough ideas work. Deepclario scores it, asks what&apos;s missing, then rewrites it.
                Try one of these to see it in action:
              </p>
              <div className="space-y-2 mb-6">
                {[
                  'Write a landing page hero for my SaaS',
                  'Help me refactor this auth code',
                  'Summarize this research paper for a non-technical reader',
                ].map(example => (
                  <Link
                    key={example}
                    href={`/playground?example=${encodeURIComponent(example)}`}
                    className="block px-4 py-2.5 rounded-xl border border-[#1e2d4a] bg-[#0f1628]/60 hover:border-violet-500/40 hover:bg-[#0f1628] text-sm text-[#cdd5ee] transition-all"
                  >
                    <span className="text-[#4a5a80] mr-2">→</span>
                    {example}
                  </Link>
                ))}
              </div>
              <Link
                href="/playground"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all glow-violet"
              >
                Start with my own prompt →
              </Link>
            </div>
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
                    <div className="shrink-0 flex items-center gap-1.5 text-xs">
                      <span className="text-[#4a5a80]">{session.clarityScoreBefore}</span>
                      <span className="text-[#2d4070]">→</span>
                      <span className="text-emerald-400 font-bold">{session.clarityScoreAfter}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pro upsell for free users */}
      {profile?.tier === 'free' && !isNew && (
        <div className="relative overflow-hidden rounded-2xl p-6 border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-cyan-500/5">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="font-bold text-[#f0f4ff] mb-1">See your full pattern report</h3>
              <p className="text-sm text-[#8b9cc8] max-w-sm">
                Pro users get weekly insight reports: your most common prompt gaps, your improvement
                trend, and personalized tips. Starting at $5/mo.
              </p>
            </div>
            <UpgradeButton
              plan="pro_monthly"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all cursor-pointer"
            >
              Unlock Pro →
            </UpgradeButton>
          </div>
        </div>
      )}

      {/* Quick tips for new users */}
      {isNew && (
        <div className="glass rounded-2xl border border-[#1e2d4a] p-5">
          <h3 className="text-sm font-semibold text-[#f0f4ff] mb-4 uppercase tracking-wider">Quick tips</h3>
          <ul className="space-y-3">
            {[
              { icon: '🎯', tip: 'A good prompt scores 80+. Most people start at 20–40 — and improve to 80+ after one session.' },
              { icon: '💬', tip: 'When Deepclario asks a clarifying question, answer honestly. The more context, the better the rewrite.' },
              { icon: '📋', tip: 'Copy the improved prompt and paste it directly into ChatGPT, Claude, or Gemini.' },
            ].map(({ icon, tip }) => (
              <li key={tip} className="flex items-start gap-3 text-sm text-[#8b9cc8]">
                <span className="shrink-0">{icon}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
