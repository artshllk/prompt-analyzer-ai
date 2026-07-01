'use client'

import { Suspense, useCallback, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import GoogleSignIn from './GoogleSignIn'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}

// Inlined at build time. Google sign-in is a progressive enhancement: it only
// appears when a client ID is configured, and the page is fully polished
// without it because email sign-in links are the guaranteed path.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''

function LoginInner() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'
  const errorFromUrl = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(errorFromUrl ?? '')
  const [googleAvailable, setGoogleAvailable] = useState(Boolean(GOOGLE_CLIENT_ID))
  const [showEmail, setShowEmail] = useState(!GOOGLE_CLIENT_ID)

  const handleGoogleUnavailable = useCallback(() => {
    setGoogleAvailable(false)
    setShowEmail(true)
  }, [])

  const supabase = createClient()

  function callbackUrl() {
    const url = new URL('/auth/callback', window.location.origin)
    url.searchParams.set('next', redirectTo)
    return url.toString()
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl(),
        shouldCreateUser: true,
      },
    })

    setLoading(false)
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('rate') || msg.includes('limit')) {
        setError('Too many attempts. Wait a minute and try again.')
      } else if (msg.includes('email')) {
        setError(
          googleAvailable
            ? "We couldn't send the link. Try Google instead."
            : "We couldn't send the link. Check the address and try again."
        )
      } else {
        setError('Something went sideways on our end. Try again.')
      }
    } else {
      setSent(true)
    }
  }

  return (
    <div
      className="editorial grain min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      {/* Brand mark */}
      <Link href="/" className="flex items-center gap-2.5 mb-12 transition-opacity hover:opacity-80">
        <Image src="/logo.png" alt="Deepclario" width={32} height={32} priority />
        <span className="text-[15px] tracking-tight" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>
          Deepclario
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {sent ? (
          <SentState
            email={email}
            hasGoogle={googleAvailable}
            onChange={() => { setSent(false); setEmail(''); setShowEmail(!googleAvailable) }}
          />
        ) : (
          <>
            <p className="eyebrow mb-4">Sign in</p>
            <h1
              className="display text-4xl mb-3"
              style={{ color: 'var(--color-paper)' }}
            >
              Welcome back.
            </h1>
            <p className="text-base leading-[1.55] mb-8" style={{ color: 'var(--color-paper-mute)' }}>
              New here? An account is created the first time you sign in. No setup, no password.
            </p>

            {/* Google Identity Services renders its own button (talks to our own
                Google client + Supabase directly, so no supabase.co redirect).
                Only offered when a client ID is configured; hidden silently if
                the script cannot load. */}
            {googleAvailable && (
              <>
                <GoogleSignIn
                  clientId={GOOGLE_CLIENT_ID}
                  redirectTo={redirectTo}
                  onError={setError}
                  onUnavailable={handleGoogleUnavailable}
                />
                <p className="mt-3 text-sm text-center" style={{ color: 'var(--color-paper-mute)' }}>
                  We only use your name and email. Deepclario never sees your Google password.
                </p>
              </>
            )}
            {error && !showEmail && (
              <p className="mt-2 text-xs text-center" style={{ color: '#C25E5E' }}>{error}</p>
            )}

            {/* Email path */}
            {!showEmail ? (
              <button
                onClick={() => setShowEmail(true)}
                className="block mx-auto mt-5 text-sm underline-offset-4 hover:underline transition-all"
                style={{ color: 'var(--color-paper-mute)' }}
              >
                Or use email instead
              </button>
            ) : (
              <div className={googleAvailable ? 'mt-8' : ''}>
                {googleAvailable && (
                  <div className="flex items-center gap-3 mb-5">
                    <span className="flex-1 h-px" style={{ background: 'var(--color-rule)' }} />
                    <span className="eyebrow">Email</span>
                    <span className="flex-1 h-px" style={{ background: 'var(--color-rule)' }} />
                  </div>
                )}
                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-2 text-[11px] uppercase tracking-[0.14em]"
                      style={{ color: 'var(--color-paper-mute)' }}
                    >
                      Email address
                    </label>
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 transition-all"
                      style={{
                        background: 'var(--color-ink-card)',
                        border: `1px solid ${emailFocused ? 'var(--color-accent)' : 'var(--color-rule-strong)'}`,
                        boxShadow: emailFocused ? '0 0 0 3px var(--color-accent-soft)' : 'none',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, opacity: 0.55 }}>
                        <path d="M2.5 5.833 10 10.833l7.5-5M3.333 15.833h13.334c.92 0 1.666-.746 1.666-1.666V5.833c0-.92-.746-1.666-1.666-1.666H3.333c-.92 0-1.666.746-1.666 1.666v8.334c0 .92.746 1.666 1.666 1.666Z" stroke="var(--color-paper)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        placeholder="you@company.com"
                        required
                        autoFocus
                        autoComplete="email"
                        className="w-full py-3.5 text-base focus:outline-none bg-transparent"
                        style={{
                          color: 'var(--color-paper)',
                          fontFamily: 'var(--font-inter)',
                        }}
                      />
                    </div>
                  </div>
                  {error && (
                    <p className="text-xs" style={{ color: '#C25E5E' }}>{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'var(--color-paper)',
                      color: 'var(--color-ink)',
                      fontWeight: 600,
                    }}
                  >
                    {loading ? (
                      <>
                        <span
                          className="h-4 w-4 rounded-full animate-spin"
                          style={{ border: '2px solid rgba(14,14,16,0.25)', borderTopColor: 'var(--color-ink)' }}
                        />
                        Sending link
                      </>
                    ) : (
                      <>
                        Send sign-in link
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                          <path d="M4.167 10h11.666m0 0-5-5m5 5-5 5" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs" style={{ color: 'var(--color-paper-mute)' }}>
                    No password needed. We email you a secure one-time link.
                  </p>
                </form>
              </div>
            )}
          </>
        )}
      </motion.div>

      <p className="mt-12 text-xs text-center max-w-sm leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
        By continuing you agree to our{' '}
        <Link href="/terms" className="underline underline-offset-4 hover:opacity-100" style={{ color: 'var(--color-paper)' }}>terms</Link>{' '}and{' '}
        <Link href="/privacy" className="underline underline-offset-4 hover:opacity-100" style={{ color: 'var(--color-paper)' }}>privacy policy</Link>.
      </p>
    </div>
  )
}

function SentState({ email, hasGoogle, onChange }: { email: string; hasGoogle: boolean; onChange: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="text-center"
    >
      {/* Envelope badge */}
      <div
        className="mx-auto mb-7 flex items-center justify-center rounded-2xl"
        style={{
          width: 60,
          height: 60,
          background: 'var(--color-accent-soft)',
          border: '1px solid var(--color-accent-glow)',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M3 7.5 12 13.5 21 7.5M4 19h16c.552 0 1-.448 1-1V6c0-.552-.448-1-1-1H4c-.552 0-1 .448-1 1v12c0 .552.448 1 1 1Z" stroke="var(--color-accent-bright)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <p className="eyebrow mb-4" style={{ color: 'var(--color-accent)' }}>Link sent</p>
      <h1 className="display text-4xl mb-4" style={{ color: 'var(--color-paper)' }}>
        Check your inbox.
      </h1>
      <p className="text-base leading-[1.55] mb-1" style={{ color: 'var(--color-paper-mute)' }}>
        We sent a sign-in link to
      </p>
      <p
        className="text-base leading-[1.55] mb-6 inline-block px-3 py-1 rounded-lg"
        style={{ color: 'var(--color-paper)', background: 'var(--color-ink-card)', fontWeight: 500 }}
      >
        {email}
      </p>
      <p className="text-sm leading-[1.55] mb-8" style={{ color: 'var(--color-paper-mute)' }}>
        Open it on this device to continue. The link works once and expires in an hour.
      </p>

      <a
        href="https://mail.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] transition-all mb-3"
        style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 600 }}
      >
        Open email app
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 4.167h8.333V12.5M15.833 4.167 4.167 15.833" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>

      <button
        onClick={onChange}
        className="mt-2 text-sm underline-offset-4 hover:underline transition-all"
        style={{ color: 'var(--color-paper-mute)' }}
      >
        {hasGoogle ? 'Use a different method' : 'Use a different email'}
      </button>
    </motion.div>
  )
}
