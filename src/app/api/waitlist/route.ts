import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('pro_waitlist')
    .upsert({ email: email.toLowerCase().trim() }, { onConflict: 'email' })

  if (error) {
    console.error('Waitlist insert error:', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
