'use client'

import { Suspense, useState } from 'react'
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 9.5L6 5L8.5 7L12 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-[#f0f4ff]">PromptCraft</span>
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
              <h2 className="text-lg font-bold text-[#f0f4ff] mb-2">Check your email</h2>
              <p className="text-sm text-[#8b9cc8]">
                We sent a magic link to <strong className="text-[#f0f4ff]">{email}</strong>
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#f0f4ff] mb-1">Sign in or sign up</h1>
              <p className="text-sm text-[#8b9cc8] mb-6">One link for both — we&apos;ll create your account if it&apos;s your first time.</p>

              {/* Google */}
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#1e2d4a] bg-[#0f1628] hover:bg-[#151d35] hover:border-[#2d4070] text-[#f0f4ff] text-sm font-medium transition-all mb-4"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" fill="#8b9cc8"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[#1e2d4a]" />
                <span className="text-xs text-[#4a5a80]">or</span>
                <div className="flex-1 h-px bg-[#1e2d4a]" />
              </div>

              <form onSubmit={handleMagicLink} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-[#0a0e1a] border border-[#1e2d4a] focus:border-violet-500/60 rounded-xl px-4 py-3 text-[#f0f4ff] placeholder:text-[#2d4070] text-sm outline-none transition-colors"
                />

                {error && (
                  <p className="text-xs text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
              </form>
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
