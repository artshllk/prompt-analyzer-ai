'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Sign in with Google using Google Identity Services (GIS) directly, then hand
 * the resulting ID token to Supabase via signInWithIdToken.
 *
 * Why not supabase.auth.signInWithOAuth: that flow redirects through
 * <project-ref>.supabase.co, so Google's consent screen reads
 * "to continue to <project-ref>.supabase.co". By running GIS against our OWN
 * Google OAuth client the user only ever sees our branded client, and Supabase
 * still mints a normal session, so all downstream RLS / auth.uid() code is
 * unchanged.
 *
 * This component is a progressive enhancement: the parent must only render it
 * when a client ID exists, and if the GIS script fails to load it calls
 * onUnavailable so the page can fall back to email without showing anything
 * broken.
 */

type CredentialResponse = { credential: string }

interface GoogleAccountsId {
  initialize(config: {
    client_id: string
    callback: (response: CredentialResponse) => void
    nonce?: string
    use_fedcm_for_prompt?: boolean
  }): void
  renderButton(
    parent: HTMLElement,
    options: {
      type?: 'standard'
      theme?: 'outline' | 'filled_black' | 'filled_blue'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'continue_with'
      shape?: 'pill' | 'rectangular'
      logo_alignment?: 'left' | 'center'
      width?: number
    }
  ): void
  prompt(): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } }
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const LOAD_TIMEOUT_MS = 6000

async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
  )
  const encoded = new TextEncoder().encode(raw)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return { raw, hashed }
}

function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const timer = window.setTimeout(() => reject(new Error('gis-timeout')), LOAD_TIMEOUT_MS)
    const done = () => {
      window.clearTimeout(timer)
      resolve()
    }
    const fail = () => {
      window.clearTimeout(timer)
      reject(new Error('gis-load'))
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`
    )
    if (existing) {
      existing.addEventListener('load', done)
      existing.addEventListener('error', fail)
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.onload = done
    script.onerror = fail
    document.head.appendChild(script)
  })
}

export default function GoogleSignIn({
  clientId,
  redirectTo,
  onError,
  onUnavailable,
}: {
  clientId: string
  redirectTo: string
  /** A real sign-in attempt failed; worth telling the user. */
  onError: (message: string) => void
  /** Google cannot be offered at all (script blocked, network); hide this path silently. */
  onUnavailable: () => void
}) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const rawNonceRef = useRef<string>('')
  const [ready, setReady] = useState(false)
  const supabase = createClient()

  const handleCredential = useCallback(
    async (response: CredentialResponse) => {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce: rawNonceRef.current,
      })
      if (error) {
        onError('Could not complete Google sign-in. Please try again or use email.')
        return
      }
      // Full navigation so the server picks up the fresh session cookie.
      window.location.assign(redirectTo)
    },
    [supabase, redirectTo, onError]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await loadGis()
        const { raw, hashed } = await makeNonce()
        if (cancelled || !buttonRef.current || !window.google) return
        rawNonceRef.current = raw
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          nonce: hashed,
          use_fedcm_for_prompt: true,
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'filled_blue',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: 360,
        })
        setReady(true)
      } catch {
        if (!cancelled) onUnavailable()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [clientId, handleCredential, onUnavailable])

  return (
    <div className="w-full flex flex-col items-center">
      {/* GIS renders its own button here. A skeleton keeps layout stable. */}
      <div
        ref={buttonRef}
        className={`w-full flex justify-center ${ready ? 'min-h-11' : 'h-0 overflow-hidden'}`}
      />
      {!ready && (
        <div
          className="w-full h-11 rounded-full animate-pulse"
          style={{ background: 'var(--color-rule)' }}
          aria-hidden
        />
      )}
    </div>
  )
}
