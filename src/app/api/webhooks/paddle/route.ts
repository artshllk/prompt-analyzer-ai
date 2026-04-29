import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

function verifyPaddleSignature(body: string, header: string | null): boolean {
  if (!header) return false
  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret) return false

  // Paddle signature header format: ts=<timestamp>;h1=<hmac>
  const parts = Object.fromEntries(header.split(';').map(p => p.split('=')))
  const ts = parts['ts']
  const h1 = parts['h1']
  if (!ts || !h1) return false

  const signed = `${ts}:${body}`
  const expected = createHmac('sha256', secret).update(signed).digest('hex')
  return expected === h1
}

type PaddleSubscription = {
  id: string
  status: string
  customer_id: string
  current_billing_period?: { ends_at?: string }
  custom_data?: { supabase_user_id?: string }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('paddle-signature')

  if (!verifyPaddleSignature(body, sig)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body) as { event_type: string; data: PaddleSubscription }
  const supabase = await createServiceClient()

  switch (event.event_type) {
    case 'subscription.activated':
    case 'subscription.updated': {
      const sub = event.data
      const userId = sub.custom_data?.supabase_user_id
      if (!userId) break

      const isActive = sub.status === 'active' || sub.status === 'trialing'
      const periodEnd = sub.current_billing_period?.ends_at ?? null

      await supabase.from('profiles').update({
        tier: isActive ? 'pro' : 'free',
        paddle_customer_id: sub.customer_id,
        paddle_subscription_id: sub.id,
        subscription_status: sub.status as 'active' | 'canceled' | 'past_due' | 'trialing',
        subscription_period_end: periodEnd,
      }).eq('id', userId)
      break
    }

    case 'subscription.canceled': {
      const sub = event.data
      const userId = sub.custom_data?.supabase_user_id
      if (!userId) break

      await supabase.from('profiles').update({
        tier: 'free',
        paddle_subscription_id: null,
        subscription_status: 'canceled',
        subscription_period_end: null,
      }).eq('id', userId)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
