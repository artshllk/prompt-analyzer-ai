import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://deepclario.com'),
  title: {
    default: 'Deepclario — AI Prompt Improver and Analyzer',
    template: '%s | Deepclario',
  },
  description: 'Deepclario scores your AI prompts across 5 dimensions, asks the right clarifying questions, and rewrites them to get better results from ChatGPT, Claude, and Gemini.',
  keywords: ['prompt improver', 'AI prompt improver', 'prompt analyzer', 'prompt engineering', 'improve AI prompts', 'ChatGPT prompts', 'better prompts', 'prompt optimization', 'how to write better prompts'],
  authors: [{ name: 'Deepclario', url: 'https://deepclario.com' }],
  creator: 'Deepclario',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://deepclario.com',
    siteName: 'Deepclario',
    title: 'Deepclario — AI Prompt Improver and Analyzer',
    description: 'Score, analyze, and improve your AI prompts. Get better results from ChatGPT, Claude, and Gemini.',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Deepclario logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deepclario — AI Prompt Improver',
    description: 'Score, analyze, and improve your AI prompts. Free to try.',
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
