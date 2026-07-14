import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InsightsClient } from '@/components/insights/InsightsClient'

/**
 * Insights is free.
 *
 * It used to be a Pro gate: your own numbers, half of them blurred out, with
 * an upgrade button. That is a strange thing to do - charging someone to see
 * what they keep getting wrong makes the lesson feel like a hostage.
 *
 * It earns its keep as a retention hook instead. Someone who learns something
 * about their own habits here comes back. Pro sells on never waiting, which
 * is a benefit people actually feel.
 */
export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-12">
      <header>
        <p className="eyebrow mb-4">Insights</p>
        <h1 className="display text-4xl md:text-6xl" style={{ color: 'var(--color-paper)' }}>
          What you keep <span style={{ color: 'var(--color-paper-mute)' }}>leaving out.</span>
        </h1>
        <p
          className="mt-5 text-base md:text-lg leading-[1.55] max-w-2xl"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          An AI can fix your wording. It cannot guess your goal, your reader, or your
          deadline. These are the things you keep not saying.
        </p>
      </header>

      <InsightsClient />
    </div>
  )
}
