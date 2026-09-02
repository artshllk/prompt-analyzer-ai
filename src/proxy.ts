import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// /dashboard is gone. '/' is the checker and is public.
const PROTECTED_PATHS = ['/history', '/settings']
const AUTH_PATHS = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session - do not run logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  const isAuthPath = AUTH_PATHS.some(p => pathname.startsWith(p))

  // Any redirect MUST carry over the cookies Supabase wrote during
  // getUser(). Refreshing an expired access token rotates the refresh
  // token; if the rotated cookies are dropped here, the browser keeps
  // the consumed refresh token and the next refresh attempt trips
  // Supabase's reuse detection, revoking the session and silently
  // signing the user out.
  const redirectWithCookies = (url: URL) => {
    const redirect = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie =>
      redirect.cookies.set(cookie)
    )
    return redirect
  }

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return redirectWithCookies(url)
  }

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return redirectWithCookies(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
