import { renderOGImage, OG_SIZE } from '@/lib/og-image'

export const runtime = 'edge'
export const alt = 'How AI Detectors Work - Deepclario'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return renderOGImage({
    eyebrow: 'AI Detection',
    title: 'How AI Detectors Work',
  })
}
