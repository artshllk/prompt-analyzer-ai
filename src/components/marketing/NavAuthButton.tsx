'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function NavAuthButton() {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSignedIn(!!user)
    })
  }, [])

  if (isSignedIn) {
    return (
      <Link
        href="/playground"
        className="inline-flex items-center px-4 py-2 rounded-full text-sm transition-all btn-paper"
        style={{
          background: 'var(--color-paper)',
          color: 'var(--color-ink)',
          fontWeight: 500,
        }}
      >
        Go to Playground
      </Link>
    )
  }

  return (
    <Link
      href="/login"
      className="btn-outline inline-flex items-center px-4 py-2 rounded-full text-sm"
      style={{
        color: 'var(--color-paper)',
        border: '1px solid var(--color-rule-strong)',
        fontWeight: 500,
        opacity: isSignedIn === null ? 0 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      Sign in
    </Link>
  )
}
