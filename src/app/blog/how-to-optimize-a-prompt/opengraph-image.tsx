import { renderOGImage, OG_SIZE } from '@/lib/og-image'

export const runtime = 'edge'
export const alt = 'How to Optimize a Prompt, Step by Step - Deepclario'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return renderOGImage({
    eyebrow: 'Prompting',
    title: 'How to optimize a prompt',
  })
}
