import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('pro_waitlist')
    .upsert({ email: email.toLowerCase().trim() }, { onConflict: 'email' })

  if (error) {
    console.error('Waitlist insert error:', error.message, error.code)
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
