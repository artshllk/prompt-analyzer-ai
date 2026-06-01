import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/ui/AppShell'

export default async function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Anonymous users can use the playground directly. PlaygroundClient
  // handles the anon branch (limited free rewrites tracked in
  // localStorage). Signed-in users get the AppShell with sidebar nav;
  // anons see a minimal marketing-style header so they have a clear
  // path back to the site and into signup.
  if (!user) {
    return (
      <div className="editorial grain min-h-screen" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
        <header
          className="border-b px-6 md:px-10 py-4 flex items-center justify-between"
          style={{ borderColor: 'var(--color-rule)' }}
        >
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Deepclario" width={28} height={28} priority />
            <span className="text-[15px] tracking-tight" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>
              Deepclario
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-sm hover:opacity-100 transition-opacity opacity-80"
              style={{ color: 'var(--color-paper)' }}
            >
              Sign in
            </Link>
            <Link
              href="/login?signup=1"
              className="px-4 py-2 rounded-full text-sm transition-all btn-paper"
              style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
            >
              Create account
            </Link>
          </div>
        </header>
        {children}
      </div>
    )
  }

  return (
    <div className="editorial grain min-h-screen" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <AppShell>{children}</AppShell>
    </div>
  )
}
