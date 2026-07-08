import { NextRequest, NextResponse, after } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createEmailAdminClient } from '@/lib/email/admin'
import { emailConfigured } from '@/lib/email/send'
import { claimAndSend } from '@/lib/email/log'
import { welcomeEmail } from '@/lib/email/templates'
import { postSignInDestination } from '@/lib/auth/post-signin'

/**
 * Welcome email for brand-new users, sent after the redirect is
 * flushed so sign-in latency is untouched. The one-hour window keeps
 * existing users from getting welcomed on a routine login; the dedupe
 * key in claimAndSend guarantees once-ever even if the daily cron
 * sweep races this.
 */
function sendWelcomeIfNew(userId: string) {
  after(async () => {
    if (!emailConfigured()) return
    const db = createEmailAdminClient()
    const { data: profile } = await db
      .from('profiles')
      .select('id, email, full_name, created_at, email_unsubscribed')
      .eq('id', userId)
      .single()
    if (!profile || profile.email_unsubscribed) return
    if (Date.now() - new Date(profile.created_at).getTime() > 60 * 60 * 1000) return
    await claimAndSend(db, {
      userId: profile.id,
      email: profile.email,
      emailType: 'welcome',
      dedupeKey: `welcome:${profile.id}`,
      content: welcomeEmail(profile.id, profile.full_name),
    })
  })
}

function getOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host')
  const forwardedProto = req.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  return req.nextUrl.origin
}

export async function GET(req: NextRequest) {
  const origin = getOrigin(req)
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  if (errorParam) {
    const url = new URL(`${origin}/auth/auth-error`)
    url.searchParams.set('reason', errorDescription ?? errorParam)
    return NextResponse.redirect(url)
  }

  if (!code && !tokenHash) {
    const url = new URL(`${origin}/auth/auth-error`)
    url.searchParams.set('reason', 'Missing authentication code. The link may be malformed.')
    return NextResponse.redirect(url)
  }

  // Build the response upfront so cookies set by Supabase get attached to it
  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // The response object already carries the session cookies, so a changed
  // destination is applied by rewriting its Location header rather than
  // building a fresh redirect.
  function finish(user: { id: string; created_at?: string } | null) {
    if (user) {
      sendWelcomeIfNew(user.id)
      const dest = postSignInDestination(next, user.created_at)
      if (dest !== next) response.headers.set('location', `${origin}${dest}`)
    }
    return response
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const url = new URL(`${origin}/auth/auth-error`)
      url.searchParams.set('reason', error.message)
      return NextResponse.redirect(url)
    }
    return finish(data.user)
  }

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as 'magiclink' | 'signup' | 'recovery' | 'email_change' | 'email',
      token_hash: tokenHash,
    })
    if (error) {
      const url = new URL(`${origin}/auth/auth-error`)
      url.searchParams.set('reason', error.message)
      return NextResponse.redirect(url)
    }
    return finish(data.user)
  }

  return NextResponse.redirect(`${origin}/auth/auth-error?reason=unknown`)
}
