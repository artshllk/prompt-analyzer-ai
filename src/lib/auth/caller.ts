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
 * at a page that said they were signed in. That meant:
 *
 *   - they consumed the global anonymous budget, and were blocked by it
 *   - their free-plan quota was never checked, and never recorded
 *   - their sessions never reached History
 *
 * All three were invisible while the tool sat behind a modal. Putting it in
 * the hero, in front of a cap that blocks, is what made them matter.
 *
 * Bearer is tried first: it is the cheaper check, it needs no cookie parsing,
 * and it is what every extension request carries. The cookie session is the
 * fallback, and it is the only thing a browser can send.
 */

export interface Caller {
  userId: string
  tier: 'free' | 'pro'
  /** Which credential identified them. Useful in logs, nothing else. */
  via: 'token' | 'session'
}

export async function resolveCaller(req: NextRequest): Promise<Caller | null> {
  const raw = extractBearerToken(req.headers.get('authorization'))
  const viaToken: ValidatedToken | null = raw ? await validateToken(raw) : null
  if (viaToken) {
    return { userId: viaToken.userId, tier: viaToken.tier, via: 'token' }
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .maybeSingle()

    return { userId: user.id, tier: (profile?.tier ?? 'free') as 'free' | 'pro', via: 'session' }
  } catch (err) {
    // A cookie parse failure must not take down an endpoint that also serves
    // anonymous callers. Treat it as "not signed in" and carry on: the worst
    // outcome is that one request is throttled as anonymous.
    console.error('[caller] session lookup failed, treating as anonymous:', (err as Error).message)
    return null
  }
}
