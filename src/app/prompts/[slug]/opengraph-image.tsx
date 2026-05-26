import { renderOGImage, OG_SIZE } from '@/lib/og-image'
import { getPromptEntry } from '@/lib/prompt-library'

export const alt = 'Deepclario - Free Prompt'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getPromptEntry(slug)
  return renderOGImage({
    eyebrow: entry ? `${entry.category} · Free prompt` : 'Free prompt',
    title: entry?.heading ?? 'Free ChatGPT prompt',
  })
}
