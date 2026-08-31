import type { Metadata } from 'next'
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { PaddleProvider } from '@/components/PaddleProvider'
import { Analytics } from '@vercel/analytics/react'

/**
 * Three faces, three jobs. Self-hosted at build time by next/font, so there
 * is no render-blocking request to Google and no layout shift.
 *
 * Display  Bricolage Grotesque, 600 and 800. Has real character at large
 *          sizes without being a novelty face.
 * Body     IBM Plex Sans. Deliberately not Inter: Inter is the default of
 *          every AI product shipped in the last three years, and looking
 *          like all of them is the one thing this brand cannot afford.
 * Data     IBM Plex Mono, for anything countable. Labels, counts, the
 *          "3 added, 2 of them guesses" line, diff chrome. If a number can
 *          be checked by hand it is set in mono, which is the typographic
 *          version of the same promise.
 */
const display = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['600', '800'],
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
    default: 'Deepclario - Turn a rough prompt into a great one',
    template: '%s | Deepclario',
  },
  description: 'Paste your prompt. Deepclario spots what is missing, asks one quick question, and rewrites it so ChatGPT, Claude, and Gemini get it right the first time.',
  keywords: ['prompt improver', 'AI prompt improver', 'prompt analyzer', 'prompt engineering', 'improve AI prompts', 'ChatGPT prompts', 'better prompts', 'prompt optimization', 'how to write better prompts'],
  authors: [{ name: 'Deepclario', url: 'https://deepclario.com' }],
  creator: 'Deepclario',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://deepclario.com',
    siteName: 'Deepclario',
    title: 'Deepclario - Turn a rough prompt into a great one',
    description: 'Paste your prompt. Deepclario spots what is missing, asks one quick question, and rewrites it. Works with ChatGPT, Claude, and Gemini.',
    // OG image is auto-generated from src/app/opengraph-image.tsx (1200x630).
  },
  twitter: {
    card: 'summary_large_image',
    // No `site` or `creator`. Asserting a handle that does not exist makes
    // the card render with a broken attribution, which is worse than having
    // no attribution at all. Add them back once the account is real.
    title: 'Deepclario - Turn a rough prompt into a great one',
    description: 'Paste your prompt. Deepclario spots what is missing, asks one quick question, and rewrites it. Works with ChatGPT, Claude, and Gemini.',
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
      description: 'Deepclario is an AI prompt improver and AI text detector for ChatGPT, Claude, and Gemini.',
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
        <PaddleProvider>{children}</PaddleProvider>
        <Analytics />
      </body>
    </html>
  )
}
