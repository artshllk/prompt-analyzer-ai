import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Client for the email OTP flow only. PKCE (the default above) binds the
 * emailed token to a code_verifier cookie in this browser - right for
 * OAuth redirects, wrong for a 6-digit code the user may type on another
 * device, and it breaks verifyOtp-by-code. Implicit flow issues plain
 * tokens; the session still lands in the same cookies on verify, so the
 * server sees it identically. Not the singleton: it must not replace the
 * default client used everywhere else.
 */
export function createOtpClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      isSingleton: false,
      auth: { flowType: 'implicit' },
    }
  )
}
