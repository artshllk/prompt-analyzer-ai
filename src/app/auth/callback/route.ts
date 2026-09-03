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
  /**
   * Validated HERE, before it is used to build anything. It arrives from a
   * URL anyone can edit, and our own email template got it wrong for months.
   * See post-signin.ts.
   */
  const next = postSignInDestination(searchParams.get('next'))

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

  // `next` is already validated, so the response built above is correct as
  // it stands. This exists so the session cookies attached to `response`
  // survive; building a fresh redirect here would drop them.
  function finish(_user: { id: string; created_at?: string } | null) {
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
