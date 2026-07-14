import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recallMemory, forgetMemory, forgetAll } from '@/lib/db/memory'

/**
 * What we remember about you, and how to make us forget.
 *
 * A memory feature people cannot see or delete is a liability, not a benefit.
 * Everything the engine has learned about a user is listed here in plain
 * words, and any of it can be removed in one click.
 */

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const memory = await recallMemory(user.id)
  return NextResponse.json({ memory })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const label = req.nextUrl.searchParams.get('label')

  if (label) await forgetMemory(user.id, label)
  else await forgetAll(user.id)

  return NextResponse.json({ ok: true })
}
