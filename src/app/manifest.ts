import type { MetadataRoute } from 'next'

// Web app manifest (served at /manifest.webmanifest and auto-linked in
// <head>). Colors match --color-ink in globals.css.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Deepclario - AI Prompt Improver',
    short_name: 'Deepclario',
    description:
      'Paste a bad prompt and get a sharper version in seconds. Works with ChatGPT, Claude, and Gemini.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0E0E10',
    theme_color: '#0E0E10',
    icons: [
      { src: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/logo.png', sizes: '1254x1254', type: 'image/png', purpose: 'any' },
    ],
  }
}
