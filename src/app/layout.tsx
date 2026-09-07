import type { Metadata } from 'next'
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'

/**
 * Three faces, three jobs. Self-hosted at build time by next/font, so there
 * is no render-blocking request to Google and no layout shift.
 *
 * Display  Newsreader, per docs/design/DESIGN.md. IT IS LOADED WITH ITS REAL
 *          ITALIC, and that is the reason for the change. Bricolage
 *          Grotesque has no italic cut, so `font-style: italic` on the
 *          headline's accent word was a browser-synthesised oblique: a
 *          slanted roman with the wrong stroke contrast and the wrong
 *          terminals. That word is the most recognisable thing on the site
 *          and a faked italic on it is visible at a glance.
 * Body     IBM Plex Sans. Deliberately not Inter, and this survives
 *          DESIGN.md naming Inter: Inter is the default of every AI product
 *          shipped in the last three years, and looking like all of them is
 *          the one thing this brand cannot afford. The gap between Plex Sans
 *          and Inter is a hair; the gap between "ours" and "everyone's" is
 *          the brand.
 * Data     IBM Plex Mono, for anything countable. Labels, counts, the
 *          "3 added, 2 of them guesses" line, diff chrome. If a number can
 *          be checked by hand it is set in mono, which is the typographic
 *          version of the same promise. JetBrains Mono would be a lateral
 *          move and a second family to load.
 */
const display = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  // 500 for the hero, 600 for section heads. Both cuts in both styles,
  // because the italic is the whole reason this face is here.
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const body = IBM_Plex_Sans({
  variable: '--font-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

const mono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://deepclario.com'),
  title: {
    default: 'Deepclario | Check the sources in your writing',
    template: '%s | Deepclario',
  },
  description: 'Paste your article. Deepclario opens every link and checks that the page really says what you cited it for.',
  // Site-wide, so it must describe what Deepclario IS, not what it used to
  // be. Every one of these used to name the frozen prompt improver.
  keywords: ['check citations', 'link checker', 'source checker', 'fact check a blog post', 'broken citation', 'unsourced statistics', 'AI text detector'],
  authors: [{ name: 'Deepclario', url: 'https://deepclario.com' }],
  creator: 'Deepclario',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://deepclario.com',
    siteName: 'Deepclario',
    title: 'Deepclario | Check the sources in your writing',
    description: 'Paste your article. We open every link and check that the page really says it.',
    // OG image is auto-generated from src/app/opengraph-image.tsx (1200x630).
  },
  twitter: {
    card: 'summary_large_image',
    // No `site` or `creator`. Asserting a handle that does not exist makes
    // the card render with a broken attribution, which is worse than having
    // no attribution at all. Add them back once the account is real.
    title: 'Deepclario | Check the sources in your writing',
    description: 'Paste your article. We open every link and check that the page really says it.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

// Sitewide entity schema. Tells search engines Deepclario is a real
// organization with a single canonical website, which is the foundation
// for an eventual Google knowledge panel and rich-result eligibility.
const orgSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://deepclario.com/#organization',
      name: 'Deepclario',
      url: 'https://deepclario.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://deepclario.com/logo.png',
        width: 1254,
        height: 1254,
      },
      sameAs: [
        'https://twitter.com/deepclario',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://deepclario.com/#website',
      url: 'https://deepclario.com',
      name: 'Deepclario',
      description: 'Deepclario checks the links in your writing. It opens every link and checks whether that page really says the number you put next to it, and lists the numbers with no source at all.',
      publisher: { '@id': 'https://deepclario.com/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://deepclario.com/prompts?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} h-full`}>
      <head>
        <link rel="alternate" type="application/rss+xml" title="Deepclario Blog RSS" href="/rss.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className="min-h-full">
        {/* The render-blocking splash script that used to sit here is gone
            with the splash itself. It existed to stop the overlay flashing
            for returning visitors, which is a problem worth solving only if
            the overlay is worth having. It was not: a 2.2s logo animation
            was the first thing every first-time visitor met, and the first
            visit is the only one where the cooldown never applies. */}
        {/* PaddleProvider is NOT here any more. It is a client component
            that pulls Paddle.js from an external CDN in an effect, so wrapping
            the root layout loaded a checkout script on all 56 blog posts, the
            FAQ, the prompt library and the legal pages, where nothing can be
            bought. It now sits at the two places that can actually check out:
            AppShell, which carries the sidebar upgrade button on every app
            route, and /pricing. Both are the only ancestors of every
            useCheckout() caller. */}
        {children}
        <Analytics />
      </body>
    </html>
  )
}
