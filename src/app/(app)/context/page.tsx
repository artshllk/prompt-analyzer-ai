import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getIdentity, listMemories } from '@/lib/context/graph'
import { ContextIdentityCard } from '@/components/context/ContextIdentityCard'
import { MemoriesPanel } from '@/components/context/MemoriesPanel'

export const metadata = {
  title: 'Context — Deepclario',
}

export default async function ContextPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, identity, memories] = await Promise.all([
    supabase.from('profiles').select('tier').eq('id', user.id).single(),
    getIdentity(user.id),
    listMemories(user.id),
  ])
  const isPro = profile?.tier === 'pro'

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-10">
      <header>
        <p className="eyebrow mb-4">Context</p>
        <h1 className="display text-4xl md:text-5xl" style={{ color: 'var(--color-paper)' }}>
          What Deepclario knows{' '}
          <span style={{ color: 'var(--color-paper-mute)' }}>about you.</span>
        </h1>
        <p
          className="mt-5 text-base md:text-lg leading-[1.55] max-w-xl"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          Carried into every rewrite so you stop re-explaining yourself.
          Everything here is yours to edit, confirm, or remove.
        </p>
      </header>

      <ContextIdentityCard initial={identity} isPro={isPro} />

      <MemoriesPanel initial={memories} isPro={isPro} />
    </div>
  )
}
