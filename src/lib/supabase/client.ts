import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Client for the email OTP flow only.
 *
 * ===================================================================
 * THE `implicit` HERE HAS NEVER TAKEN EFFECT. READ THIS BEFORE TRUSTING IT.
 * ===================================================================
 *
 * This used to claim it issued implicit-flow tokens so a code could be typed
 * on a different device. It does not. `createBrowserClient` in @supabase/ssr
 * (0.10.2, createBrowserClient.js:33-42) builds its auth options as:
 *
 *     auth: {
 *       ...options?.auth,          // our flowType lands here
 *       flowType: "pkce",          // and is unconditionally overwritten
 *       autoRefreshToken: options?.auth?.autoRefreshToken ?? isBrowser(),
 *       ...
 *     }
 *
 * Every other key is read back with `??`. Only `flowType` is hardcoded. So
 * the commit that "fixed" the OTP flow by asking for implicit changed nothing
 * at runtime, and the comment that replaced it was wrong for months.
 *
 * WHY IT IS KEPT ANYWAY. Typed codes do not need implicit flow:
 * `verifyOtp({email, token, type})` POSTs to /verify with no code_verifier,
 * so it works under PKCE. What PKCE does bind is the emailed LINK, and the
 * link is handled server-side by /auth/callback with `token_hash`, which is
 * also not PKCE-bound. Both paths work.
 *
 * DO NOT try to force implicit by reaching for `createClient` from
 * @supabase/supabase-js. Implicit returns tokens in the URL *fragment*, and
 * /auth/callback is a server route that can only read query params, so every
 * emailed link would arrive with nothing the server can see.
 *
 * It stays a separate non-singleton client so a sign-in attempt cannot
 * disturb the session of whoever is already signed in on this browser.
 */
export function createOtpClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { isSingleton: false }
  )
}
