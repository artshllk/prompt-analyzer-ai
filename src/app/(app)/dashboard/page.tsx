import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserSessions } from '@/lib/db/sessions'
import { getUsageInfo } from '@/lib/db/usage'
import { UpgradeButton } from '@/components/ui/UpgradeButton'
import { Reveal } from '@/components/ui/Reveal'
import type { SessionWithDetails } from '@/types'

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

  // The most recent session that actually produced a rewrite - the star
  // of the spotlight below.
  const latest = sessions.find(s => s.improvement) ?? null

  // "What you most often add" - aggregate the improvement tags across
  // recent sessions into a top-3, a genuine insight the history list
  // doesn't surface.
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
      {/* Heading row */}
      <Reveal>
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
      </Reveal>

      {/* Stats - single horizontal data row, hairline above and below */}
      {!isNew && (
        <Reveal delay={0.06}>
          <section>
            <div className="rule-strong" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 py-8">
              <UsageStat usage={usage} />
              <Stat label="Average clarity" value={avgScoreAfter ? String(avgScoreAfter) : '—'} sub="after rewriting" />
              <Stat label="Average lift" value={avgLift ? `+${avgLift}` : '—'} sub="points per prompt" accent={avgLift !== null && avgLift > 0} />
              <Stat label="Sessions" value={String(total)} sub="all time" />
            </div>
            <div className="rule-strong" />
          </section>
        </Reveal>
      )}

      {/* Empty state - editorial prose, no emojis, no decoration */}
      {isNew && (
        <Reveal delay={0.06}>
          <EmptyState />
        </Reveal>
      )}

      {/* Latest improvement - a spotlight on the actual before → after
          transformation, not a re-run of the history list. */}
      {!isNew && (
        <Reveal delay={0.12}>
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
                href="/history"
                className="block rounded-2xl p-6 md:p-7 row-hover transition-colors"
                style={{ border: '1px solid var(--color-rule-strong)', background: 'var(--color-ink-card)' }}
              >
                <p className="text-base" style={{ color: 'var(--color-paper)' }}>
                  Your recent sessions are still in progress.
                </p>
                <p className="text-sm mt-1.5" style={{ color: 'var(--color-paper-mute)' }}>
                  Open history to review them &rarr;
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
      )}

      {/* Pro upsell - editorial card, no gradient, no glow */}
      {!isPro && !isNew && (
        <Reveal delay={0.18}>
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
                Unlimited analyses, full history, and a weekly report on the categories of fixes you reach for most often. The way to actually get better at this.
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

/** Rewrite usage stat with a hairline meter for free tier, "Unlimited"
 *  for pro. */
function UsageStat({ usage }: { usage: { used: number; limit: number | null } }) {
  const pct = usage.limit ? Math.min((usage.used / usage.limit) * 100, 100) : 0
  const atLimit = usage.limit !== null && usage.used >= usage.limit

  return (
    <div>
      <p className="eyebrow mb-3">Rewrites · 48h</p>
      <p
        className="font-serif text-3xl md:text-4xl tabular-nums"
        style={{ color: atLimit ? '#C25E5E' : 'var(--color-paper)', fontWeight: 400 }}
      >
        {usage.used}
      </p>
      {usage.limit !== null ? (
        <div className="mt-2 max-w-28">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>of {usage.limit}</span>
          </div>
          <div className="h-px w-full" style={{ background: 'var(--color-rule-strong)' }}>
            <div
              className="h-px transition-all"
              style={{ width: `${pct}%`, background: atLimit ? '#C25E5E' : 'var(--color-paper)' }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs mt-1.5" style={{ color: 'var(--color-accent)' }}>Unlimited · Pro</p>
      )}
    </div>
  )
}

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
      style={{
        border: '1px solid var(--color-rule-strong)',
        color: accent ? 'var(--color-accent)' : scoreColor(score),
      }}
    >
      <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-paper-mute)' }}>
        clarity
      </span>
      {score}
    </span>
  )
}

/** Before → after spotlight for the most recent rewrite. The whole card
 *  links into history, where the full detail (clarifications, explanation)
 *  lives. */
function SpotlightCard({ session }: { session: SessionWithDetails }) {
  const before = session.clarityScoreBefore
  const after = session.clarityScoreAfter
  const lift = before != null && after != null ? after - before : null
  const improved = session.improvement!.improvedPrompt
  const date = new Date(session.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link
      href="/history"
      className="group block rounded-2xl overflow-hidden transition-colors"
      style={{ border: '1px solid var(--color-rule-strong)', background: 'var(--color-ink-card)' }}
    >
      {/* Original → Rewrite, side by side on desktop */}
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
          <p
            className="font-serif text-sm md:text-[15px] leading-[1.6] line-clamp-5"
            style={{ color: 'var(--color-paper)', fontWeight: 400 }}
          >
            {improved}
          </p>
        </div>
      </div>

      {/* Footer strip: lift + meta */}
      <div
        className="flex items-center justify-between gap-4 px-6 md:px-7 py-3.5"
        style={{ borderTop: '1px solid var(--color-rule)' }}
      >
        <div className="flex items-center gap-2 text-sm tabular-nums">
          {before != null && after != null ? (
            <>
              <span style={{ color: scoreColor(before) }}>{before}</span>
              <span style={{ color: 'var(--color-paper-mute)' }}>→</span>
              <span style={{ color: scoreColor(after) }}>{after}</span>
              {lift != null && lift > 0 && (
                <span className="ml-1" style={{ color: 'var(--color-accent)' }}>+{lift} clarity</span>
              )}
            </>
          ) : (
            <span style={{ color: 'var(--color-paper-mute)' }}>in progress</span>
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
