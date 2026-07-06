import { renderOGImage, OG_SIZE } from '@/lib/og-image'

export const runtime = 'edge'
export const alt = 'Detecting ChatGPT, Claude, and Gemini Text - Deepclario'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return renderOGImage({
    eyebrow: 'AI Detection',
    title: 'Detecting ChatGPT, Claude, and Gemini',
  })
}
