import { createClient } from '@/lib/supabase/server'

/**
 * Who is looking at the pricing table, and when their subscription renews.
 *
 * The table has four states and used to know about none of them, which is why
 * "Get Pro" was dead for anyone signed in. Two pages render it, so this lives
 * in one place rather than being written twice and drifting.
 *
 * Falls back to `anon` on any error. That is the safe direction here: the worst
 * outcome is showing a sign-up button to someone already signed in, which is a
 * wrong link. Guessing `pro` would hide the way to buy from a paying customer,
 * and guessing `free` would offer checkout to someone already paying.
 */
export async function viewerPlan(): Promise<{
  plan: 'anon' | 'free' | 'pro'
  renewsOn: string | null
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { plan: 'anon', renewsOn: null }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, subscription_period_end')
      .eq('id', user.id)
      .single()

    return {
      plan: profile?.tier === 'pro' ? 'pro' : 'free',
      renewsOn: profile?.subscription_period_end ?? null,
    }
  } catch {
    return { plan: 'anon', renewsOn: null }
  }
}
