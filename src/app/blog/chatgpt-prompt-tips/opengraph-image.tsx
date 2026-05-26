import { renderOGImage, OG_SIZE } from '@/lib/og-image'

export const runtime = 'edge'
export const alt = '10 ChatGPT Prompt Tips That Actually Work - Deepclario'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return renderOGImage({
    eyebrow: 'Tips',
    title: '10 ChatGPT prompt tips that actually work',
  })
}
