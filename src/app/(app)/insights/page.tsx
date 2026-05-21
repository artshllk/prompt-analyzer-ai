import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InsightsClient } from '@/components/insights/InsightsClient'
import { UpgradeButton } from '@/components/ui/UpgradeButton'

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

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-12">
      {/* Heading */}
      <header>
        <p className="eyebrow mb-4">Insights</p>
        <h1 className="display text-4xl md:text-6xl" style={{ color: 'var(--color-paper)' }}>
          Patterns over weeks, <span style={{ color: 'var(--color-paper-mute)' }}>not days.</span>
        </h1>
        <p className="mt-5 text-base md:text-lg leading-[1.55] max-w-2xl" style={{ color: 'var(--color-paper-mute)' }}>
          The quiet trends in how you ask AI &mdash; the gaps you keep leaving, the dimensions that lift your scores fastest, the weeks you got measurably better.
        </p>
      </header>

      {isPro ? (
        <InsightsClient />
      ) : (
        <ProGate />
      )}
    </div>
  )
}

function ProGate() {
  return (
    <section className="py-10">
      <div className="rule-strong" />
      <div className="grid md:grid-cols-12 gap-6 md:gap-12 py-12">
        <div className="md:col-span-3">
          <p className="eyebrow" style={{ color: 'var(--color-accent)' }}>Pro</p>
        </div>
        <div className="md:col-span-9">
          <p
            className="font-serif text-2xl md:text-[2rem] leading-tight tracking-tight mb-6"
            style={{ color: 'var(--color-paper)', fontWeight: 400 }}
          >
            Insights are how you actually get better at this &mdash; the report shows what you keep forgetting and what you have started doing well.
          </p>
          <p className="text-base md:text-lg leading-[1.6] max-w-xl mb-8" style={{ color: 'var(--color-paper-mute)' }}>
            A weekly note covering your most common gaps, the dimensions where your scores lift the fastest, and how this week compares to last. Quiet, useful, no charts for the sake of charts.
          </p>
          <UpgradeButton
            plan="pro_monthly"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper cursor-pointer"
          >
            <span>Upgrade &mdash; $4.99/mo</span>
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
