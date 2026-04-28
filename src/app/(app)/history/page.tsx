import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSessions } from '@/lib/db/sessions'
import { ClarityScoreBadge } from '@/components/ui/ClarityScoreBadge'

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

  const { sessions, total } = await getUserSessions(user.id, limit, offset)
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f4ff]">Session History</h1>
        <p className="text-sm text-[#8b9cc8] mt-1">{total} session{total !== 1 ? 's' : ''} total</p>
      </div>

      {sessions.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-[#1e2d4a]">
          <p className="text-[#8b9cc8]">No sessions yet. Start in the Playground!</p>
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
                      {new Date(session.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                {session.clarityScoreBefore !== null && session.clarityScoreAfter !== null && (
                  <div className="shrink-0 flex items-center gap-2 text-xs">
                    <span className="text-[#4a5a80]">{session.clarityScoreBefore}</span>
                    <span className="text-[#2d4070]">→</span>
                    <span className="text-emerald-400 font-bold">{session.clarityScoreAfter}</span>
                  </div>
                )}
                <svg
                  width="14" height="14" viewBox="0 0 14 14" fill="none"
                  className="shrink-0 text-[#4a5a80] group-open:rotate-180 transition-transform"
                >
                  <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </summary>

              <div className="px-4 pb-4 space-y-3 border-t border-[#1e2d4a] pt-4">
                {/* Original */}
                <div>
                  <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-2">Original</p>
                  <p className="text-sm text-[#8b9cc8] leading-relaxed whitespace-pre-wrap bg-[#0a0e1a] rounded-xl p-3">
                    {session.originalPrompt}
                  </p>
                </div>

                {/* Q&A exchanges */}
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

                {/* Improvement */}
                {session.improvement && (
                  <div>
                    <p className="text-xs text-[#4a5a80] uppercase tracking-wider mb-2">Improved</p>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <a
              key={p}
              href={`?page=${p}`}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all ${
                p === page
                  ? 'bg-violet-600 text-white'
                  : 'text-[#8b9cc8] hover:bg-[#0f1628] border border-[#1e2d4a]'
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
