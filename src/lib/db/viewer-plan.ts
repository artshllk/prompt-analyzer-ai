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
 *
 * IT LOGS WHEN IT FALLS BACK, because every outcome of that fallback is wrong
 * for somebody. `anon` is the least damaging guess, not a correct answer, and a
 * silent one would let a paying customer be shown a sign-up button for as long
 * as the failure lasted without anything anywhere saying so.
 *
 * The profile read is logged separately from the throw. They fail for different
 * reasons: a missing row means an account exists in Auth with nothing in
 * `profiles`, which is a data problem, while a throw is usually Postgres being
 * unreachable. Same fallback, different thing to go and fix.
 */
export async function viewerPlan(): Promise<{
  plan: 'anon' | 'free' | 'pro'
  renewsOn: string | null
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { plan: 'anon', renewsOn: null }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('tier, subscription_period_end')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      // Identity proven, entitlement unreadable. Same shape as the checker's
      // `unknown` caller state, and the same reason it is worth saying out
      // loud: we are about to guess at what somebody is paying for.
      console.error(
        `[viewer-plan] profile unreadable for a signed-in user, showing the ` +
          `signed-out table: ${error?.message ?? 'no row'}`
      )
      return { plan: 'anon', renewsOn: null }
    }

    return {
      plan: profile.tier === 'pro' ? 'pro' : 'free',
      renewsOn: profile.subscription_period_end ?? null,
    }
  } catch (err) {
    console.error('[viewer-plan] threw, showing the signed-out table:', err)
    return { plan: 'anon', renewsOn: null }
  }
}
