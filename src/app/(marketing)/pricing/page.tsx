import type { Metadata } from 'next'
import { EditorialPricing } from '@/components/marketing/EditorialPricing'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { defaultOGImage } from '@/lib/og-image'

export const metadata: Metadata = {
  title: 'Pricing - Free Plan and Pro at $4.99/month',
  description: 'Free until you outgrow it. Pro is $4.99/month right now, a launch discount from $9.99, for unlimited improvements, a stronger model on every one, and full history.',
  alternates: { canonical: 'https://deepclario.com/pricing' },
  openGraph: {
    title: 'Deepclario Pricing - Pro at $4.99/month (launch offer)',
    description: 'Launch pricing: Pro is $4.99/month, down from $9.99. Unlimited improvements, a stronger model on every one, and full history. The free plan stays free.',
    url: 'https://deepclario.com/pricing',
    type: 'website',
    // Same bug as the homepage - see defaultOGImage() and (marketing)/page.tsx.
    images: defaultOGImage('Deepclario Pricing - Pro at $4.99/month (launch offer)'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deepclario Pricing - Pro at $4.99/month (launch offer)',
    description: 'Launch pricing: Pro is $4.99/month, down from $9.99. Unlimited everything for people who reach for Deepclario daily.',
    images: ['/opengraph-image'],
  },
}

// Structured data: both plans as offers so the page is eligible for price
// rich results. Prices must match LAUNCH in EditorialPricing.tsx.
const pricingSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Deepclario',
      url: 'https://deepclario.com',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      publisher: { '@id': 'https://deepclario.com/#organization' },
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
          description: '10 prompt improvements a day, no card required.',
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '4.99',
          priceCurrency: 'USD',
          description: 'Unlimited improvements, a stronger model on every one, and full history. Launch price, down from $9.99/month.',
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deepclario.com' },
        { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://deepclario.com/pricing' },
      ],
    },
  ],
}

export default function PricingPage() {
  return (
    <div className="editorial grain min-h-screen relative" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }} />
      <MarketingNav current="pricing" />

      <section className="pt-28 md:pt-36 pb-20 md:pb-28 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <EditorialPricing headingLevel="h1" />
        </div>
      </section>
    </div>
  )
}
