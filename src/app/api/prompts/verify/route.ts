import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPrompts } from '@/lib/engine/verify'
import { getVerifyAllowance, recordVerifyUsage } from '@/lib/db/usage'
import { take, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'

interface VerifyBody {
  original: string
  improved: string
  /** Optional target model; validated against VERIFY_TARGETS in the engine. */
  targetModel?: string
}

/**
 * Verification runs: execute the original and improved prompts against a
 * real model and return both outputs plus a one-line contrast. The proof
 * step - and the most expensive call in the product - so it's metered:
 * Pro gets PRO_VERIFY_LIMIT per rolling 30 days, free users get
 * FREE_VERIFY_LIFETIME_CREDITS lifetime.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()
  const tier = profile?.tier ?? 'free'

  const burst = take(`user:${user.id}`, tier === 'pro' ? PRO_USER_LIMIT : USER_LIMIT)
  if (!burst.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterMs: burst.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(burst.retryAfterMs / 1000)) } }
    )
  }

  const allowance = await getVerifyAllowance(user.id, tier)
  if (allowance.isAtLimit) {
    return NextResponse.json(
      { error: 'verify_limit', used: allowance.used, limit: allowance.limit, tier },
      { status: 402 }
    )
  }

  let body: VerifyBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { original, improved, targetModel } = body
  if (!original?.trim() || !improved?.trim()) {
    return NextResponse.json({ error: 'prompts_required' }, { status: 400 })
  }
  if (original.length > 4000 || improved.length > 6000) {
    return NextResponse.json({ error: 'prompt_too_long' }, { status: 400 })
  }

  const result = await verifyPrompts({ original, improved, targetModel })
  if (!result) {
    return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 })
  }

  await recordVerifyUsage(user.id)

  return NextResponse.json({
    ...result,
    remaining: Math.max(0, allowance.limit - allowance.used - 1),
    limit: allowance.limit,
  })
}
