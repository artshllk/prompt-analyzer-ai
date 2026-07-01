import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserSessions } from '@/lib/db/sessions'
import { getUsageInfo } from '@/lib/db/usage'
import { UpgradeButton } from '@/components/ui/UpgradeButton'
import { Reveal } from '@/components/ui/Reveal'
import { CountUp } from '@/components/ui/CountUp'
import { statusOf } from '@/lib/session-status'
import { REWRITE_WINDOW_HOURS } from '@/lib/limits'
import type { SessionWithDetails, UsageInfo } from '@/types'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const [{ data: profile }, { sessions, total }, usage] = await Promise.all([
    supabase.from('profiles').select('full_name, tier').eq('id', user.id).single(),
    getUserSessions(user.id, 12, 0),
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

  // The most recent session that actually produced a rewrite.
  const latest = sessions.find(s => s.improvement) ?? null

  // Sessions with an unanswered question that are still recent enough to
  // resume - the honest, actionable "needs-answer" state.
  const needsAnswer = sessions.filter(s => statusOf(s) === 'needs-answer')

  const tagCounts = new Map<string, number>()
  for (const s of sessions) {
    for (const t of s.improvement?.improvementTags ?? []) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t)

  const isNew = total === 0
  const isPro = profile?.tier === 'pro'

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-12 md:space-y-14">
      {/* Heading */}
      <Reveal>
        <header className="grid md:grid-cols-12 gap-6 md:gap-12 items-end">
          <div className="md:col-span-9">
            <p className="eyebrow mb-4">
              {params.upgraded ? 'Pro is on' : 'Dashboard'}
            </p>
            <h1 className="display text-4xl md:text-6xl" style={{ color: 'var(--color-paper)' }}>
              {params.upgraded ? (
                <>Welcome to Pro.</>
              ) : firstName ? (
                <>Hello, <span style={{ color: 'var(--color-paper-mute)' }}>{firstName}.</span></>
              ) : (
                <>Hello.</>
              )}
            </h1>
          </div>
          <div className="md:col-span-3 flex md:justify-end">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
              style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
            >
              New analysis
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </header>
      </Reveal>

      {isNew ? (
        <Reveal delay={0.06}>
          <EmptyState />
        </Reveal>
      ) : (
        <>
          {/* Metric cards - premium, animated, tier-aware. */}
          <Reveal delay={0.06}>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              <UsageCard usage={usage} isPro={isPro} />
              <MetricCard
                label="Average clarity"
                value={avgScoreAfter ?? 0}
                empty={avgScoreAfter === null}
                sub="after rewriting"
              />
              <MetricCard
                label="Average lift"
                value={avgLift ?? 0}
                empty={avgLift === null}
                prefix="+"
                accent
                sub="points per prompt"
              />
              <MetricCard label="Sessions" value={total} sub="all time" />
            </section>
          </Reveal>

          {/* Needs-your-answer nudge - only when there's something to resume. */}
          {needsAnswer.length > 0 && (
            <Reveal delay={0.1}>
              <NeedsAnswer sessions={needsAnswer} />
            </Reveal>
          )}

          {/* Latest improvement spotlight. */}
          <Reveal delay={0.14}>
            <section>
              <div className="flex items-baseline justify-between mb-5">
                <p className="eyebrow">Latest improvement</p>
                <Link
                  href="/history"
                  className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-100 opacity-70"
                  style={{ color: 'var(--color-paper-mute)' }}
                >
                  View full history
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>

              {latest && latest.improvement ? (
                <SpotlightCard session={latest} />
              ) : (
                <Link
                  href="/playground"
                  className="block rounded-2xl p-6 md:p-7 row-hover transition-colors"
                  style={{ border: '1px solid var(--color-rule-strong)', background: 'var(--color-ink-card)' }}
                >
                  <p className="text-base" style={{ color: 'var(--color-paper)' }}>
                    No rewrites yet.
                  </p>
                  <p className="text-sm mt-1.5" style={{ color: 'var(--color-paper-mute)' }}>
                    Improve a prompt to see your first before → after here &rarr;
                  </p>
                </Link>
              )}

              {topTags.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="eyebrow" style={{ color: 'var(--color-paper-mute)' }}>
                    You most often add
                  </span>
                  {topTags.map(t => (
                    <span
                      key={t}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs capitalize"
                      style={{
                        background: 'var(--color-ink-card-elevated)',
                        border: '1px solid var(--color-rule-strong)',
                        color: 'var(--color-paper)',
                      }}
                    >
                      {t.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </Reveal>

          {/* Pro upsell. */}
          {!isPro && (
            <Reveal delay={0.2}>
              <section
                className="rounded-2xl p-7 md:p-9 grid md:grid-cols-12 gap-6 md:gap-10 items-center"
                style={{ border: '1px solid var(--color-rule-strong)', background: 'var(--color-ink-card)' }}
              >
                <div className="md:col-span-8">
                  <p className="eyebrow mb-4" style={{ color: 'var(--color-accent)' }}>Pro</p>
                  <h2 className="display text-3xl md:text-4xl mb-4" style={{ color: 'var(--color-paper)' }}>
                    See your patterns over weeks, <span style={{ color: 'var(--color-paper-mute)' }}>not days.</span>
                  </h2>
                  <p className="text-base leading-[1.6] max-w-xl" style={{ color: 'var(--color-paper-mute)' }}>
                    Unlimited rewrites, full history, and a weekly report on the fixes you reach for most.
                  </p>
                </div>
                <div className="md:col-span-4 md:flex md:items-center md:justify-end">
                  <UpgradeButton
                    plan="pro_monthly"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper cursor-pointer"
                  >
                    <span>Upgrade — <span className="line-through opacity-60">$9.99</span> $4.99/mo</span>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </UpgradeButton>
                </div>
              </section>
            </Reveal>
          )}
        </>
      )}
    </div>
  )
}

/* ===== Metric cards ===== */

function MetricCard({
  label,
  value,
  sub,
  prefix = '',
  accent,
  empty,
}: {
  label: string
  value: number
  sub: string
  prefix?: string
  accent?: boolean
  empty?: boolean
}) {
  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
      <p className="text-xs mb-3" style={{ color: 'var(--color-paper-mute)' }}>{label}</p>
      <p
        className="font-serif text-4xl md:text-5xl leading-none"
        style={{ color: accent ? 'var(--color-accent-bright)' : 'var(--color-paper)', fontWeight: 400 }}
      >
        {empty ? '—' : <CountUp value={value} prefix={prefix} />}
      </p>
      <p className="text-xs mt-2" style={{ color: 'var(--color-paper-mute)' }}>{sub}</p>
    </div>
  )
}

/** Tier-aware usage card. Pro: "Unlimited", no window (the 48h limit does
 *  not apply to Pro). Free: used-of-limit with a meter and the reset
 *  window spelled out. */
function UsageCard({ usage, isPro }: { usage: UsageInfo; isPro: boolean }) {
  if (isPro || usage.limit === null) {
    return (
      <div className="rounded-2xl p-5 md:p-6" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
        <p className="text-xs mb-3" style={{ color: 'var(--color-paper-mute)' }}>Rewrites</p>
        <p className="font-serif text-3xl md:text-4xl leading-none" style={{ color: 'var(--color-accent-bright)', fontWeight: 400 }}>
          Unlimited
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-paper-mute)' }}>Pro plan</p>
      </div>
    )
  }

  const limit = usage.limit
  const pct = Math.min((usage.used / limit) * 100, 100)
  const atLimit = usage.used >= limit
  const left = Math.max(0, limit - usage.used)

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
      <p className="text-xs mb-3" style={{ color: 'var(--color-paper-mute)' }}>Rewrites left</p>
      <p
        className="font-serif text-4xl md:text-5xl leading-none"
        style={{ color: atLimit ? '#C25E5E' : 'var(--color-paper)', fontWeight: 400 }}
      >
        <CountUp value={left} />
      </p>
      <div className="mt-3">
        <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'var(--color-rule-strong)' }}>
          <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: atLimit ? '#C25E5E' : 'var(--color-paper)' }} />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--color-paper-mute)' }}>
          of {limit} · resets within {REWRITE_WINDOW_HOURS}h
        </p>
      </div>
    </div>
  )
}

/* ===== Needs-your-answer nudge ===== */

function NeedsAnswer({ sessions }: { sessions: SessionWithDetails[] }) {
  const n = sessions.length
  return (
    <section
      className="rounded-2xl p-5 md:p-6"
      style={{
        background: 'rgba(224,178,60,0.06)',
        border: '1px solid rgba(224,178,60,0.28)',
        borderLeft: '3px solid #E0B23C',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-1.5" style={{ color: '#E0B23C' }}>Waiting on you</p>
          <p className="text-base" style={{ color: 'var(--color-paper)' }}>
            {n === 1
              ? 'One prompt is waiting for your answer to finish improving.'
              : `${n} prompts are waiting for your answer to finish improving.`}
          </p>
        </div>
        <Link
          href="/history"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all hover:gap-3 btn-outline shrink-0"
          style={{ border: '1px solid var(--color-rule-strong)', color: 'var(--color-paper)' }}
        >
          Resume
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  )
}

/* ===== Spotlight ===== */

function scoreColor(score: number): string {
  if (score < 30) return '#C25E5E'
  if (score < 60) return 'var(--color-paper-mute)'
  return 'var(--color-paper)'
}

function ClarityBadge({ score, accent }: { score: number | null; accent?: boolean }) {
  if (score == null) return null
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs tabular-nums px-2.5 py-1 rounded-full shrink-0"
      style={{ border: '1px solid var(--color-rule-strong)', color: accent ? 'var(--color-accent)' : scoreColor(score) }}
    >
      <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-paper-mute)' }}>clarity</span>
      {score}
    </span>
  )
}

function SpotlightCard({ session }: { session: SessionWithDetails }) {
  const before = session.clarityScoreBefore
  const after = session.clarityScoreAfter
  const lift = before != null && after != null ? after - before : null
  const improved = session.improvement!.improvedPrompt
  const date = new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <Link
      href="/history"
      className="group block rounded-2xl overflow-hidden transition-colors"
      style={{ border: '1px solid var(--color-rule-strong)', background: 'var(--color-ink-card)' }}
    >
      <div className="grid md:grid-cols-2">
        <div className="p-6 md:p-7 md:border-r" style={{ borderColor: 'var(--color-rule)' }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="eyebrow" style={{ color: 'var(--color-paper-mute)' }}>Your prompt</p>
            <ClarityBadge score={before} />
          </div>
          <p className="text-sm md:text-[15px] leading-[1.6] line-clamp-5" style={{ color: 'var(--color-paper-mute)' }}>
            {session.originalPrompt}
          </p>
        </div>
        <div className="p-6 md:p-7 border-t md:border-t-0" style={{ borderColor: 'var(--color-rule)' }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="eyebrow" style={{ color: 'var(--color-accent)' }}>Rewrite</p>
            <ClarityBadge score={after} accent />
          </div>
          <p className="font-serif text-sm md:text-[15px] leading-[1.6] line-clamp-5" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            {improved}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-6 md:px-7 py-3.5" style={{ borderTop: '1px solid var(--color-rule)' }}>
        <div className="flex items-center gap-2 text-sm tabular-nums">
          {before != null && after != null && (
            <>
              <span style={{ color: scoreColor(before) }}>{before}</span>
              <span style={{ color: 'var(--color-paper-mute)' }}>→</span>
              <span style={{ color: scoreColor(after) }}>{after}</span>
              {lift != null && lift > 0 && <span className="ml-1" style={{ color: '#5FBE8C' }}>+{lift} clarity</span>}
            </>
          )}
        </div>
        <span className="text-xs inline-flex items-center gap-2" style={{ color: 'var(--color-paper-mute)' }}>
          <span className="capitalize">{session.tone}</span>
          <span>·</span>
          <span>{date}</span>
        </span>
      </div>
    </Link>
  )
}

/* ===== Empty state ===== */

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
        <p className="font-serif text-2xl md:text-[2rem] leading-tight tracking-tight" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
          Paste a rough prompt. Watch it get sharper.
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
          style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
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
