import { NextRequest, NextResponse } from 'next/server'
import { take, ANON_LIMIT, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed } = take(`email-capture:${ip}`, ANON_LIMIT)
  if (!allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  // Future: persist to a leads table or send to an email service (Resend, etc.)
  // For now we just validate and return success so the client can grant extra analyses
  // Structure is ready for: await saveLeadEmail(email)

  return NextResponse.json({ ok: true, extraAnalyses: 3 })
}
