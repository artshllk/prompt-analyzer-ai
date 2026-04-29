import { createClient } from '@/lib/supabase/server'
import { PlaygroundClient } from '@/components/playground/PlaygroundClient'

export default async function PlaygroundPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <PlaygroundClient isSignedIn={!!user} />
}
