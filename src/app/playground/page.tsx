import { createClient } from '@/lib/supabase/server'
import { PlaygroundClient } from '@/components/playground/PlaygroundClient'
import { getUsageInfo } from '@/lib/db/usage'

export default async function PlaygroundPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isSignedIn = !!user
  const usage = isSignedIn && user ? await getUsageInfo(user.id) : undefined
  return <PlaygroundClient isSignedIn={isSignedIn} usage={usage} />
}
