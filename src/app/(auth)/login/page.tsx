'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createOtpClient } from '@/lib/supabase/client'
import GoogleSignIn from './GoogleSignIn'
import { OAuthButtons, socialOAuthAvailable } from './OAuthButtons'
import {
  parseLastSignIn,
  readLastSignInRaw,
  rememberSignIn,
  subscribeToStorage,
} from '@/lib/auth/local-hints'
import { postSignInDestination } from '@/lib/auth/post-signin'

/**
 * Sign in.
 *
 * ===================================================================
 * A SPLIT PANEL, BECAUSE THE PRODUCT HAS SOMETHING TO SHOW
 * ===================================================================
 *
 * This was a centred form on an empty page: a logo, a marketing-weight
 * headline, and a submit button with no fill at all, so the primary action
 * rendered as bare text with an invisible arrow beside it. It looked
 * unfinished because several of its parts genuinely were not painted.
 *
 * The layout is now the one Stripe-class products use when they have
 * something worth showing: form on the left at a fixed width, product on the
 * right. The right column is not decoration. It is the checker marking up a
 * sentence in the same three meaning colours the real thing uses, on the same
 * paper, so somebody signing in for the first time sees what they came for.
 *
 * FIXED HERE, ALL VERIFIED AGAINST THE RENDERED PAGE:
 *   - the submit button had no `btn-brand`, so it had no fill
 *   - both inputs were white on paper at 1.14:1 with a 1.42:1 border, well
 *     under the 3:1 WCAG asks of a control boundary
 *   - the email focus ring measured 1.05:1 and the code field had
 *     `focus:outline-none` with nothing put back
 *   - error text was an off-palette red at 3.64:1, 12px, unannounced
 *   - the verify spinner was `--brand` on a `--brand` fill, 1.0:1
 *   - the Suspense fallback was `null`, so the prerendered body was empty
 *   - `?error=` rendered arbitrary query text as the page's error message
 *   - going back from the code step wiped the address, with no resend
 *   - two entrance animations played at once on mobile
 */
export default function LoginPage() {
  return (
    <div className="login-split">
      <div className="login-form-col">
        <BrandMark />
        <div className="w-full max-w-[380px] flex-1 flex flex-col justify-center py-12">
          <Suspense fallback={<FormSkeleton />}>
            <LoginInner />
          </Suspense>
        </div>
        <LegalLine />
      </div>
      <ProofColumn />
    </div>
  )
}

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0 rounded-md">
      <Image src="/logo.png" alt="" width={28} height={28} priority />
      <span className="text-[15px] tracking-tight" style={{ color: 'var(--ink)', fontWeight: 600 }}>
        Deepclario
      </span>
    </Link>
  )
}

/** Shape only. No shimmer: a skeleton that pulses reads as a page failing. */
function FormSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-[32px] w-[200px] rounded" style={{ background: 'var(--rule)' }} />
      <div className="mt-4 h-[18px] w-full rounded" style={{ background: 'var(--rule)', opacity: 0.55 }} />
      <div className="mt-8 h-[50px] w-full rounded-xl" style={{ background: 'var(--rule)', opacity: 0.45 }} />
    </div>
  )
}

function LegalLine() {
  return (
    <p className="shrink-0 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
      By continuing you agree to our{' '}
      <Link href="/terms" className="login-legal-link">terms</Link>{' '}and{' '}
      <Link href="/privacy" className="login-legal-link">privacy policy</Link>.
    </p>
  )
}

/**
 * The right-hand column.
 *
 * Static, hidden below lg, and aria-hidden. It is illustration: a screen
 * reader should get the form, not a decorative paragraph read as content.
 */
function ProofColumn() {
  return (
    <aside className="login-proof-col" aria-hidden="true">
      <div className="max-w-[420px]">
        <p className="text-[12px] uppercase tracking-[0.14em] mb-7" style={{ color: 'var(--ink-soft)' }}>
          Every claim, against the source it cites
        </p>
        <p className="text-[17px] leading-[2.1] wrap-break-word" style={{ color: 'var(--ink)' }}>
          Search drives{' '}
          <span className="login-mark login-mark-confirm">68% of trackable website traffic</span>, and{' '}
          <span className="login-mark login-mark-guess">63.41% of US referrals come from Google</span>, while{' '}
          <span className="login-mark login-mark-brand">61.5% of desktop searches end without a click</span>.
        </p>
        <dl className="mt-9 space-y-3 text-[13px]">
          {[
            ['login-mark-confirm', 'supported', 'the source says what the sentence says'],
            ['login-mark-guess', 'changed', 'the number is there, the meaning is not'],
            ['login-mark-brand', 'not in the source', 'we read the page and it is not there'],
          ].map(([cls, key, body]) => (
            <div key={key} className="flex gap-3">
              <dt className={`login-key ${cls}`}>{key}</dt>
              <dd style={{ color: 'var(--ink-soft)' }}>{body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  )
}

/**
 * `?error=` copy, mapped rather than echoed.
 *
 * The raw parameter used to be rendered as the page's error message, so any
 * text in the query string appeared as if the product had said it.
 */
const ERROR_COPY: Record<string, string> = {
  otp_expired: 'That link has expired. Enter your email and we will send a new one.',
  access_denied: 'That sign-in link is no longer valid. Ask for a fresh one below.',
  invalid_request: 'That link was incomplete. Ask for a fresh one below.',
}

function errorCopyFor(raw: string | null): string {
  if (!raw) return ''
  return ERROR_COPY[raw] ?? 'That sign-in link did not work. Enter your email and we will send a new one.'
}

// Inlined at build time. Google sign-in is a progressive enhancement: it only
// appears when a client ID is configured, and the page is fully usable
// without it because email sign-in is the guaranteed path.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''

function LoginInner() {
  const searchParams = useSearchParams()
  // Accept both param names: marketing surfaces link with ?redirectTo=,
  // while server redirects (extension connect) use ?next=. Reading only
  // one silently dropped the user's destination after sign-in.
  const redirectTo =
    // Lands on the checker, not a stats page. The reason anyone makes an
    // account is to keep checking, and the checks-left count lives there, so
    // a dashboard in between was a click in front of the only thing they came
    // for.
    searchParams.get('redirectTo') ?? searchParams.get('next') ?? '/check'
  const errorFromUrl = searchParams.get('error')

  const [email, setEmail] = useState('')
  // Until the user edits the field, it is prefilled from the last
  // account that signed in on this browser (localStorage hint).
  const [emailEdited, setEmailEdited] = useState(false)
  const [sent, setSent] = useState(false)
  // True when the request hit the cooldown because a link already went
  // out moments ago. That link is still valid, so we show the same
  // "check your inbox" state instead of an error.
  const [alreadySent, setAlreadySent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(errorCopyFor(errorFromUrl))
  const [googleAvailable, setGoogleAvailable] = useState(Boolean(GOOGLE_CLIENT_ID))

  // Last completed sign-in on this browser. Server snapshot is null, so
  // SSR and hydration render the anonymous page; the hint applies on the
  // first client render without a flash of wrong content.
  const lastRaw = useSyncExternalStore(subscribeToStorage, readLastSignInRaw, () => null)
  const last = useMemo(() => parseLastSignIn(lastRaw), [lastRaw])

  const effectiveEmail = emailEdited ? email : (email || last?.email || '')
  // Any social path available (Google button, or a redirect-OAuth provider).
  // The email form always shows; social buttons stack above it.
  const hasSocial = googleAvailable || socialOAuthAvailable()

  const handleGoogleUnavailable = useCallback(() => {
    setGoogleAvailable(false)
  }, [])

  // A separate, non-singleton client so a sign-in attempt cannot disturb the
  // session of whoever is already signed in on this browser. It is PKCE like
  // every other client - see createOtpClient for why that is fine for typed
  // codes, and why the old "implicit" comment here was wrong.
  const supabase = useMemo(() => createOtpClient(), [])

  function callbackUrl() {
    const url = new URL('/auth/callback', window.location.origin)
    url.searchParams.set('next', redirectTo)
    return url.toString()
  }

  /**
   * Send the email. Split from the submit handler so Resend can call it
   * without inventing a fake event to satisfy a signature.
   */
  async function sendSignInEmail() {
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

  /**
   * Verify the one-time code from the sign-in email.
   *
   * TWO BUGS LIVED HERE AND BOTH LOOKED LIKE "the code does not work".
   *
   * The first: only `error` was checked. auth-js does NOT error on a 200 that
   * carries no session - `_sessionResponse` returns `{session: null, user}`
   * with `error: null` - so a session-less success wrote the "signed in"
   * hint, navigated to /check, and /check bounced the still-signed-out user
   * to the homepage. The button spun, the page moved, and nothing said why.
   * A session is now required before any of that happens.
   *
   * The second: every failure rendered one sentence about the code being
   * wrong. Supabase also answers here with rate limits, a disabled provider,
   * and plain network errors, and telling somebody holding a correct code
   * that it is wrong sends them into a retype loop that earns them a rate
   * limit, reported as the same wrong-code message. The causes are now told
   * apart, because they need different actions from the reader.
   */
  async function handleVerifyCode(code: string): Promise<string | null> {
    const address = effectiveEmail.trim()
    if (!address) {
      return 'We lost track of your email address. Go back and enter it again.'
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: address,
      token: code,
      type: 'email',
    })

    if (error) {
      const code_ = error.code ?? ''
      const status = error.status ?? 0
      if (code_ === 'over_request_rate_limit' || status === 429) {
        return 'Too many tries. Wait a minute, then use the link in the email instead.'
      }
      if (code_ === 'otp_disabled' || code_ === 'email_provider_disabled') {
        return 'Email sign-in is unavailable right now. That is our problem, not your code.'
      }
      if (error.name === 'AuthRetryableFetchError') {
        return 'We could not reach the server. Check your connection and try again.'
      }
      // Supabase answers otp_expired for wrong AND stale codes alike, so one
      // honest sentence covers both of those.
      return 'That code did not match, or it has expired. Use the code from the newest email, or ask for a fresh one.'
    }

    /**
     * A 200 with no session is not a sign-in. Navigating on it is what made
     * this look like the code was being ignored.
     */
    if (!data?.session?.access_token) {
      return 'We could not finish signing you in. Use the link in the email instead.'
    }

    rememberSignIn('email', address)
    // Full navigation so the server picks up the fresh session cookie.
    window.location.assign(postSignInDestination(redirectTo))
    return null
  }

  function handleEmailSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    void sendSignInEmail()
  }

  return (
    <>
      {error && (
        <p role="alert" className="login-error mb-6">
          {error}
        </p>
      )}

      {sent ? (
        <SentState
          email={effectiveEmail}
          alreadySent={alreadySent}
          hasGoogle={googleAvailable}
          onVerifyCode={handleVerifyCode}
          onResend={() => sendSignInEmail()}
          onChange={() => {
            setSent(false)
            setAlreadySent(false)
            // The address is KEPT. Clearing it meant a typo cost a full
            // retype, and the only way to a new code was to trip the
            // cooldown.
            setEmailEdited(true)
          }}
        />
      ) : (
        <>
          <h1 className="font-serif text-[28px] leading-[1.2] tracking-tight" style={{ color: 'var(--ink)' }}>
            {last?.email ? 'Welcome back' : 'Sign in to Deepclario'}
          </h1>
          <p className="mt-2 text-[15px] leading-[1.55]" style={{ color: 'var(--ink-soft)' }}>
            {last?.email
              ? `Continue as ${last.email}, or use another account.`
              : 'No password. We email you a code and a link, and the account is made the first time you sign in.'}
          </p>

          {googleAvailable && (
            <div className="mt-8">
              <GoogleSignIn
                clientId={GOOGLE_CLIENT_ID}
                redirectTo={redirectTo}
                onError={setError}
                onUnavailable={handleGoogleUnavailable}
              />
            </div>
          )}

          {socialOAuthAvailable() && (
            <div className={googleAvailable ? 'mt-3' : 'mt-8'}>
              <OAuthButtons
                redirectTo={redirectTo}
                onError={setError}
                exclude={googleAvailable ? ['google'] : []}
              />
            </div>
          )}

          <div className={hasSocial ? 'mt-7' : 'mt-8'}>
            {hasSocial && (
              <div className="flex items-center gap-3 mb-6">
                <span className="flex-1 h-px" style={{ background: 'var(--rule)' }} />
                <span className="text-[12px] uppercase tracking-[0.14em]" style={{ color: 'var(--ink-soft)' }}>or</span>
                <span className="flex-1 h-px" style={{ background: 'var(--rule)' }} />
              </div>
            )}

            <form onSubmit={handleEmailSubmit} noValidate>
              <label htmlFor="email" className="block mb-2 text-[13px]" style={{ color: 'var(--ink)', fontWeight: 500 }}>
                Email address
              </label>
              {/* :focus-within rather than JS focus state, so the ring is a
                  CSS concern and there is one less re-render per keystroke. */}
              <div className="login-field">
                <input
                  id="email"
                  type="email"
                  value={effectiveEmail}
                  onChange={e => {
                    setEmail(e.target.value)
                    setEmailEdited(true)
                  }}
                  placeholder="you@company.com"
                  required
                  autoFocus={!hasSocial}
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="go"
                  className="login-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !effectiveEmail.trim()}
                aria-busy={loading}
                className="btn-brand mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontWeight: 500 }}
              >
                {loading ? (
                  <>
                    <span className="login-spinner" />
                    Sending
                  </>
                ) : (
                  'Continue with email'
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  )
}

/**
 * Step two: the code from the email.
 *
 * The whole block is a live region so the change of step is announced. It was
 * a silent swap before, and a screen reader user got no signal that the form
 * had become a different form.
 */
function SentState({
  email,
  alreadySent,
  hasGoogle,
  onVerifyCode,
  onResend,
  onChange,
}: {
  email: string
  alreadySent: boolean
  hasGoogle: boolean
  /** Resolves to an error message, or null on success (navigates away). */
  onVerifyCode: (code: string) => Promise<string | null>
  /** Ask for a fresh code. Not a form submit, so it takes nothing. */
  onResend: () => void | Promise<void>
  onChange: () => void
}) {
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [cooldown, setCooldown] = useState(60)
  const inputRef = useRef<HTMLInputElement>(null)

  // A resend that is available immediately just trips Supabase's cooldown and
  // reports it as a failure, so the countdown is the honest affordance.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function submit() {
    if (code.length < 6 || verifying) return
    setVerifying(true)
    setCodeError('')
    const errorMessage = await onVerifyCode(code)
    if (errorMessage) {
      setVerifying(false)
      setCodeError(errorMessage)
      setCode('')
      // Put the cursor back where the next attempt happens.
      inputRef.current?.focus()
    }
    // On success the page navigates; keep the spinner until it does.
  }

  /** Digits only, however they arrive. */
  function accept(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    setCode(digits)
    // The code is the whole content of this step, so finishing it should not
    // then require finding a button.
    if (digits.length === 8 && !verifying) {
      requestAnimationFrame(() => void submit())
    }
  }

  return (
    <div role="status" aria-live="polite">
      <button
        type="button"
        onClick={onChange}
        className="login-back mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M15.833 10H4.167m0 0 5-5m-5 5 5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {hasGoogle ? 'Use a different method' : 'Use a different email'}
      </button>

      <h1 className="font-serif text-[28px] leading-[1.2] tracking-tight" style={{ color: 'var(--ink)' }}>
        Check your email
      </h1>
      <p className="mt-2 text-[15px] leading-[1.55]" style={{ color: 'var(--ink-soft)' }}>
        {alreadySent
          ? <>We already sent a code to <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{email}</strong>. It is still good.</>
          : <>We sent a code to <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{email}</strong>. It works for one hour.</>}
      </p>

      <form
        onSubmit={e => {
          e.preventDefault()
          void submit()
        }}
        className="mt-8"
        noValidate
      >
        <label htmlFor="code" className="block mb-2 text-[13px]" style={{ color: 'var(--ink)', fontWeight: 500 }}>
          Sign-in code
        </label>
        <div className="login-field">
          <input
            ref={inputRef}
            id="code"
            value={code}
            onChange={e => accept(e.target.value)}
            /* maxLength used to truncate a pasted string BEFORE the non-digit
               strip ran, so pasting a code with any surrounding text produced
               an empty field. The strip happens here instead. */
            onPaste={e => {
              e.preventDefault()
              accept(e.clipboardData.getData('text'))
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="go"
            autoFocus
            placeholder="12345678"
            aria-describedby="code-help"
            className="login-input login-input-code"
          />
        </div>
        <p id="code-help" className="mt-2 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
          Or click the link in the email. Either one works.
        </p>

        {codeError && (
          <p role="alert" className="login-error mt-4">{codeError}</p>
        )}

        <button
          type="submit"
          disabled={code.length < 6 || verifying}
          aria-busy={verifying}
          className="btn-brand mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontWeight: 500 }}
        >
          {verifying ? (
            <>
              <span className="login-spinner" />
              Verifying
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <button
        type="button"
        disabled={cooldown > 0}
        onClick={() => {
          setCooldown(60)
          void onResend()
        }}
        className="login-resend mt-5"
      >
        {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
      </button>
    </div>
  )
}
