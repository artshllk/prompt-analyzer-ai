import type { Metadata } from 'next'
import { Geist, Geist_Mono, Instrument_Serif, Inter } from 'next/font/google'
import './globals.css'
import { PaddleProvider } from '@/components/PaddleProvider'
import { Analytics } from '@vercel/analytics/react'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

// Instrument Serif - contemporary editorial serif. Single weight (400)
// plus its italic. Crisper, more modern feel than older serif revivals.
const editorialSerif = Instrument_Serif({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
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
    site: '@deepclario',
    creator: '@deepclario',
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${editorialSerif.variable} ${inter.variable} h-full`}>
      <head>
        <link rel="alternate" type="application/rss+xml" title="Deepclario Blog RSS" href="/rss.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className="min-h-full">
        {/* Runs before first paint. Decides the home-page splash's fate
            synchronously so a returning visitor within the cooldown never
            sees it flash: if the last-shown stamp is under 10 minutes old
            (or reduced motion is on), inject a style that hides the splash
            before it can paint. Otherwise stamp "now" so the timer starts
            from this visit. Keeping this out of React avoids the pre-
            hydration paint that made the splash reappear on every refresh. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='dc:splash-seen',w=600000,n=Date.now(),l=+localStorage.getItem(k)||0,rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(rm||n-l<w){var s=document.createElement('style');s.textContent='[data-dc-splash]{display:none!important}';document.head.appendChild(s);}else{localStorage.setItem(k,String(n));}}catch(e){}})();`,
          }}
        />
        <PaddleProvider>{children}</PaddleProvider>
        <Analytics />
      </body>
    </html>
  )
}
