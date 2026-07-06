import { renderOGImage, OG_SIZE } from '@/lib/og-image'

export const runtime = 'edge'
export const alt = 'What Is a Token in AI? - Deepclario'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return renderOGImage({
    eyebrow: 'Tokens',
    title: 'What Is a Token in AI?',
  })
}
