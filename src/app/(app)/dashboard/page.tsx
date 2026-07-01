import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserSessions } from '@/lib/db/sessions'
import { getUsageInfo } from '@/lib/db/usage'
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
    supabase.from('profiles').select('full_name, tier').eq('id', user.id).single(),
    getUserSessions(user.id, 5, 0),
    getUsageInfo(user.id),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? null

  const completed = sessions.filter(s => s.clarityScoreAfter && s.clarityScoreBefore)
  const avgScoreAfter = completed.length
    ? Math.round(completed.reduce((acc, s) => acc + s.clarityScoreAfter!, 0) / completed.length)
    : null
  const avgLift = completed.length
    ? Math.round(completed.reduce((acc, s) => acc + (s.clarityScoreAfter! - s.clarityScoreBefore!), 0) / completed.length)
    : null

  const isNew = sessions.length === 0
  const isPro = profile?.tier === 'pro'

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-16">
      {/* Heading row */}
      <header className="grid md:grid-cols-12 gap-6 md:gap-12 items-end">
        <div className="md:col-span-9">
          <p className="eyebrow mb-4">
            {params.upgraded ? 'Pro is on' : 'Dashboard'}
          </p>
          <h1
            className="display text-4xl md:text-6xl"
            style={{ color: 'var(--color-paper)' }}
          >
            {params.upgraded ? (
              <>Welcome to Pro.</>
            ) : firstName ? (
              <>Hello, <span style={{ color: 'var(--color-paper-mute)' }}>{firstName}.</span></>
            ) : (
              <>Hello.</>
            )}
          </h1>
          <p className="mt-5 text-base md:text-lg leading-[1.55] max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
            {params.upgraded
              ? 'Unlimited analyses, full history, and weekly insights are now available.'
              : isNew
              ? 'Paste your first prompt and see how it scores. The number is rarely flattering. The improvement always is.'
              : 'Pick up where you left off, or run something new.'}
          </p>
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

      {/* Stats - single horizontal data row, hairline above and below */}
      {!isNew && (
        <section>
          <div className="rule-strong" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 py-8">
            <Stat label="Used this month" value={String(usage.used)} sub={usage.limit ? `of ${usage.limit}` : 'of unlimited'} />
            <Stat label="Average clarity" value={avgScoreAfter ? String(avgScoreAfter) : '-'} sub="after rewriting" />
            <Stat label="Average lift" value={avgLift ? `+${avgLift}` : '-'} sub="points per prompt" accent={avgLift !== null && avgLift > 0} />
            <Stat label="Sessions" value={String(sessions.length)} sub="all time" />
          </div>
          <div className="rule-strong" />
        </section>
      )}

      {/* Empty state - editorial prose, no emojis, no decoration */}
      {isNew && <EmptyState />}

      {/* Recent sessions */}
      {!isNew && (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <p className="eyebrow">Recent sessions</p>
            <Link
              href="/history"
              className="text-sm transition-opacity hover:opacity-100"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              View all &rarr;
            </Link>
          </div>
          <div className="space-y-px">
            <div className="rule-strong" />
            {sessions.map(s => {
              const score = s.clarityScoreAfter ?? s.clarityScoreBefore ?? 0
              return (
                <div key={s.id}>
                  <div className="grid grid-cols-12 gap-3 md:gap-6 py-5 items-center">
                    <div className="col-span-2 md:col-span-1">
                      <ScoreInline score={score} />
                    </div>
                    <div className="col-span-10 md:col-span-7 min-w-0">
                      <p
                        className="text-sm md:text-base truncate"
                        style={{ color: 'var(--color-paper)' }}
                      >
                        {s.originalPrompt.length > 120 ? s.originalPrompt.slice(0, 120) + '…' : s.originalPrompt}
                      </p>
                      <p className="text-xs mt-1.5" style={{ color: 'var(--color-paper-mute)' }}>
                        <span className="capitalize">{s.tone}</span>
                        {s.clarifyTurns > 0 && <> &middot; {s.clarifyTurns} clarification{s.clarifyTurns !== 1 ? 's' : ''}</>}
                      </p>
                    </div>
                    <div className="col-span-7 md:col-span-2 text-xs md:text-right" style={{ color: 'var(--color-paper-mute)' }}>
                      {new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="col-span-5 md:col-span-2 text-right">
                      {s.clarityScoreBefore && s.clarityScoreAfter ? (
                        <span className="text-xs md:text-sm tabular-nums" style={{ color: 'var(--color-paper-mute)' }}>
                          {s.clarityScoreBefore} <span style={{ color: 'var(--color-paper-mute)' }}>&rarr;</span>{' '}
                          <span style={{ color: 'var(--color-paper)' }}>{s.clarityScoreAfter}</span>
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>in progress</span>
                      )}
                    </div>
                  </div>
                  <div className="rule" />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Browser extension - quiet entry point so signed-in users can find
          the connection-code page without typing the URL. */}
      <section className="grid md:grid-cols-12 gap-6 md:gap-12 pt-8" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <div className="md:col-span-7">
          <p className="eyebrow mb-4">Browser extension</p>
          <h2 className="display text-2xl md:text-3xl mb-3" style={{ color: 'var(--color-paper)' }}>
            Improve prompts <span style={{ color: 'var(--color-paper-mute)' }}>inside ChatGPT, Claude, Gemini.</span>
          </h2>
          <p className="text-base leading-[1.6] max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
            Connect the extension so it uses your {isPro ? 'unlimited' : '25 / month'} allowance instead of the public free quota.
          </p>
        </div>
        <div className="md:col-span-5 md:flex md:items-end md:justify-end gap-3 flex-wrap">
          <Link
            href="/extension/connect"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
            style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
          >
            Get connection code
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Pro upsell - editorial, no gradient, no glow */}
      {!isPro && !isNew && (
        <section className="grid md:grid-cols-12 gap-6 md:gap-12 pt-8" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="md:col-span-7">
            <p className="eyebrow mb-4" style={{ color: 'var(--color-accent)' }}>Pro</p>
            <h2 className="display text-3xl md:text-4xl mb-4" style={{ color: 'var(--color-paper)' }}>
              See your patterns over weeks, <span style={{ color: 'var(--color-paper-mute)' }}>not days.</span>
            </h2>
            <p className="text-base leading-[1.6] max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
              Unlimited analyses, full history, and a weekly report on the categories of fixes you reach for most often. The way to actually get better at this.
            </p>
          </div>
          <div className="md:col-span-5 md:flex md:items-end md:justify-end">
            <UpgradeButton
              plan="pro_monthly"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper cursor-pointer"
            >
              <span>Upgrade - <span className="line-through opacity-60">$9.99</span> $4.99/mo</span>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </UpgradeButton>
          </div>
        </section>
      )}
    </div>
  )
}

/* ===== Sub-components ===== */

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div>
      <p className="eyebrow mb-3">{label}</p>
      <p
        className="font-serif text-3xl md:text-4xl tabular-nums"
        style={{
          color: accent ? 'var(--color-accent)' : 'var(--color-paper)',
          fontWeight: 400,
        }}
      >
        {value}
      </p>
      <p className="text-xs mt-1.5" style={{ color: 'var(--color-paper-mute)' }}>{sub}</p>
    </div>
  )
}

function ScoreInline({ score }: { score: number }) {
  const color = score < 30 ? '#C25E5E' : score < 60 ? 'var(--color-paper-mute)' : 'var(--color-paper)'
  return (
    <span className="font-serif text-2xl tabular-nums" style={{ color, fontWeight: 400 }}>
      {score}
    </span>
  )
}

const SAMPLES = [
  'Write a landing page hero for my SaaS',
  'Help me refactor this auth code',
  'Summarize this research paper for a non-technical reader',
]

function EmptyState() {
  return (
    <section className="grid md:grid-cols-12 gap-6 md:gap-12">
      <div className="md:col-span-4">
        <p className="eyebrow mb-4">Start here</p>
      </div>
      <div className="md:col-span-8 space-y-8">
        <p
          className="font-serif text-2xl md:text-[2rem] leading-tight tracking-tight"
          style={{ color: 'var(--color-paper)', fontWeight: 400 }}
        >
          The fastest way to write a better prompt is to read your last one and notice what is missing.
        </p>
        <p className="text-base md:text-lg leading-[1.6]" style={{ color: 'var(--color-paper-mute)' }}>
          Paste anything - a rough idea, a one-liner, a request you have not finished writing. Deepclario reads it, asks the questions a careful teammate would ask, and rewrites until the model has no excuse to misunderstand.
        </p>

        <div>
          <p className="eyebrow mb-3">Try one of these</p>
          <ul className="space-y-px">
            <li className="rule-strong" />
            {SAMPLES.map(s => (
              <li key={s}>
                <Link
                  href={`/playground?example=${encodeURIComponent(s)}`}
                  className="block px-4 -mx-4 py-4 text-base md:text-lg row-hover rounded-md"
                  style={{ color: 'var(--color-paper)' }}
                >
                  &ldquo;{s}&rdquo;
                </Link>
                <div className="rule" />
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/playground"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
          style={{
            background: 'var(--color-paper)',
            color: 'var(--color-ink)',
            fontWeight: 500,
          }}
        >
          Use my own prompt
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
