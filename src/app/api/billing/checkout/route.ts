import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  PADDLE_PLANS,
  SELLABLE_PLANS,
  paddleRequest,
  foundingSeatsLeft,
  type SellablePlan,
} from '@/lib/paddle'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { plan = 'pro_monthly' } = await req.json()

  /**
   * ONLY A SELLABLE PLAN, AND NEVER THE LEGACY ONE.
   *
   * The plan key arrives in a request body, so an unlisted price is one
   * `curl` away unless this refuses it here. The old $4.99 price still exists
   * so an existing subscription can keep billing against it, and it must
   * never be reachable by someone new.
   */
  if (!SELLABLE_PLANS.includes(plan as SellablePlan)) {
    return NextResponse.json({ error: 'unknown_plan' }, { status: 400 })
  }
  const selectedPlan = PADDLE_PLANS[plan as SellablePlan]

  /**
   * The founding price is capped, and the cap is enforced HERE because this
   * is the only way a subscription can come into existence. See
   * foundingSeatsLeft() for why Paddle is the source of truth and why the
   * count fails closed.
   */
  if (plan === 'pro_founding' && (await foundingSeatsLeft()) <= 0) {
    return NextResponse.json({ error: 'founding_sold_out' }, { status: 409 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('paddle_customer_id, email')
    .eq('id', user.id)
    .single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Build transaction payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {
    items: [{ price_id: selectedPlan.priceId, quantity: 1 }],
    custom_data: { supabase_user_id: user.id },
    checkout: {
      url: `${appUrl}/check?upgraded=true`,
    },
  }

  if (profile?.paddle_customer_id) {
    payload.customer_id = profile.paddle_customer_id
  } else {
    payload.customer = { email: profile?.email ?? user.email ?? '' }
  }

  try {
    const result = await paddleRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const transactionId = result?.data?.id
    if (!transactionId) {
      console.error('Paddle returned no transaction id:', JSON.stringify(result))
      return NextResponse.json({ error: 'no_transaction_id', detail: result }, { status: 500 })
    }

    return NextResponse.json({ transactionId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown'
    console.error('Checkout error:', msg)
    return NextResponse.json({ error: 'paddle_error', detail: msg }, { status: 500 })
  }
}
