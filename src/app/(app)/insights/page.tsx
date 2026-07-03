import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InsightsClient } from '@/components/insights/InsightsClient'
import { UpgradeButton } from '@/components/ui/UpgradeButton'
import { windowStart } from '@/lib/limits'

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

  // One live stat for the free-tier teaser: this week's sessions and the
  // average clarity lift. Seeing your own locked data beats a generic gate.
  let teaser: TeaserStat | null = null
  if (!isPro) {
    const weekAgo = windowStart(7 * 24)
    const { data: recent } = await supabase
      .from('prompt_sessions')
      .select('clarity_score_before, clarity_score_after')
      .eq('user_id', user.id)
      .gte('created_at', weekAgo)
    const scored = (recent ?? []).filter(
      s => s.clarity_score_before != null && s.clarity_score_after != null
    )
    const avgLift = scored.length
      ? Math.round(
          scored.reduce((a, s) => a + (s.clarity_score_after! - s.clarity_score_before!), 0) /
            scored.length
        )
      : 0
    teaser = { promptsThisWeek: recent?.length ?? 0, avgLift }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-12">
      {/* Heading */}
      <header>
        <p className="eyebrow mb-4">Insights</p>
        <h1 className="display text-4xl md:text-6xl" style={{ color: 'var(--color-paper)' }}>
          Patterns over weeks, <span style={{ color: 'var(--color-paper-mute)' }}>not days.</span>
        </h1>
        <p className="mt-5 text-base md:text-lg leading-[1.55] max-w-2xl" style={{ color: 'var(--color-paper-mute)' }}>
          The quiet trends in how you ask AI - the gaps you keep leaving, the dimensions that lift your scores fastest, the weeks you got measurably better.
        </p>
      </header>

      {isPro ? (
        <InsightsClient />
      ) : (
        <ProGate teaser={teaser} />
      )}
    </div>
  )
}

interface TeaserStat {
  promptsThisWeek: number
  avgLift: number
}

function ProGate({ teaser }: { teaser: TeaserStat | null }) {
  const hasData = !!teaser && teaser.promptsThisWeek > 0
  return (
    <section className="py-10">
      <div className="rule-strong" />

      {/* Live stat row: the user's own data, with the rest of the report
          blurred behind the gate. */}
      <div className="relative overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 py-8">
          <div>
            <p className="eyebrow mb-3">This week</p>
            <p className="font-serif text-3xl md:text-4xl tabular-nums" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
              {teaser?.promptsThisWeek ?? 0}
            </p>
            <p className="text-xs mt-1.5" style={{ color: 'var(--color-paper-mute)' }}>prompts improved</p>
          </div>
          <div>
            <p className="eyebrow mb-3">Average lift</p>
            <p className="font-serif text-3xl md:text-4xl tabular-nums" style={{ color: 'var(--color-accent)', fontWeight: 400 }}>
              {hasData ? `+${teaser.avgLift}` : '—'}
            </p>
            <p className="text-xs mt-1.5" style={{ color: 'var(--color-paper-mute)' }}>clarity per session</p>
          </div>
          {/* Blurred Pro-only columns - real report slots, locked. */}
          {['Vs last week', 'Your top gap'].map(label => (
            <div key={label} aria-hidden className="select-none" style={{ filter: 'blur(7px)', opacity: 0.7 }}>
              <p className="eyebrow mb-3">{label}</p>
              <p className="font-serif text-3xl md:text-4xl tabular-nums" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
                +12
              </p>
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-paper-mute)' }}>unlocked with Pro</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rule" />
      <div className="grid md:grid-cols-12 gap-6 md:gap-12 py-12">
        <div className="md:col-span-3">
          <p className="eyebrow" style={{ color: 'var(--color-accent)' }}>Pro</p>
        </div>
        <div className="md:col-span-9">
          <p
            className="font-serif text-2xl md:text-[2rem] leading-tight tracking-tight mb-6"
            style={{ color: 'var(--color-paper)', fontWeight: 400 }}
          >
            {hasData
              ? 'The rest of your report is already here - your most common gaps, week-over-week trends, and where your scores lift fastest.'
              : 'Insights are how you actually get better at this - the report shows what you keep forgetting and what you have started doing well.'}
          </p>
          <p className="text-base md:text-lg leading-[1.6] max-w-xl mb-8" style={{ color: 'var(--color-paper-mute)' }}>
            A weekly note covering your most common gaps, the dimensions where your scores lift the fastest, and how this week compares to last. Quiet, useful, no charts for the sake of charts.
          </p>
          <UpgradeButton
            plan="pro_monthly"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper cursor-pointer"
          >
            <span>Upgrade · <span className="line-through opacity-60">$9.99</span> $4.99/mo</span>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </UpgradeButton>
        </div>
      </div>
      <div className="rule-strong" />
    </section>
  )
}
