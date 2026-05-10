'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import type { UsageInfo } from '@/types'
import { useEffect, useState } from 'react'

const NAV_ITEMS: { href: string; label: string; isPro?: boolean }[] = [
  { href: '/playground', label: 'Playground' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/history', label: 'History' },
  { href: '/insights', label: 'Insights', isPro: true },
]

interface AppShellProps {
  children: React.ReactNode
  // Kept on the prop type for compatibility with existing callers; unused for now
  // since the sidebar no longer renders a usage meter (limits surface contextually).
  usage?: UsageInfo
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen relative" style={{ background: 'var(--color-ink)' }}>
      {/* Mobile top bar */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3.5"
        style={{
          background: 'rgba(14,14,16,0.85)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--color-rule)',
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Deepclario" width={26} height={26} priority />
          <span className="text-[15px] tracking-tight" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>
            Deepclario
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          className="p-2 -mr-2 btn-icon"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6H17M3 14H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-30"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky md:top-0 z-40 md:z-auto
          w-64 md:w-60 shrink-0
          h-screen md:h-screen
          flex flex-col
          transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          background: 'var(--color-ink)',
          borderRight: '1px solid var(--color-rule)',
        }}
      >
        {/* Logo (desktop only — mobile uses top bar) */}
        <div className="hidden md:block px-6 py-6" style={{ borderBottom: '1px solid var(--color-rule)' }}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Deepclario" width={32} height={32} priority />
            <span className="text-[15px] tracking-tight" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>
              Deepclario
            </span>
          </Link>
        </div>

        {/* Spacer for mobile (top bar height) */}
        <div className="md:hidden h-16" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-5">
          <ul className="space-y-px">
            {NAV_ITEMS.map(item => {
              const isActive = pathname.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative flex items-center justify-between gap-3 pl-5 pr-3 py-2.5 text-[14px] nav-item-hover"
                    style={{
                      color: isActive ? 'var(--color-paper)' : 'var(--color-paper-mute)',
                      fontWeight: isActive ? 500 : 400,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.color = 'var(--color-paper)'
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.color = 'var(--color-paper-mute)'
                    }}
                  >
                    {/* Active indicator: hairline bar on the left */}
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5"
                        style={{ background: 'var(--color-paper)' }}
                      />
                    )}
                    <span>{item.label}</span>
                    {item.isPro && (
                      <span
                        className="text-[10px] tracking-[0.16em] uppercase"
                        style={{ color: 'var(--color-paper-mute)' }}
                      >
                        Pro
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom: just settings + sign out. No usage meter — limits surface contextually. */}
        <div className="p-5" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="flex items-center justify-between text-[12px]">
            <Link
              href="/settings"
              className="transition-opacity hover:opacity-100"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="transition-opacity hover:opacity-100"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Push down on mobile to clear the top bar */}
        <div className="md:hidden h-16" />
        {children}
      </main>

    </div>
  )
}
