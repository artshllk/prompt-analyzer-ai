import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getOrigin(req: NextRequest): string {
  // In production behind Vercel, req.url's origin can be the internal deployment URL.
  // Trust the forwarded headers instead so cookies and redirects target the public domain.
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

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    const url = new URL(`${origin}/auth/auth-error`)
    url.searchParams.set('reason', error.message)
    return NextResponse.redirect(url)
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'magiclink' | 'signup' | 'recovery' | 'email_change' | 'email',
      token_hash: tokenHash,
    })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    const url = new URL(`${origin}/auth/auth-error`)
    url.searchParams.set('reason', error.message)
    return NextResponse.redirect(url)
  }

  return NextResponse.redirect(`${origin}/auth/auth-error?reason=unknown`)
}
