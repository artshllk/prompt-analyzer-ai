import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addMemory, countActiveMemories, listMemories } from '@/lib/context/graph'
import { MEMORY_FREE_LIMIT } from '@/lib/limits'
import type { MemoryKind } from '@/types/database'

const KINDS: MemoryKind[] = ['preference', 'fact', 'style_rule']
const CONTENT_MAX = 200

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  return NextResponse.json({ memories: await listMemories(user.id) })
}

/** Add one memory. Free accounts hold up to MEMORY_FREE_LIMIT active memories. */
export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { kind?: unknown; content?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const kind = KINDS.includes(body.kind as MemoryKind) ? (body.kind as MemoryKind) : 'preference'
  const content = typeof body.content === 'string' ? body.content.trim().slice(0, CONTENT_MAX) : ''
  if (!content) {
    return NextResponse.json({ error: 'content_required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  if (profile?.tier !== 'pro') {
    const active = await countActiveMemories(user.id)
    if (active >= MEMORY_FREE_LIMIT) {
      return NextResponse.json(
        { error: 'memory_limit', limit: MEMORY_FREE_LIMIT },
        { status: 402 },
      )
    }
  }

  const memory = await addMemory({ userId: user.id, kind, content })
  if (!memory) {
    return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }
  return NextResponse.json({ memory })
}
