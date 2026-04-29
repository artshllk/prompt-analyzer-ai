import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://deepclario.com'),
  title: {
    default: 'Deepclario — AI Prompt Improver & Analyzer',
    template: '%s — Deepclario',
  },
  description: 'Deepclario analyzes your AI prompts, scores them across 5 dimensions, and rewrites them to get dramatically better results from ChatGPT, Claude, and Gemini. Free to try.',
  keywords: ['prompt improver', 'AI prompt improver', 'prompt analyzer', 'prompt engineering', 'improve AI prompts', 'ChatGPT prompt tips', 'better prompts', 'prompt optimization'],
  authors: [{ name: 'Deepclario', url: 'https://deepclario.com' }],
  creator: 'Deepclario',
  icons: {
    icon: '/logo.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://deepclario.com',
    siteName: 'Deepclario',
    title: 'Deepclario — AI Prompt Improver & Analyzer',
    description: 'Score, analyze, and improve your AI prompts. Get better results from ChatGPT, Claude, and Gemini. Free to try — no account required.',
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
