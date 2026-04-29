'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
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

  async function handleMagicLink(e: React.FormEvent) {
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
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl(),
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a] px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-violet-600/8 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-cyan-500/6 blur-3xl" />
      </div>

      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Image src="/logo.png" alt="Deepclario" width={32} height={32} className="rounded-md" />
          <span className="text-xl font-bold text-[#f0f4ff]">Deepclario</span>
        </div>

        <div className="glass rounded-2xl p-7 border border-[#1e2d4a]">
          <div className="-top-px left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent absolute" />

          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10L8 14L16 6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#f0f4ff] mb-2">Check your inbox</h2>
              <p className="text-sm text-[#8b9cc8]">
                We sent a sign-in link to <strong className="text-[#f0f4ff]">{email}</strong>. Click it to continue.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); setShowEmail(false) }}
                className="mt-4 text-xs text-violet-400 hover:text-violet-300 underline transition-colors"
              >
                Use a different method
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#f0f4ff] mb-1">Welcome to Deepclario</h1>
              <p className="text-sm text-[#8b9cc8] mb-6">One click to start. We&apos;ll create your account automatically.</p>

              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white hover:bg-white/95 text-[#0a0e1a] text-sm font-semibold transition-all mb-3 shadow-lg shadow-violet-500/10"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              {!showEmail ? (
                <button
                  onClick={() => setShowEmail(true)}
                  className="w-full text-center py-2.5 text-sm text-[#8b9cc8] hover:text-[#f0f4ff] transition-colors"
                >
                  Or sign in with email
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-[#1e2d4a]" />
                    <span className="text-xs text-[#4a5a80]">or with email</span>
                    <div className="flex-1 h-px bg-[#1e2d4a]" />
                  </div>
                  <form onSubmit={handleMagicLink} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      autoFocus
                      className="w-full bg-[#0a0e1a] border border-[#1e2d4a] focus:border-violet-500/60 rounded-xl px-4 py-3 text-[#f0f4ff] placeholder:text-[#2d4070] text-sm outline-none transition-colors"
                    />
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {loading ? 'Sending link...' : 'Send sign-in link'}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#4a5a80] mt-4">
          By continuing, you agree to our terms and privacy policy.
        </p>
      </motion.div>
    </div>
  )
}
