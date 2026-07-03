import type { Metadata } from 'next'
import { EditorialPricing } from '@/components/marketing/EditorialPricing'
import { MarketingNav } from '@/components/marketing/MarketingNav'

export const metadata: Metadata = {
  title: 'Pricing – Deepclario',
  description: 'Free until you outgrow it. Pro is $4.99/month right now - a launch discount from $9.99 - for Deep Rewrite on our strongest model, unlimited rewrites and AI detection, full history, and weekly insights.',
  alternates: { canonical: 'https://deepclario.com/pricing' },
  openGraph: {
    title: 'Deepclario Pricing - Pro at $4.99/month (launch offer)',
    description: 'Launch pricing: Pro is $4.99/month, down from $9.99. Deep Rewrite on our strongest model, unlimited prompt rewrites and AI detection, full history, and weekly insights. The free plan stays free.',
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
      <MarketingNav current="pricing" />

      <section className="pt-28 md:pt-36 pb-20 md:pb-28 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <EditorialPricing />
        </div>
      </section>
    </div>
  )
}
