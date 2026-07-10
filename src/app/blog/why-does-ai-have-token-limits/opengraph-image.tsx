import { renderOGImage, OG_SIZE } from '@/lib/og-image'

export const runtime = 'edge'
export const alt = 'Why Does AI Have Token Limits? - Deepclario'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return renderOGImage({
    eyebrow: 'Tokens',
    title: 'Why does AI have token limits?',
  })
}
