import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateToken, extractBearerToken, type ValidatedToken } from '@/lib/db/api-tokens'

/**
 * Who is calling a public API route.
 *
 * THE BUG THIS FIXES
 *
 * These routes identified a caller by `Authorization: Bearer dc_...` and
 * nothing else. Only the extension has one of those. The website
 * authenticates with a Supabase cookie, so a signed-in visitor using the tool
 * on deepclario.com was ANONYMOUS to every one of these routes while looking
 * at a page that said they were signed in.
 *
 * THREE STATES, NOT TWO
 *
 * This returned `Caller | null`, so "not signed in" and "signed in but we
 * could not read their plan" were the same answer. The tier read did
 * `?? 'free'`, so a failed query became a genuine free account, and the free
 * quota fails open on a database error. Put together: during a Postgres
 * outage with Auth still up, every signed-in caller resolved as free and got
 * unlimited billed model calls, and anyone could still sign up to join them
 * because sign-up only needs Auth.
 *
 *   anonymous  no credential at all. Falls to the anonymous ceiling, which
 *              fails closed, so this is already safe.
 *   known      identity AND entitlement both confirmed.
 *   unknown    identity confirmed, entitlement unreadable. REFUSE. Somebody
 *              we cannot identify is not a free user, and guessing in their
 *              favour is how an outage turns into a bill.
 *
 * The obvious alternative, letting Pro through and refusing everyone else,
 * is not available: tier lives in Postgres on both paths, so during the exact
 * failure that matters there is no way to tell Pro from free. See the
 * "when we have paying customers" note in CLAUDE.md for the version that
 * would work, and why it is not worth building yet.
 */

export interface Caller {
  userId: string
  tier: 'free' | 'pro'
  /** Which credential identified them. Useful in logs, nothing else. */
  via: 'token' | 'session'
}

export type CallerResult =
  | { state: 'anonymous' }
  | { state: 'known'; caller: Caller }
  | { state: 'unknown' }

const ANONYMOUS: CallerResult = { state: 'anonymous' }
const UNKNOWN: CallerResult = { state: 'unknown' }

export async function resolveCaller(req: NextRequest): Promise<CallerResult> {
  const raw = extractBearerToken(req.headers.get('authorization'))
  if (raw) {
    const viaToken: ValidatedToken | null = await validateToken(raw)
    if (viaToken) {
      // Token resolved, entitlement did not. Refuse rather than assume free.
      if (viaToken.tier === null) {
        console.error('[caller] token valid but tier unreadable, refusing')
        return UNKNOWN
      }
      return { state: 'known', caller: { userId: viaToken.userId, tier: viaToken.tier, via: 'token' } }
    }
    // A token that does not resolve is not a signed-in user. It falls through
    // to the cookie check and then to anonymous, which fails closed.
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // No session is genuinely anonymous, not unknown. Anonymous is already
    // handled by a ceiling that fails closed, so nothing is at risk here.
    if (!user) return ANONYMOUS

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[caller] session valid but tier unreadable, refusing:', error.message)
      return UNKNOWN
    }

    return {
      state: 'known',
      caller: { userId: user.id, tier: (profile?.tier ?? 'free') as 'free' | 'pro', via: 'session' },
    }
  } catch (err) {
    // Could not even establish identity. That is indistinguishable from not
    // being signed in, and the anonymous path fails closed, so treat it as
    // anonymous rather than refusing someone who never had a session.
    console.error('[caller] session lookup failed, treating as anonymous:', (err as Error).message)
    return ANONYMOUS
  }
}
