import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PADDLE_PLANS, paddleRequest } from '@/lib/paddle'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { plan = 'pro_monthly' } = await req.json()
  const selectedPlan = PADDLE_PLANS[plan as keyof typeof PADDLE_PLANS] ?? PADDLE_PLANS.pro_monthly

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
      url: `${appUrl}/dashboard?upgraded=true`,
    },
  }

  if (profile?.paddle_customer_id) {
    payload.customer_id = profile.paddle_customer_id
  } else {
    payload.customer = { email: profile?.email ?? user.email ?? '' }
  }

  const result = await paddleRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  // The transaction checkout URL to redirect user to
  const checkoutUrl = result?.data?.checkout?.url
  if (!checkoutUrl) {
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 })
  }

  return NextResponse.json({ url: checkoutUrl })
}
