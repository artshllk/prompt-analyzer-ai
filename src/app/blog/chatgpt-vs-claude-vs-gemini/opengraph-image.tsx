import { renderOGImage, OG_SIZE } from '@/lib/og-image'

export const runtime = 'edge'
export const alt = 'ChatGPT vs Claude vs Gemini - Deepclario'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return renderOGImage({
    eyebrow: 'AI Models',
    title: 'ChatGPT vs Claude vs Gemini',
  })
}
