import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SkillProfileClient } from '@/components/skill-profile/SkillProfileClient'

export default async function SkillProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-12">
      <header>
        <p className="eyebrow mb-4">Skill Profile</p>
        <h1 className="display text-4xl md:text-6xl" style={{ color: 'var(--color-paper)' }}>
          You are getting <span style={{ color: 'var(--color-paper-mute)' }}>better at this.</span>
        </h1>
        <p className="mt-5 text-base md:text-lg leading-[1.55] max-w-2xl" style={{ color: 'var(--color-paper-mute)' }}>
          Every prompt you improve is a data point. Here is where your prompting fluency stands, and how your clarity has climbed over time.
        </p>
      </header>

      <SkillProfileClient />
    </div>
  )
}
