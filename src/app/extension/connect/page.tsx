import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IMPROVE_FREE_LIMIT } from '@/lib/limits'
import { ConnectApproveView } from './connect-approve-view'

export const metadata: Metadata = {
  title: 'Connect the extension to your Deepclario account',
  description:
    'Connect the Deepclario browser extension to your account in one click, so it uses your plan when you improve a prompt.',
  alternates: { canonical: 'https://deepclario.com/extension/connect' },
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function ExtensionConnectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/extension/connect')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, email')
    .eq('id', user.id)
    .single()

  // No token is issued here. It used to be minted on every page load, which
  // meant a refresh created another live credential the user never asked for
  // and might never see. The token is now created by the Approve click, in
  // /api/extension/issue-token - so it exists because someone chose it.

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
        <Link
          href="/"
          className="text-sm transition-all btn-text"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24">
        <p className="eyebrow mb-6">Browser extension · Account</p>
        <h1 className="display text-4xl md:text-6xl leading-tight tracking-tight" style={{ color: 'var(--color-paper)' }}>
          Connect the extension{' '}
          <span style={{ color: 'var(--color-paper-mute)' }}>to your account.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
          Signed in as <span style={{ color: 'var(--color-paper)' }}>{profile?.email ?? user.email}</span> ·{' '}
          {profile?.tier === 'pro' ? (
            <span style={{ color: 'var(--color-paper)' }}>Pro · unlimited</span>
          ) : (
            <>Free · {IMPROVE_FREE_LIMIT} improvements a month</>
          )}
        </p>

        <ConnectApproveView email={profile?.email ?? user.email ?? 'your account'} />

        <section className="mt-16 pt-10" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
            Connecting creates a code that only your extension holds. You can revoke it
            any time from Settings, and doing so signs that extension out.
          </p>
        </section>
      </main>
    </div>
  )
}
