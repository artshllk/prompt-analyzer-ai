import { NextRequest, NextResponse } from 'next/server'
import { createEmailAdminClient } from '@/lib/email/admin'
import { verifyUnsubscribe, type UnsubscribeScope } from '@/lib/email/unsubscribe'

/**
 * One-click unsubscribe. Works logged out (email clients open links
 * without a session); the HMAC signature proves the link came from an
 * email we sent to this user.
 *
 * GET renders a tiny confirmation page. POST handles RFC 8058
 * one-click unsubscribe (Gmail and Yahoo fire it automatically), which
 * must unsubscribe without any page interaction.
 */

const SCOPES: UnsubscribeScope[] = ['weekly', 'tips', 'all']

async function unsubscribe(req: NextRequest): Promise<{ ok: boolean; scope: UnsubscribeScope | null }> {
  const uid = req.nextUrl.searchParams.get('uid')
  const scope = req.nextUrl.searchParams.get('scope') as UnsubscribeScope | null
  const sig = req.nextUrl.searchParams.get('sig')

  if (!uid || !sig || !scope || !SCOPES.includes(scope)) return { ok: false, scope: null }
  if (!verifyUnsubscribe(uid, scope, sig)) return { ok: false, scope: null }

  // The weekly report is gone and so is its column. An old link from a
  // report we already sent still has to resolve, so it succeeds without a
  // write: what they are asking to stop has already stopped for good.
  if (scope === 'weekly') return { ok: true, scope }

  const db = createEmailAdminClient()
  const update =
    scope === 'tips' ? { email_tips: false } : { email_unsubscribed: true }

  const { error } = await db.from('profiles').update(update).eq('id', uid)
  return { ok: !error, scope }
}

export async function POST(req: NextRequest) {
  const { ok } = await unsubscribe(req)
  return new NextResponse(null, { status: ok ? 200 : 400 })
}

export async function GET(req: NextRequest) {
  const { ok, scope } = await unsubscribe(req)

  const message = !ok
    ? 'This unsubscribe link is not valid. Nothing was changed.'
    : scope === 'weekly' ? 'Done. No more weekly reports.'
    : scope === 'tips' ? 'Done. No more tips.'
    : 'Done. You will not get any more emails from us.'

  return new NextResponse(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Deepclario</title>
</head>
<body style="margin:0;background:#0E0E10;color:#F5F4F1;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh">
  <main style="max-width:26rem;padding:2rem;text-align:center">
    <p style="font-size:1.1rem;line-height:1.6">${message}</p>
    <p style="margin-top:1.5rem"><a href="/" style="color:#7DA7F4">Back to Deepclario</a></p>
  </main>
</body>
</html>`,
    { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
