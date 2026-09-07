import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppFrame } from '@/components/ui/AppFrame'

/**
 * Signed-in surfaces, so there is nothing here to index.
 *
 * robots.txt already disallows /history and /settings, but disallow only
 * stops CRAWLING. A URL that is disallowed and linked from somewhere else can
 * still be listed, as a bare URL with no snippet, because the crawler is not
 * allowed to fetch the page and find out otherwise. noindex is what actually
 * keeps them out. /check and the auth routes already do this.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <AppFrame>{children}</AppFrame>
}
