import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PlaygroundClient } from '@/components/playground/PlaygroundClient'
import { getUsageInfo } from '@/lib/db/usage'
import { defaultOGImage } from '@/lib/og-image'

export const metadata: Metadata = {
  title: 'Prompt Playground - Improve Any AI Prompt Free',
  description: 'Paste a rough prompt and get a sharper version in seconds. Deepclario scores it, asks what is missing, and rewrites it for ChatGPT, Claude, and Gemini. Free, no account needed.',
  alternates: { canonical: 'https://deepclario.com/playground' },
  openGraph: {
    title: 'Prompt Playground - Improve Any AI Prompt Free',
    description: 'Paste a rough prompt, get a sharper one in seconds. Works with ChatGPT, Claude, and Gemini.',
    url: 'https://deepclario.com/playground',
    type: 'website',
    // Pages with their own openGraph object need an explicit image - see
    // defaultOGImage() for why the file-convention fallback doesn't apply.
    images: defaultOGImage('Prompt Playground - Deepclario'),
  },
}

export default async function PlaygroundPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isSignedIn = !!user
  const usage = isSignedIn && user ? await getUsageInfo(user.id) : undefined
  return <PlaygroundClient isSignedIn={isSignedIn} usage={usage} />
}
