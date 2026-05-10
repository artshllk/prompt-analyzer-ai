'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'
  const errorFromUrl = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(errorFromUrl ?? '')
  const [showEmail, setShowEmail] = useState(false)

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
        setError("We couldn't send the link. Try Google instead.")
      } else {
        setError('Something went sideways on our end. Try again.')
      }
    } else {
      setSent(true)
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    })
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
          <SentState email={email} onChange={() => { setSent(false); setEmail(''); setShowEmail(false) }} />
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

            {/* Google button — paper-on-ink, calm */}
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-full text-[15px] transition-all btn-paper"
              style={{
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                fontWeight: 500,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <p className="mt-2 text-sm text-center text-slate-400">Secure authentication powered by Google</p>

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
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-5">
                  <span className="flex-1 h-px" style={{ background: 'var(--color-rule)' }} />
                  <span className="eyebrow">Email</span>
                  <span className="flex-1 h-px" style={{ background: 'var(--color-rule)' }} />
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoFocus
                    className="w-full px-0 py-3 text-base focus:outline-none transition-colors"
                    style={{
                      background: 'transparent',
                      color: 'var(--color-paper)',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      borderBottom: '1px solid var(--color-rule-strong)',
                      borderRadius: 0,
                      fontFamily: 'var(--font-inter)',
                    }}
                  />
                  {error && (
                    <p className="text-xs" style={{ color: '#C25E5E' }}>{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full py-3 rounded-full text-[14px] transition-all btn-outline disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'transparent',
                      color: 'var(--color-paper)',
                      border: '1px solid var(--color-rule-strong)',
                      fontWeight: 500,
                    }}
                  >
                    {loading ? 'Sending link…' : 'Send sign-in link'}
                  </button>
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

function SentState({ email, onChange }: { email: string; onChange: () => void }) {
  return (
    <div>
      <p className="eyebrow mb-4" style={{ color: 'var(--color-accent)' }}>Link sent</p>
      <h1 className="display text-4xl mb-4" style={{ color: 'var(--color-paper)' }}>
        Check your inbox.
      </h1>
      <p className="text-base leading-[1.55] mb-2" style={{ color: 'var(--color-paper-mute)' }}>
        We sent a sign-in link to{' '}
        <span style={{ color: 'var(--color-paper)' }}>{email}</span>.
      </p>
      <p className="text-sm leading-[1.55] mb-8" style={{ color: 'var(--color-paper-mute)' }}>
        Click it to continue. The link works once and expires in an hour.
      </p>
      <button
        onClick={onChange}
        className="text-sm underline-offset-4 hover:underline transition-all"
        style={{ color: 'var(--color-paper)' }}
      >
        Use a different method
      </button>
    </div>
  )
}
