import type { Metadata } from 'next'
import { Geist, Geist_Mono, Fraunces, Inter } from 'next/font/google'
import './globals.css'
import { PaddleProvider } from '@/components/PaddleProvider'
import { Analytics } from '@vercel/analytics/react'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const fraunces = Fraunces({
  variable: '--font-serif',
  subsets: ['latin'],
  axes: ['opsz', 'SOFT'],
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
    default: 'Deepclario — A clarity tool for serious AI users',
    template: '%s | Deepclario',
  },
  description: 'Most AI failures are prompt failures. Deepclario scores what you wrote, asks the questions a senior engineer would ask, and rewrites your prompt until the model has no excuse to misunderstand you.',
  keywords: ['prompt improver', 'AI prompt improver', 'prompt analyzer', 'prompt engineering', 'improve AI prompts', 'ChatGPT prompts', 'better prompts', 'prompt optimization', 'how to write better prompts'],
  authors: [{ name: 'Deepclario', url: 'https://deepclario.com' }],
  creator: 'Deepclario',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://deepclario.com',
    siteName: 'Deepclario',
    title: 'Deepclario — A clarity tool for serious AI users',
    description: 'A clarity tool for people who use AI seriously. Score your prompt, answer what is missing, and get a rewrite that actually works.',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Deepclario logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deepclario — A clarity tool for serious AI users',
    description: 'Score your prompt, answer what is missing, get a rewrite that actually works.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full">
        <PaddleProvider>{children}</PaddleProvider>
        <Analytics />
      </body>
    </html>
  )
}
