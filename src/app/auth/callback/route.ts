import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { postSignInDestination } from '@/lib/auth/post-signin'


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
  const next = searchParams.get('next') ?? '/check'

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
      const dest = postSignInDestination(next)
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
