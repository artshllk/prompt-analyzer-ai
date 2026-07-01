import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { EditorialPricing } from '@/components/marketing/EditorialPricing'

export const metadata: Metadata = {
  title: 'Pricing – Deepclario',
  description: 'Free until you outgrow it. Pro is $4.99/month right now - a launch discount from $9.99 - for unlimited rewrites, unlimited AI detection, full history, and weekly insights.',
  alternates: { canonical: 'https://deepclario.com/pricing' },
  openGraph: {
    title: 'Deepclario Pricing - Pro at $4.99/month (launch offer)',
    description: 'Launch pricing: Pro is $4.99/month, down from $9.99. Unlimited prompt rewrites, unlimited AI detection, full history, and weekly insights. The free plan stays free.',
    url: 'https://deepclario.com/pricing',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deepclario Pricing - Pro at $4.99/month (launch offer)',
    description: 'Launch pricing: Pro is $4.99/month, down from $9.99. Unlimited everything for people who reach for Deepclario daily.',
  },
}

export default function PricingPage() {
  return (
    <div className="editorial grain min-h-screen relative" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md" style={{ background: 'rgba(14,14,16,0.72)', borderBottom: '1px solid var(--color-rule)' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Deepclario" width={28} height={28} priority />
            <span className="text-[15px] tracking-tight" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>Deepclario</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
            <Link href="/#try" className="hover:opacity-100 transition-opacity opacity-80">Try it</Link>
            <Link href="/#use-cases" className="hover:opacity-100 transition-opacity opacity-80">Use cases</Link>
            <Link href="/prompts" className="hover:opacity-100 transition-opacity opacity-80">Prompts</Link>
            <Link href="/extension" className="hover:opacity-100 transition-opacity opacity-80">Extension</Link>
            <Link href="/pricing" className="opacity-100 transition-opacity" style={{ color: 'var(--color-paper)' }}>Pricing</Link>
            <Link href="/#faq" className="hover:opacity-100 transition-opacity opacity-80">FAQ</Link>
            <Link href="/blog" className="hover:opacity-100 transition-opacity opacity-80">Blog</Link>
          </nav>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-sm hover:opacity-100 transition-opacity opacity-80" style={{ color: 'var(--color-paper)' }}>
              Sign in
            </Link>
            <Link
              href="/playground"
              className="px-4 py-2 rounded-full text-sm transition-all btn-paper"
              style={{
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                fontWeight: 500,
              }}
            >
              Try free
            </Link>
          </div>
        </div>
      </header>

      <section className="pt-28 md:pt-36 pb-20 md:pb-28 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <EditorialPricing />
        </div>
      </section>
    </div>
  )
}
