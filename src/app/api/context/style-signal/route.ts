import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordStyleSignal } from '@/lib/context/graph'

/**
 * Capture one accepted-output signal for the Style layer: the AI draft
 * paired with the version the user actually used. Pro-only - the learned
 * Style layer is a paid capability, so we only collect the signal for
 * users who can benefit from it.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()
  if (profile?.tier !== 'pro') {
    return NextResponse.json({ error: 'pro_required' }, { status: 402 })
  }

  let body: { aiDraft?: unknown; userFinal?: unknown; sessionId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const aiDraft = typeof body.aiDraft === 'string' ? body.aiDraft : ''
  const userFinal = typeof body.userFinal === 'string' ? body.userFinal : ''
  if (!aiDraft.trim() || !userFinal.trim()) {
    return NextResponse.json({ error: 'missing_text' }, { status: 400 })
  }
  // No signal in an untouched copy - only store real accept/edit deltas
  // plus the occasional verbatim accept (still evidence of "good as-is").
  if (aiDraft.length > 20000 || userFinal.length > 20000) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 })
  }

  await recordStyleSignal({
    userId: user.id,
    sessionId: typeof body.sessionId === 'string' ? body.sessionId : null,
    aiDraft,
    userFinal,
    source: 'web',
  })

  return NextResponse.json({ ok: true })
}
