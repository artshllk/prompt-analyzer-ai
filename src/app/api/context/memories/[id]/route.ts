import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteMemory, updateMemory } from '@/lib/context/graph'
import type { MemoryKind, MemoryStatus } from '@/types/database'

const KINDS: MemoryKind[] = ['preference', 'fact', 'style_rule']
const STATUSES: MemoryStatus[] = ['active', 'suggested', 'archived']
const CONTENT_MAX = 200

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** Edit content, change kind, or move through the lifecycle (confirm/archive). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  let body: { content?: unknown; kind?: unknown; status?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const fields: { content?: string; kind?: MemoryKind; status?: MemoryStatus } = {}
  if (typeof body.content === 'string') {
    const content = body.content.trim().slice(0, CONTENT_MAX)
    if (!content) return NextResponse.json({ error: 'content_required' }, { status: 400 })
    fields.content = content
  }
  if (KINDS.includes(body.kind as MemoryKind)) fields.kind = body.kind as MemoryKind
  if (STATUSES.includes(body.status as MemoryStatus)) fields.status = body.status as MemoryStatus
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 })
  }

  const memory = await updateMemory(user.id, id, fields)
  if (!memory) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ memory })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  await deleteMemory(user.id, id)
  return NextResponse.json({ ok: true })
}
