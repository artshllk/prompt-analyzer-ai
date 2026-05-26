import { renderOGImage, OG_SIZE } from '@/lib/og-image'

export const runtime = 'edge'
export const alt = 'Zero-Shot vs Few-Shot Prompting - Deepclario'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return renderOGImage({
    eyebrow: 'Fundamentals',
    title: 'Zero-shot vs few-shot prompting',
  })
}
