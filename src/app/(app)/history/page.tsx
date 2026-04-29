import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserSessions } from '@/lib/db/sessions'
import { ClarityScoreBadge } from '@/components/ui/ClarityScoreBadge'

function ScoreTrend({ sessions }: { sessions: Array<{ clarityScoreAfter?: number | null; clarityScoreBefore?: number | null }> }) {
  const points = sessions
    .filter(s => s.clarityScoreAfter != null)
    .slice(0, 10)
    .reverse()
    .map(s => s.clarityScoreAfter!)

  if (points.length < 2) return null

  const w = 80, h = 28
  const min = Math.min(...points) - 5
  const max = Math.max(...points) + 5
  const xs = points.map((_, i) => (i / (points.length - 1)) * w)
  const ys = points.map(v => h - ((v - min) / (max - min)) * h)
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')

  const trend = points[points.length - 1] - points[0]

  return (
    <div className="flex items-center gap-2">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <path d={path} fill="none" stroke={trend >= 0 ? '#34d399' : '#f87171'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend >= 0 ? '+' : ''}{trend}
      </span>
    </div>
  )
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const limit = 15
  const offset = (page - 1) * limit

  const [{ sessions, total }, allForStats] = await Promise.all([
    getUserSessions(user.id, limit, offset),
    getUserSessions(user.id, 100, 0),
  ])

  const totalPages = Math.ceil(total / limit)

  const completed = allForStats.sessions.filter(s => s.clarityScoreBefore != null && s.clarityScoreAfter != null)
  const avgBefore = completed.length ? Math.round(completed.reduce((a, s) => a + s.clarityScoreBefore!, 0) / completed.length) : 0
  const avgAfter = completed.length ? Math.round(completed.reduce((a, s) => a + s.clarityScoreAfter!, 0) / completed.length) : 0
  const avgLift = avgAfter - avgBefore
  const bestSession = completed.length ? completed.reduce((best, s) =>
    (s.clarityScoreAfter! - s.clarityScoreBefore!) > (best.clarityScoreAfter! - best.clarityScoreBefore!) ? s : best
  ) : null

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f4ff]">Session History</h1>
          <p className="text-sm text-[#8b9cc8] mt-1">{total} session{total !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/playground"
          className="shrink-0 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all glow-violet"
        >
          New prompt →
        </Link>
      </div>

      {/* Summary stats */}
      {completed.length >= 2 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-4 border border-[#1e2d4a]">
            <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-1">Avg before</p>
            <p className="text-2xl font-bold text-red-400">{avgBefore}</p>
            <p className="text-xs text-[#4a5a80]">clarity score</p>
          </div>
          <div className="glass rounded-2xl p-4 border border-[#1e2d4a]">
            <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-1">Avg after</p>
            <p className="text-2xl font-bold text-emerald-400">{avgAfter}</p>
            <p className="text-xs text-[#4a5a80]">clarity score</p>
          </div>
          <div className="glass rounded-2xl p-4 border border-[#1e2d4a]">
            <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-1">Avg lift</p>
            <p className="text-2xl font-bold text-violet-400">+{avgLift}</p>
            <p className="text-xs text-[#4a5a80]">per session</p>
          </div>
          <div className="glass rounded-2xl p-4 border border-[#1e2d4a]">
            <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-1">Score trend</p>
            <ScoreTrend sessions={allForStats.sessions} />
          </div>
        </div>
      )}

      {/* Best session callout */}
      {bestSession && (
        <div className="flex items-center gap-4 px-5 py-4 glass rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <span className="text-2xl shrink-0">🏆</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#f0f4ff]">Your best improvement</p>
            <p className="text-xs text-[#8b9cc8] truncate mt-0.5">{bestSession.originalPrompt.slice(0, 80)}...</p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 text-sm font-bold">
            <span className="text-red-400">{bestSession.clarityScoreBefore}</span>
            <span className="text-[#2d4070]">→</span>
            <span className="text-emerald-400">{bestSession.clarityScoreAfter}</span>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-[#1e2d4a]">
          <p className="text-[#8b9cc8] mb-4">No sessions yet.</p>
          <Link href="/playground" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
            Start your first analysis →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <details key={session.id} className="group glass rounded-2xl border border-[#1e2d4a] hover:border-[#2d4070] transition-all overflow-hidden">
              <summary className="flex items-start gap-4 p-4 cursor-pointer list-none">
                <div className="shrink-0 mt-0.5">
                  <ClarityScoreBadge
                    score={session.clarityScoreAfter ?? session.clarityScoreBefore ?? 0}
                    size="sm"
                    animate={false}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#f0f4ff] font-medium leading-snug">
                    {session.originalPrompt.slice(0, 120)}
                    {session.originalPrompt.length > 120 ? '...' : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-[#4a5a80] capitalize">{session.tone}</span>
                    <span className="text-xs text-[#4a5a80] capitalize">{session.status}</span>
                    {session.clarifyTurns > 0 && (
                      <span className="text-xs text-[#4a5a80]">{session.clarifyTurns} Q&amp;A{session.clarifyTurns !== 1 ? 's' : ''}</span>
                    )}
                    <span className="text-xs text-[#4a5a80]">
                      {new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {session.clarityScoreBefore != null && session.clarityScoreAfter != null && (
                  <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold">
                    <span className="text-red-400">{session.clarityScoreBefore}</span>
                    <span className="text-[#2d4070]">→</span>
                    <span className="text-emerald-400">{session.clarityScoreAfter}</span>
                    <span className="text-emerald-400 ml-1">(+{session.clarityScoreAfter - session.clarityScoreBefore})</span>
                  </div>
                )}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  className="shrink-0 text-[#4a5a80] group-open:rotate-180 transition-transform">
                  <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </summary>

              <div className="px-4 pb-4 space-y-3 border-t border-[#1e2d4a] pt-4">
                <div>
                  <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-2">Original</p>
                  <p className="text-sm text-[#8b9cc8] leading-relaxed whitespace-pre-wrap bg-[#0a0e1a] rounded-xl p-3">
                    {session.originalPrompt}
                  </p>
                </div>

                {session.exchanges.length > 0 && (
                  <div>
                    <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-2">Clarifications</p>
                    <div className="space-y-2">
                      {session.exchanges.map(e => (
                        <div key={e.turn} className="bg-[#0a0e1a] rounded-xl p-3 space-y-1.5">
                          <p className="text-xs text-amber-400">Q: {e.question}</p>
                          {e.answer && <p className="text-xs text-[#8b9cc8]">A: {e.answer}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {session.improvement && (
                  <div>
                    <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-2">Improved prompt</p>
                    <p className="text-sm text-[#f0f4ff] leading-relaxed whitespace-pre-wrap bg-violet-500/5 border border-violet-500/20 rounded-xl p-3">
                      {session.improvement.improvedPrompt}
                    </p>
                    <p className="text-xs text-[#8b9cc8] mt-2 leading-relaxed">{session.improvement.explanation}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {session.improvement.improvementTags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 capitalize">
                          +{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <a
              key={p}
              href={`?page=${p}`}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all ${
                p === page ? 'bg-violet-600 text-white' : 'text-[#8b9cc8] hover:bg-[#0f1628] border border-[#1e2d4a]'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
