import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFactcheckAllowance } from '@/lib/db/usage'

/**
 * The signed-in "N of M checks left" counter, for the homepage.
 *
 * WHY THIS EXISTS AS A ROUTE. The homepage used to read this during the
 * server render, which meant one Supabase auth round trip plus a profiles
 * query before it could emit a byte. That opted the busiest page on the site
 * out of static rendering entirely, so it could never be served from the CDN.
 * Everything else on that page is identical for every visitor. Moving the one
 * varying number here lets the page be prerendered and lets this be fetched
 * after paint.
 *
 * Read-only. It spends no quota and runs no model: it calls the same
 * getFactcheckAllowance() the check route enforces, so the counter cannot
 * disagree with the gate.
 *
 * Returns `null` for anonymous visitors and for anyone with no finite limit.
 * Anonymous callers are deliberately told nothing: their limit is best effort
 * and a number we cannot enforce is not one we state. See CLAUDE.md.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(null)

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single()

    const a = await getFactcheckAllowance(user.id, profile?.tier ?? 'free')
    if (a.limit === null) return NextResponse.json(null)

    return NextResponse.json({ remaining: a.remaining, limit: a.limit })
  } catch {
    // Never let a counter surface an error. The tool is the point.
    return NextResponse.json(null)
  }
}
