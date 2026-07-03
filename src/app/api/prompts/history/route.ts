import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSessions } from '@/lib/db/sessions'
import { getUsageInfo } from '@/lib/db/usage'
import { HISTORY_FREE_DAYS } from '@/lib/limits'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const usage = await getUsageInfo(user.id)
  const since = usage.tier === 'pro'
    ? undefined
    : new Date(Date.now() - HISTORY_FREE_DAYS * 86_400_000).toISOString()

  const { sessions, total } = await getUserSessions(user.id, limit, offset, since)

  return NextResponse.json({ sessions, total, usage })
}
