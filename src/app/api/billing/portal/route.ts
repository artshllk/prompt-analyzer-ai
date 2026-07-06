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

  // paddleRequest throws on non-2xx - without this catch the route dies
  // as an unhandled 500 with no JSON body and the client can't tell the
  // user anything useful.
  let result
  try {
    result = await paddleRequest(
      `/customers/${profile.paddle_customer_id}/portal-sessions`,
      {
        method: 'POST',
        body: JSON.stringify({ urls: { return: `${appUrl}/dashboard` } }),
      }
    )
  } catch (err) {
    console.error('[billing/portal] paddle error:', (err as Error).message)
    return NextResponse.json({ error: 'portal_failed' }, { status: 502 })
  }

  const portalUrl = result?.data?.urls?.general?.overview
  if (!portalUrl) {
    return NextResponse.json({ error: 'portal_failed' }, { status: 502 })
  }

  return NextResponse.json({ url: portalUrl })
}
