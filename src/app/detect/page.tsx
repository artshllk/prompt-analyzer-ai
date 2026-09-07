import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppFrame } from '@/components/ui/AppFrame'
import { DetectorClient } from '@/app/detector/detector-client'

/**
 * The detector, inside the app. The mirror of /check.
 *
 * WHY THIS EXISTS AS A SEPARATE ROUTE. /detector used to be both pages at
 * once: it read the session and rendered either the marketing layout or the
 * app shell. That made a public, indexable marketing page dynamic for
 * everybody, and it put the choice of shell inside a page, which is the
 * arrangement that made History disappear from the sidebar once already. See
 * AppFrame.
 *
 * Same shape as / and /check, deliberately, rather than a third pattern:
 * the public page keeps the public URL and its rankings, and the signed-in
 * view lives here and composes AppFrame.
 *
 * IT DOES NOT LIVE IN (app), for the same reason /check does not. That
 * group's layout sends signed-out visitors to /login, and someone arriving
 * here signed out should land on the public detector, which has the same tool
 * and needs no account.
 */

export const metadata: Metadata = {
  title: 'AI text detector',
  // Behind auth, so there is nothing here for a crawler and nothing that
  // could compete with /detector for the same words.
  robots: { index: false, follow: false },
}

export default async function DetectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Signed out goes to the public detector, not to /login. The tool is there
  // and it needs no account, so asking someone to sign in first would be a
  // wall in front of something already free.
  if (!user) redirect('/detector')

  return (
    <AppFrame>
      <main className="pt-8 md:pt-10 pb-16 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-2">AI Text Detector</p>
          <h1
            className="font-serif text-2xl md:text-3xl tracking-tight"
            style={{ color: 'var(--color-paper)', fontWeight: 400 }}
          >
            Was this written by AI ?
          </h1>

          <div className="mt-6 md:mt-8">
            <DetectorClient />
          </div>

          <p
            className="mt-14 pt-5 text-xs leading-relaxed"
            style={{ borderTop: '1px solid var(--color-rule)', color: 'var(--color-paper-mute)' }}
          >
            We never give a score out of 100. Nobody can. We show the signs we found and let you judge.
          </p>
        </div>
      </main>
    </AppFrame>
  )
}
