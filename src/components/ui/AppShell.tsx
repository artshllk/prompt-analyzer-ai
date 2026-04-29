'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import type { UsageInfo } from '@/types'
import { UsageBar } from './UsageBar'
import { useState } from 'react'
import { PaywallModal } from './PaywallModal'

const NAV_ITEMS = [
  {
    href: '/playground',
    label: 'Playground',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4H14M2 8H10M2 12H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M13 10L15 12L13 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.5 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/insights',
    label: 'Insights',
    isPro: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 12L5 8L8 10L12 5L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

interface AppShellProps {
  children: React.ReactNode
  usage?: UsageInfo
}

export function AppShell({ children, usage }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [paywallOpen, setPaywallOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-[#1e2d4a] bg-[#0a0e1a]">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#1e2d4a]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Deepclario" width={28} height={28} className="rounded-md shrink-0" />
            <span className="font-bold text-[#f0f4ff] tracking-tight">Deepclario</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
                    : 'text-[#8b9cc8] hover:bg-[#0f1628] hover:text-[#f0f4ff] border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-violet-400' : 'text-[#4a5a80] group-hover:text-[#8b9cc8]'}>
                  {item.icon}
                </span>
                {item.label}
                {item.isPro && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">
                    PRO
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: usage + settings */}
        <div className="p-4 border-t border-[#1e2d4a] space-y-4">
          {usage && (
            <UsageBar usage={usage} onUpgrade={() => setPaywallOpen(true)} />
          )}
          <div className="flex items-center justify-between">
            <Link
              href="/settings"
              className="text-xs text-[#4a5a80] hover:text-[#8b9cc8] transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs text-[#4a5a80] hover:text-[#8b9cc8] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-[#0a0e1a]">
        {children}
      </main>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  )
}
