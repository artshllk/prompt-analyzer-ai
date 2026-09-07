import type { Metadata } from 'next'
import { EditorialPricing } from '@/components/marketing/EditorialPricing'
import { PaddleProvider } from '@/components/PaddleProvider'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { defaultOGImage } from '@/lib/og-image'
import { foundingSeatsLeft } from '@/lib/paddle'
import {
  FACTCHECK_FREE_LIMIT,
  PRO_FACTCHECK_LIMIT,
  PRO_DETECT_LIMIT,
  IMPROVE_PRO_LIMIT,
} from '@/lib/limits'

/**
 * Every sentence here described the frozen prompt improver at a price that no
 * longer exists. It is the source checker that is being sold now, and this is
 * what a search result and a shared link show.
 */
export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Check the sources in a document before you send it. Free to try, Pro is $19 a month, and the first fifty subscribers keep $12 for good.',
  alternates: { canonical: 'https://deepclario.com/pricing' },
  openGraph: {
    title: 'Deepclario Pricing - source checking from $12 a month',
    description:
      'Paste a document and see which claims their source really supports. Free to try. Pro is $19 a month, $12 for the first fifty.',
    url: 'https://deepclario.com/pricing',
    type: 'website',
    // Same bug as the homepage - see defaultOGImage() and (marketing)/page.tsx.
    images: defaultOGImage('Deepclario Pricing - source checking from $12 a month'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deepclario Pricing - source checking from $12 a month',
    description:
      'Paste a document and see which claims their source really supports. Free to try, Pro is $19 a month.',
    images: ['/opengraph-image'],
  },
}

// Structured data: both plans as offers so the page is eligible for price
// rich results. The allowances read from the constants the server enforces,
// for the same reason the pricing table does. Google shows these numbers to
// people who never reach the page, so a stale one here is worse than a stale
// one there.
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
          description: `${FACTCHECK_FREE_LIMIT} source checks a month, no card required.`,
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '19',
          priceCurrency: 'USD',
          description: `${PRO_FACTCHECK_LIMIT} source checks a month, ${IMPROVE_PRO_LIMIT} prompt improvements, ${PRO_DETECT_LIMIT} AI text detections, and history kept forever.`,
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

/**
 * REGENERATED ON A TIMER, NOT PER REQUEST.
 *
 * This page used to await viewerPlan() and foundingSeatsLeft() on every
 * render: one Postgres round trip and one call out to Paddle, for every
 * visitor and every crawl. viewerPlan() reads cookies, so it also forced the
 * whole route dynamic, which is what made the Paddle call per-request in the
 * first place.
 *
 * viewerPlan() moved into EditorialPricing, which fetches it after paint.
 * The Paddle count stays on the server, because it decides the PRICE on
 * screen and a price that changes after paint is worse than a stale one.
 * With the cookie read gone the page can be statically regenerated, so
 * Paddle is called once every five minutes instead of once per visitor.
 *
 * Five minutes is a deliberate ceiling on how stale the founding-seat count
 * can get. Overselling by a few seats is not a problem: the checkout price
 * comes from Paddle, not from this page.
 */
export const revalidate = 300

export default async function PricingPage() {
  /**
   * Counted at Paddle, so the price on screen is the price the checkout
   * will charge. It fails closed: if Paddle cannot be reached this reads
   * zero and the page shows the ordinary price rather than one it cannot
   * honour.
   */
  const foundingLeft = await foundingSeatsLeft()
  return (
    <div className="editorial grain min-h-screen relative" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }} />
      <MarketingNav current="pricing" />

      <section className="pt-28 md:pt-36 pb-20 md:pb-28 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          {/* The other place a checkout can start. Paddle.js used to load
              from the root layout on every page on the site; it is scoped to
              the two surfaces that can actually take money. */}
          <PaddleProvider>
            <EditorialPricing headingLevel="h1" foundingLeft={foundingLeft} />
          </PaddleProvider>
        </div>
      </section>
    </div>
  )
}
