'use client'

import { Suspense, useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createOtpClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import GoogleSignIn from './GoogleSignIn'
import {
  parseLastSignIn,
  readLastSignInRaw,
  rememberSignIn,
  subscribeToStorage,
} from '@/lib/auth/local-hints'
import { postSignInDestination } from '@/lib/auth/post-signin'

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
  // Accept both param names: marketing surfaces link with ?redirectTo=,
  // while server redirects (extension connect) use ?next=. Reading only
  // one silently dropped the user's destination after sign-in.
  const redirectTo =
    searchParams.get('redirectTo') ?? searchParams.get('next') ?? '/dashboard'
  const errorFromUrl = searchParams.get('error')

  const [email, setEmail] = useState('')
  // Until the user edits the field, it is prefilled from the last
  // account that signed in on this browser (localStorage hint).
  const [emailEdited, setEmailEdited] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [sent, setSent] = useState(false)
  // True when the request hit the cooldown because a link already went
  // out moments ago. That link is still valid, so we show the same
  // "check your inbox" state instead of an error.
  const [alreadySent, setAlreadySent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(errorFromUrl ?? '')
  const [googleAvailable, setGoogleAvailable] = useState(Boolean(GOOGLE_CLIENT_ID))
  // null = "no explicit choice yet"; the default then follows what the
  // returning user did last time (email users land on the email form).
  const [showEmailOverride, setShowEmailOverride] = useState<boolean | null>(null)

  // Last completed sign-in on this browser. Server snapshot is null, so
  // SSR and hydration render the anonymous page; the hint applies on the
  // first client render without a flash of wrong content.
  const lastRaw = useSyncExternalStore(subscribeToStorage, readLastSignInRaw, () => null)
  const last = useMemo(() => parseLastSignIn(lastRaw), [lastRaw])

  const effectiveEmail = emailEdited ? email : (email || last?.email || '')
  const showEmail = showEmailOverride ?? (!googleAvailable || last?.method === 'email')

  const handleGoogleUnavailable = useCallback(() => {
    setGoogleAvailable(false)
    setShowEmailOverride(true)
  }, [])

  // Implicit-flow client: the email path is request-code / verify-code,
  // where PKCE only adds a same-browser constraint and breaks typed-code
  // verification. See createOtpClient for details. Memoized because it is
  // not the shared singleton.
  const supabase = useMemo(() => createOtpClient(), [])

  function callbackUrl() {
    const url = new URL('/auth/callback', window.location.origin)
    url.searchParams.set('next', redirectTo)
    return url.toString()
  }

  async function handleEmailSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    if (!effectiveEmail.trim()) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: effectiveEmail.trim(),
      options: {
        emailRedirectTo: callbackUrl(),
        shouldCreateUser: true,
      },
    })

    setLoading(false)
    if (error) {
      const msg = error.message.toLowerCase()
      // Supabase enforces a cooldown between sign-in emails to the same
      // address. The link it already sent is still valid, so this is not
      // a failure from the user's point of view - land them on the same
      // "check your inbox" state the success path uses.
      if (error.code === 'over_email_send_rate_limit') {
        setAlreadySent(true)
        setSent(true)
      } else if (msg.includes('rate') || msg.includes('limit')) {
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

  /** Verify the one-time code from the sign-in email (project setting
   *  controls its length; ours is 8 digits, so accept 6-10). Returns an error
   *  message for the sent screen to show, or null on success (which
   *  navigates away). Same-page alternative to clicking the link, so it
   *  also works when the email is read on another device. */
  async function handleVerifyCode(code: string): Promise<string | null> {
    const address = effectiveEmail.trim()
    const { data, error } = await supabase.auth.verifyOtp({
      email: address,
      token: code,
      type: 'email',
    })
    if (error) {
      // Supabase answers otp_expired for wrong AND stale codes alike, so
      // one honest message covers both.
      return 'That code didn’t match or has expired. Use the code from the newest email, or request a fresh one.'
    }
    rememberSignIn('email', address)
    // Full navigation so the server picks up the fresh session cookie.
    // Brand-new users land in the playground instead of the dashboard.
    window.location.assign(postSignInDestination(redirectTo, data.user?.created_at))
    return null
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
            email={effectiveEmail}
            alreadySent={alreadySent}
            hasGoogle={googleAvailable}
            onVerifyCode={handleVerifyCode}
            onChange={() => {
              setSent(false)
              setAlreadySent(false)
              setEmail('')
              setEmailEdited(true)
              setShowEmailOverride(!googleAvailable)
            }}
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
              {last?.email
                ? `Sign in as ${last.email} to pick up where you left off, or use another account.`
                : 'New here? An account is created the first time you sign in. No setup, no password.'}
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
                onClick={() => setShowEmailOverride(true)}
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
                        value={effectiveEmail}
                        onChange={e => {
                          setEmail(e.target.value)
                          setEmailEdited(true)
                        }}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        placeholder="you@example.com"
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
                    disabled={loading || !effectiveEmail.trim()}
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

function SentState({
  email,
  alreadySent,
  hasGoogle,
  onVerifyCode,
  onChange,
}: {
  email: string
  alreadySent: boolean
  hasGoogle: boolean
  /** Resolves to an error message, or null on success (navigates away). */
  onVerifyCode: (code: string) => Promise<string | null>
  onChange: () => void
}) {
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [codeError, setCodeError] = useState('')

  async function handleCodeSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    if (code.length < 6 || verifying) return
    setVerifying(true)
    setCodeError('')
    const errorMessage = await onVerifyCode(code)
    if (errorMessage) {
      setVerifying(false)
      setCodeError(errorMessage)
      setCode('')
    }
    // On success the page navigates; keep the spinner until it does.
  }

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

      <p className="eyebrow mb-4" style={{ color: 'var(--color-accent)' }}>
        {alreadySent ? 'Link already sent' : 'Link sent'}
      </p>
      <h1 className="display text-4xl mb-4" style={{ color: 'var(--color-paper)' }}>
        Check your inbox.
      </h1>
      <p className="text-base leading-[1.55] mb-1" style={{ color: 'var(--color-paper-mute)' }}>
        {alreadySent
          ? 'A sign-in link went out moments ago to'
          : 'We sent a sign-in link to'}
      </p>
      <p
        className="text-base leading-[1.55] mb-6 inline-block px-3 py-1 rounded-lg"
        style={{ color: 'var(--color-paper)', background: 'var(--color-ink-card)', fontWeight: 500 }}
      >
        {email}
      </p>
      <p className="text-sm leading-[1.55] mb-8" style={{ color: 'var(--color-paper-mute)' }}>
        Enter the code from the email, or click the link inside it.
        Both work once and expire in an hour.
      </p>

      {/* Code entry - the primary path. Typing the code finishes sign-in
          right here, on any device, with no tab switch or redirect. */}
      <form onSubmit={handleCodeSubmit} className="mb-3">
        <label htmlFor="otp-code" className="sr-only">
          One-time sign-in code
        </label>
        <div className="flex gap-2">
          <input
            id="otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,10}"
            maxLength={10}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="00000000"
            autoFocus
            className="flex-1 min-w-0 py-3.5 px-4 rounded-xl text-center text-lg tracking-[0.25em] focus:outline-none"
            style={{
              background: 'var(--color-ink-card)',
              border: '1px solid var(--color-rule-strong)',
              color: 'var(--color-paper)',
              fontFamily: 'var(--font-mono), monospace',
            }}
          />
          <button
            type="submit"
            disabled={code.length < 6 || verifying}
            className="px-5 py-3.5 rounded-xl text-[15px] transition-all btn-paper disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 600 }}
          >
            {verifying ? (
              <span
                className="block h-4 w-4 rounded-full animate-spin"
                style={{ border: '2px solid rgba(14,14,16,0.25)', borderTopColor: 'var(--color-ink)' }}
              />
            ) : (
              'Verify'
            )}
          </button>
        </div>
        {codeError && (
          <p className="mt-2 text-xs text-left" style={{ color: '#C25E5E' }}>{codeError}</p>
        )}
      </form>

      <a
        href="https://mail.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] transition-all mb-3 btn-outline"
        style={{
          border: '1px solid var(--color-rule-strong)',
          color: 'var(--color-paper)',
          fontWeight: 500,
        }}
      >
        Open email app
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 4.167h8.333V12.5M15.833 4.167 4.167 15.833" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
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
