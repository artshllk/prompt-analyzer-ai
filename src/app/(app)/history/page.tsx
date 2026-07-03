import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserSessions } from '@/lib/db/sessions'
import { SessionStatusChip } from '@/components/ui/SessionStatusChip'
import { HISTORY_FREE_DAYS, windowStart } from '@/lib/limits'

function ScoreTrend({ sessions }: { sessions: Array<{ clarityScoreAfter?: number | null; clarityScoreBefore?: number | null }> }) {
  const points = sessions
    .filter(s => s.clarityScoreAfter != null)
    .slice(0, 10)
    .reverse()
    .map(s => s.clarityScoreAfter!)

  if (points.length < 2) return null

  const w = 96, h = 28
  const min = Math.min(...points) - 5
  const max = Math.max(...points) + 5
  const xs = points.map((_, i) => (i / (points.length - 1)) * w)
  const ys = points.map(v => h - ((v - min) / (max - min)) * h)
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')

  const trend = points[points.length - 1] - points[0]
  const color = trend >= 0 ? 'var(--color-paper)' : '#C25E5E'

  return (
    <div className="flex items-center gap-2">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <path d={path} fill="none" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-serif text-base tabular-nums" style={{ color, fontWeight: 400 }}>
        {trend >= 0 ? '+' : ''}{trend}
      </span>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score < 30) return '#C25E5E'
  if (score < 60) return 'var(--color-paper-mute)'
  return 'var(--color-paper)'
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()
  const isPro = profile?.tier === 'pro'

  // Free users see the advertised 7-day window; Pro keeps everything.
  const since = isPro ? undefined : windowStart(HISTORY_FREE_DAYS * 24)

  const [{ sessions, total }, allForStats] = await Promise.all([
    getUserSessions(user.id, limit, offset, since),
    getUserSessions(user.id, 100, 0, since),
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
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-12">
      {/* Heading */}
      <header className="grid md:grid-cols-12 gap-6 md:gap-12 items-end">
        <div className="md:col-span-9">
          <p className="eyebrow mb-4">History</p>
          <h1 className="display text-4xl md:text-6xl" style={{ color: 'var(--color-paper)' }}>
            {total === 0 ? <>Nothing yet.</> : <>Every prompt <span style={{ color: 'var(--color-paper-mute)' }}>you have improved.</span></>}
          </h1>
          {total > 0 && (
            <p className="mt-5 text-base md:text-lg leading-[1.55] max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
              {total} session{total !== 1 ? 's' : ''}. Click any one to see the original, the questions we asked, and the rewrite.
            </p>
          )}
        </div>
        <div className="md:col-span-3 flex md:justify-end">
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
            style={{
              background: 'var(--color-paper)',
              color: 'var(--color-ink)',
              fontWeight: 500,
            }}
          >
            New analysis
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Free-tier retention note - Pro keeps everything. */}
      {!isPro && (
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3"
          style={{ borderTop: '1px solid var(--color-rule-strong)', borderBottom: '1px solid var(--color-rule-strong)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
            Showing your last {HISTORY_FREE_DAYS} days. Pro keeps your full history, forever.
          </p>
          <Link
            href="/pricing"
            className="text-sm underline-offset-4 hover:underline transition-all"
            style={{ color: 'var(--color-paper)' }}
          >
            Upgrade to Pro →
          </Link>
        </div>
      )}

      {/* Summary stats - single horizontal data row */}
      {completed.length >= 2 && (
        <section>
          <div className="rule-strong" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 py-8">
            <div>
              <p className="eyebrow mb-3">Average before</p>
              <p className="font-serif text-3xl md:text-4xl tabular-nums" style={{ color: scoreColor(avgBefore), fontWeight: 400 }}>{avgBefore}</p>
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-paper-mute)' }}>clarity score</p>
            </div>
            <div>
              <p className="eyebrow mb-3">Average after</p>
              <p className="font-serif text-3xl md:text-4xl tabular-nums" style={{ color: scoreColor(avgAfter), fontWeight: 400 }}>{avgAfter}</p>
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-paper-mute)' }}>clarity score</p>
            </div>
            <div>
              <p className="eyebrow mb-3">Average lift</p>
              <p className="font-serif text-3xl md:text-4xl tabular-nums" style={{ color: 'var(--color-accent)', fontWeight: 400 }}>+{avgLift}</p>
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-paper-mute)' }}>per session</p>
            </div>
            <div>
              <p className="eyebrow mb-3">Trend</p>
              <ScoreTrend sessions={allForStats.sessions} />
            </div>
          </div>
          <div className="rule-strong" />
        </section>
      )}

      {/* Best session callout - editorial pull-quote */}
      {bestSession && (
        <section className="grid md:grid-cols-12 gap-6 md:gap-12 py-2">
          <div className="md:col-span-3">
            <p className="eyebrow">Your best lift</p>
          </div>
          <div className="md:col-span-9">
            <p
              className="font-serif text-xl md:text-2xl leading-snug mb-3"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              &ldquo;{bestSession.originalPrompt.slice(0, 120)}{bestSession.originalPrompt.length > 120 ? '…' : ''}&rdquo;
            </p>
            <div className="flex items-baseline gap-2 text-base">
              <span className="font-serif tabular-nums text-2xl" style={{ color: scoreColor(bestSession.clarityScoreBefore!), fontWeight: 400 }}>
                {bestSession.clarityScoreBefore}
              </span>
              <span style={{ color: 'var(--color-paper-mute)' }}>→</span>
              <span className="font-serif tabular-nums text-2xl" style={{ color: scoreColor(bestSession.clarityScoreAfter!), fontWeight: 400 }}>
                {bestSession.clarityScoreAfter}
              </span>
              <span className="text-sm ml-1" style={{ color: 'var(--color-accent)' }}>
                +{bestSession.clarityScoreAfter! - bestSession.clarityScoreBefore!}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <section className="grid md:grid-cols-12 gap-6 md:gap-12 py-8">
          <div className="md:col-span-4">
            <p className="eyebrow">Empty</p>
          </div>
          <div className="md:col-span-8">
            <p
              className="font-serif text-2xl md:text-3xl leading-tight tracking-tight mb-6"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              You have not run anything through the playground yet.
            </p>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
              style={{
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                fontWeight: 500,
              }}
            >
              Start your first session
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>
      ) : (
        <section>
          <div className="rule-strong" />
          {sessions.map(session => (
            <details key={session.id} className="group">
              <summary className="grid grid-cols-12 gap-3 md:gap-6 px-4 -mx-4 py-5 items-center cursor-pointer list-none row-hover rounded-md">
                <div className="col-span-2 md:col-span-1">
                  <span
                    className="font-serif text-2xl tabular-nums"
                    style={{
                      color: scoreColor(session.clarityScoreAfter ?? session.clarityScoreBefore ?? 0),
                      fontWeight: 400,
                    }}
                  >
                    {session.clarityScoreAfter ?? session.clarityScoreBefore ?? 0}
                  </span>
                </div>
                <div className="col-span-10 md:col-span-7 min-w-0">
                  <p className="text-sm md:text-base truncate" style={{ color: 'var(--color-paper)' }}>
                    {session.originalPrompt.length > 120 ? session.originalPrompt.slice(0, 120) + '…' : session.originalPrompt}
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--color-paper-mute)' }}>
                    <span className="capitalize">{session.tone}</span>
                    {session.clarifyTurns > 0 && <> · {session.clarifyTurns} clarification{session.clarifyTurns !== 1 ? 's' : ''}</>}
                    <> · </>
                    {new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="col-span-10 md:col-span-3 flex justify-end">
                  <SessionStatusChip session={session} />
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"
                    className="group-open:rotate-180 transition-transform"
                    style={{ color: 'var(--color-paper-mute)' }}>
                    <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </summary>

              {/* Expanded session detail */}
              <div className="grid grid-cols-12 gap-3 md:gap-6 py-6">
                <div className="col-span-12 md:col-start-2 md:col-span-11 space-y-7">
                  <div>
                    <p className="eyebrow mb-3" style={{ color: 'var(--color-paper-mute)' }}>Original</p>
                    <p
                      className="text-base md:text-lg leading-[1.6] whitespace-pre-wrap"
                      style={{ color: 'var(--color-paper-mute)', fontFamily: 'var(--font-inter)' }}
                    >
                      {session.originalPrompt}
                    </p>
                  </div>

                  {session.exchanges.length > 0 && (
                    <div>
                      <p className="eyebrow mb-3" style={{ color: 'var(--color-accent)' }}>Clarifications</p>
                      <ul className="space-y-5">
                        {session.exchanges.map(e => (
                          <li key={e.turn} className="pl-5" style={{ borderLeft: '1px solid var(--color-rule-strong)' }}>
                            <p
                              className="text-base md:text-lg mb-1"
                              style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-inter)', fontWeight: 500 }}
                            >
                              {e.question}
                            </p>
                            {e.answer && (
                              <p className="text-sm md:text-base" style={{ color: 'var(--color-paper-mute)' }}>
                                {e.answer}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {session.improvement && (
                    <div>
                      <p className="eyebrow mb-3" style={{ color: 'var(--color-paper)' }}>Rewrite</p>
                      <p
                        className="text-base md:text-lg leading-[1.6] whitespace-pre-wrap mb-4"
                        style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-inter)' }}
                      >
                        {session.improvement.improvedPrompt}
                      </p>
                      <p className="text-sm md:text-base leading-[1.6]" style={{ color: 'var(--color-paper-mute)' }}>
                        {session.improvement.explanation}
                      </p>
                      {session.improvement.improvementTags.length > 0 && (
                        <p className="mt-4 text-sm" style={{ color: 'var(--color-paper)' }}>
                          <span className="eyebrow mr-2">Added</span>
                          {session.improvement.improvementTags.map((t, i) => (
                            <span key={t}>
                              {i > 0 && <span style={{ color: 'var(--color-paper-mute)' }}>, </span>}
                              <span className="capitalize">{t}</span>
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="rule" />
            </details>
          ))}
        </section>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <a
              key={p}
              href={`?page=${p}`}
              className="w-9 h-9 flex items-center justify-center rounded-full text-sm transition-all"
              style={{
                background: p === page ? 'var(--color-paper)' : 'transparent',
                color: p === page ? 'var(--color-ink)' : 'var(--color-paper-mute)',
                fontWeight: p === page ? 500 : 400,
              }}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
