import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSessions } from '@/lib/db/sessions'
import { getUsageInfo } from '@/lib/db/usage'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const [{ sessions, total }, usage] = await Promise.all([
    getUserSessions(user.id, limit, offset),
    getUsageInfo(user.id),
  ])

  return NextResponse.json({ sessions, total, usage })
}
