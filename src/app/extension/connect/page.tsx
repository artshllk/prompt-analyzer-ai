import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { issueTokenForCurrentUser } from '@/lib/db/api-tokens'
import { ConnectTokenView } from './connect-token-view'

export const metadata: Metadata = {
  title: 'Connect the extension to your Deepclario account',
  description:
    'Generate a one-time code to link the Deepclario browser extension to your account. Unlimited prompts on Pro, and your full usage tracked centrally.',
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

  // Issue a fresh token on every visit. Old tokens remain valid (the user
  // may have multiple browsers), and can be revoked from settings later.
  const issued = await issueTokenForCurrentUser('Browser extension')

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
          href="/dashboard"
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
            <>Free · 25 prompts / month</>
          )}
        </p>

        {issued ? (
          <ConnectTokenView token={issued.token} />
        ) : (
          <div className="mt-10 p-6 rounded-2xl" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}>
            <p style={{ color: 'var(--color-paper)' }}>
              We could not issue a token right now. Please refresh the page or try again in a minute.
            </p>
          </div>
        )}

        <section className="mt-16">
          <p className="eyebrow mb-4">How to paste it</p>
          <ol className="space-y-3 text-base leading-[1.7]" style={{ color: 'var(--color-paper-mute)' }}>
            <li>1. Open ChatGPT, Claude, or Gemini in another tab.</li>
            <li>2. Click the ✦ <span style={{ color: 'var(--color-paper)' }}>Improve prompt</span> button bottom-right.</li>
            <li>3. In the panel, click <span style={{ color: 'var(--color-paper)' }}>Connect account</span> and paste the code.</li>
          </ol>
        </section>

        <section className="mt-16 pt-10" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
            The code is shown once. If you lose it, just refresh this page to generate a new one — old codes keep working until revoked.
          </p>
        </section>
      </main>
    </div>
  )
}
