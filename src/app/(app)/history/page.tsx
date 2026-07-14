import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserSessions } from '@/lib/db/sessions'
import { HISTORY_FREE_DAYS, windowStart } from '@/lib/limits'

/**
 * History: what you wrote, what it became.
 *
 * The old version was a score dashboard - average before, average after,
 * average lift, a trend sparkline. Two problems. The numbers were about the
 * tool, not the user, and they are about to be mostly null: extension
 * sessions do not carry scores (the fast path does not score, which is what
 * keeps it under a second).
 *
 * The learning is in the diff. Seeing "gym workout plan" become a real brief,
 * side by side, teaches more than "+38 clarity" ever did.
 */
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

  const { sessions, total } = await getUserSessions(user.id, limit, offset, since)
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-12">
      <header className="grid md:grid-cols-12 gap-6 md:gap-12 items-end">
        <div className="md:col-span-9">
          <p className="eyebrow mb-4">History</p>
          <h1 className="display text-4xl md:text-6xl" style={{ color: 'var(--color-paper)' }}>
            {total === 0 ? (
              <>Nothing yet.</>
            ) : (
              <>
                What you wrote,{' '}
                <span style={{ color: 'var(--color-paper-mute)' }}>and what it became.</span>
              </>
            )}
          </h1>
          {total > 0 && (
            <p
              className="mt-5 text-base md:text-lg leading-[1.55] max-w-xl"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              {total} prompt{total !== 1 ? 's' : ''}. The gap between the two columns is the
              part worth learning.
            </p>
          )}
        </div>
        <div className="md:col-span-3 flex md:justify-end">
          <Link
            href="/extension"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
            style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
          >
            Open the extension
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </header>

      {!isPro && total > 0 && (
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3"
          style={{
            borderTop: '1px solid var(--color-rule-strong)',
            borderBottom: '1px solid var(--color-rule-strong)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
            Showing your last {HISTORY_FREE_DAYS} days. Pro keeps everything.
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

      {sessions.length === 0 && (
        <section className="grid md:grid-cols-12 gap-6 md:gap-12 py-8">
          <div className="md:col-span-4">
            <p className="eyebrow">Empty</p>
          </div>
          <div className="md:col-span-8">
            <p
              className="font-serif text-2xl md:text-3xl leading-tight tracking-tight mb-6"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              Improve a prompt in ChatGPT, Claude, or Gemini and it will show up here.
            </p>
            <Link
              href="/extension"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
              style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
            >
              Get the extension
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* The diff. Your words on the left, what they became on the right. */}
      <div>
        {sessions.map(s => {
          const asked = s.exchanges.find(e => e.answer)
          return (
            <article key={s.id} style={{ borderTop: '1px solid var(--color-rule-strong)' }}>
              <div className="py-7 grid md:grid-cols-12 gap-y-5 gap-x-8">
                <div className="md:col-span-2">
                  <p className="eyebrow">{formatDate(s.createdAt)}</p>
                  {asked && (
                    <p className="text-xs mt-2" style={{ color: 'var(--color-accent)' }}>
                      Asked first
                    </p>
                  )}
                </div>

                <div className="md:col-span-5">
                  <p className="eyebrow mb-2" style={{ color: 'var(--color-paper-mute)' }}>
                    You wrote
                  </p>
                  <p
                    className="font-serif text-base md:text-lg leading-normal"
                    style={{ color: 'var(--color-paper-mute)' }}
                  >
                    {s.originalPrompt}
                  </p>
                  {asked && (
                    <p className="text-xs mt-3" style={{ color: 'var(--color-paper-mute)' }}>
                      You chose:{' '}
                      <span style={{ color: 'var(--color-paper)' }}>{asked.answer}</span>
                    </p>
                  )}
                </div>

                <div className="md:col-span-5">
                  <p className="eyebrow mb-2">It became</p>
                  <p
                    className="text-base leading-[1.55] whitespace-pre-wrap"
                    style={{ color: 'var(--color-paper)' }}
                  >
                    {s.finalPrompt ?? '—'}
                  </p>
                </div>
              </div>
            </article>
          )
        })}
        {sessions.length > 0 && <div style={{ borderTop: '1px solid var(--color-rule-strong)' }} />}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <Link
              href={`/history?page=${page - 1}`}
              className="text-sm underline-offset-4 hover:underline"
              style={{ color: 'var(--color-paper)' }}
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/history?page=${page + 1}`}
              className="text-sm underline-offset-4 hover:underline"
              style={{ color: 'var(--color-paper)' }}
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
