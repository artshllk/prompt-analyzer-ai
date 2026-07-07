'use client'

import { useState } from 'react'
import type { Provider } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { rememberSignIn, type SignInMethod } from '@/lib/auth/local-hints'

/**
 * Redirect-based OAuth sign-in (GitHub, Twitter/X). Uses the default PKCE
 * browser client so the code verifier lands in a cookie the server
 * /auth/callback route can read via exchangeCodeForSession - the exact
 * flow that already powers Google's callback.
 *
 * Each provider is a progressive enhancement, gated behind a public env
 * flag so a button only appears once the provider is actually enabled in
 * the Supabase dashboard (clicking a not-yet-configured provider would
 * otherwise 400). This mirrors how Google is gated behind its client ID.
 */
const GITHUB_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GITHUB_AUTH === 'true'
const TWITTER_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TWITTER_AUTH === 'true'

/** True when at least one redirect-OAuth provider is configured. */
export function socialOAuthAvailable(): boolean {
  return GITHUB_ENABLED || TWITTER_ENABLED
}

interface ProviderConfig {
  id: Provider
  method: SignInMethod
  label: string
  Icon: () => React.ReactElement
}

const PROVIDERS: ProviderConfig[] = [
  GITHUB_ENABLED && { id: 'github' as Provider, method: 'github' as SignInMethod, label: 'Continue with GitHub', Icon: GitHubIcon },
  TWITTER_ENABLED && { id: 'twitter' as Provider, method: 'twitter' as SignInMethod, label: 'Continue with X', Icon: XIcon },
].filter(Boolean) as ProviderConfig[]

export function OAuthButtons({
  redirectTo,
  onError,
}: {
  redirectTo: string
  onError: (message: string) => void
}) {
  const [pending, setPending] = useState<Provider | null>(null)

  if (PROVIDERS.length === 0) return null

  async function start(p: ProviderConfig) {
    setPending(p.id)
    onError('')
    try {
      const supabase = createClient()
      const callback = new URL('/auth/callback', window.location.origin)
      callback.searchParams.set('next', redirectTo)

      // Optimistic hint: signInWithOAuth navigates the browser away on
      // success, so we won't run after it. A stale hint (if the user
      // cancels at the provider) is harmless - it only prefills next time.
      rememberSignIn(p.method, null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: p.id,
        options: { redirectTo: callback.toString() },
      })
      if (error) {
        setPending(null)
        onError(`Could not start ${p.label}. Try another way.`)
      }
    } catch {
      setPending(null)
      onError('Something went wrong. Try again.')
    }
  }

  return (
    <div className="space-y-2.5">
      {PROVIDERS.map(p => {
        const busy = pending === p.id
        return (
          <button
            key={p.id}
            onClick={() => start(p)}
            disabled={pending !== null}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-[15px] transition-all btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: '1px solid var(--color-rule-strong)', color: 'var(--color-paper)', fontWeight: 500 }}
          >
            {busy ? (
              <span
                className="h-4 w-4 rounded-full animate-spin"
                style={{ border: '2px solid var(--color-rule-strong)', borderTopColor: 'var(--color-paper)' }}
              />
            ) : (
              <p.Icon />
            )}
            {busy ? 'Connecting…' : p.label}
          </button>
        )
      })}
    </div>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.32.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  )
}
