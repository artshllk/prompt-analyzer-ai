import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIdentity, saveIdentity } from '@/lib/context/graph'
import type { ExpertiseLevel } from '@/types/database'

const LEVELS: ExpertiseLevel[] = ['beginner', 'intermediate', 'advanced', 'expert']

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const identity = await getIdentity(user.id)
  return NextResponse.json({ identity })
}

/** Confirm/edit the identity layer. Sends only the fields the user set. */
export async function PUT(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const str = (v: unknown, max = 120): string | null => {
    if (typeof v !== 'string') return null
    const t = v.trim()
    return t ? t.slice(0, max) : null
  }

  const level =
    typeof body.expertiseLevel === 'string' && LEVELS.includes(body.expertiseLevel as ExpertiseLevel)
      ? (body.expertiseLevel as ExpertiseLevel)
      : null

  const languages = Array.isArray(body.languages)
    ? body.languages.map(l => str(l, 40)).filter((l): l is string => !!l).slice(0, 8)
    : []

  await saveIdentity(user.id, {
    role: str(body.role),
    company: str(body.company),
    industry: str(body.industry),
    expertiseLevel: level,
    languages,
    toneNote: str(body.toneNote, 200),
  })

  return NextResponse.json({ identity: await getIdentity(user.id) })
}
