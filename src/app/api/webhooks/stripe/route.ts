import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

function getPeriodEnd(subscription: Stripe.Subscription): string | null {
  // In newer Stripe API versions, current_period_end is on subscription items
  const item = subscription.items?.data?.[0]
  if (item && 'current_period_end' in item) {
    return new Date((item as { current_period_end: number }).current_period_end * 1000).toISOString()
  }
  // Fallback: try to get it from subscription directly via any
  const sub = subscription as unknown as { current_period_end?: number }
  if (sub.current_period_end) {
    return new Date(sub.current_period_end * 1000).toISOString()
  }
  return null
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (!userId || session.mode !== 'subscription') break

      const subscriptionId = session.subscription as string
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)

      await supabase.from('profiles').update({
        tier: 'pro',
        stripe_subscription_id: subscriptionId,
        subscription_status: subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing',
        subscription_period_end: getPeriodEnd(subscription),
      }).eq('id', userId)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      if (!userId) break

      const isActive = subscription.status === 'active' || subscription.status === 'trialing'

      await supabase.from('profiles').update({
        tier: isActive ? 'pro' : 'free',
        subscription_status: subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing',
        subscription_period_end: getPeriodEnd(subscription),
      }).eq('stripe_subscription_id', subscription.id)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase.from('profiles').update({
        tier: 'free',
        stripe_subscription_id: null,
        subscription_status: 'canceled',
        subscription_period_end: null,
      }).eq('stripe_subscription_id', subscription.id)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
