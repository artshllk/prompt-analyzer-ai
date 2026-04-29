import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paddleRequest } from '@/lib/paddle'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('paddle_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.paddle_customer_id) {
    return NextResponse.json({ error: 'no_subscription' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const result = await paddleRequest(
    `/customers/${profile.paddle_customer_id}/portal-sessions`,
    {
      method: 'POST',
      body: JSON.stringify({ urls: { return: `${appUrl}/dashboard` } }),
    }
  )

  const portalUrl = result?.data?.urls?.general?.overview
  if (!portalUrl) {
    return NextResponse.json({ error: 'portal_failed' }, { status: 500 })
  }

  return NextResponse.json({ url: portalUrl })
}
