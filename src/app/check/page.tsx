import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/ui/AppShell'
import { hasStoredHistory } from '@/lib/db/has-history'
import { getFactcheckAllowance } from '@/lib/db/usage'
import { CheckClient } from '@/components/factcheck/CheckClient'

/**
 * The checker, inside the app.
 *
 * WHY THIS EXISTS AS A SEPARATE ROUTE. The sidebar's Check item used to point
 * at "/", which lives in the (marketing) group and therefore renders the top
 * nav. Clicking Check inside the app took the sidebar away, which was the
 * navigation loop: nothing the sidebar pointed at rendered the sidebar.
 *
 * The duplicate-URL objection that collapsed /check into / does not apply. What
 * was collapsed was two PUBLIC indexable URLs. This one is behind auth and
 * noindex, so it cannot compete in search, and a marketing page plus an app
 * route sharing one component is the ordinary shape.
 *
 * IT DOES NOT LIVE IN (app). That group's layout redirects signed-out visitors
 * to /login, and a signed-out person arriving here should land on the marketing
 * page, which has the same tool and needs no account. So the shell is composed
 * here, the same way /detector does it.
 *
 * Removing the old 301 also restores every bookmark and shared link to /check,
 * which is what that redirect was protecting.
 */

export const metadata: Metadata = {
  title: 'Check your sources',
  // Behind auth, so there is nothing here for a crawler and nothing that could
  // compete with the marketing page for the same words.
  robots: { index: false, follow: false },
}

export default async function CheckPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Signed out goes to the landing page, not to /login. The tool is there and
  // it needs no account, so asking someone to sign in first would be a wall in
  // front of something already free.
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  const [hasHistory, allowance] = await Promise.all([
    hasStoredHistory(user.id),
    getFactcheckAllowance(user.id, profile?.tier ?? 'free'),
  ])

  return (
    <div
      className="editorial grain no-page-transition min-h-screen"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      <AppShell hasHistory={hasHistory}>
        <main className="pt-8 md:pt-10 pb-16 px-6 md:px-10">
          <div className="max-w-3xl mx-auto">
            <p className="eyebrow mb-2">Check</p>
            <h1
              className="font-serif text-2xl md:text-3xl tracking-tight"
              style={{ color: 'var(--ink)', fontWeight: 400 }}
            >
              Does your source really say that?
            </h1>
            {allowance.limit !== null && (
              <p
                className="mt-3 text-[14px]"
                style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
              >
                {allowance.remaining} of {allowance.limit} checks left this month
              </p>
            )}

            <div className="mt-6 md:mt-8">
              <CheckClient />
            </div>

            <p className="mt-4 text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              We open every link in your text. Do not paste private links.
            </p>
          </div>
        </main>
      </AppShell>
    </div>
  )
}
