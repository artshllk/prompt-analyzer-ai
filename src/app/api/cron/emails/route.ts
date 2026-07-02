import { NextRequest, NextResponse } from 'next/server'
import { createEmailAdminClient } from '@/lib/email/admin'
import { emailConfigured } from '@/lib/email/send'
import { claimAndSend } from '@/lib/email/log'
import {
  welcomeEmail,
  nudgeNewUserEmail,
  nudgeActiveUserEmail,
  weeklyReportEmail,
  tipEmail,
  winbackEmail,
} from '@/lib/email/templates'

/**
 * Daily email decision engine. One cron, five rules, one send log.
 *
 * Cadence by design:
 * - welcome        once, minutes after sign-up (auth callback sends it;
 *                  this cron is the sweep for any that slipped through)
 * - nudge          once ever, day 2-7, variant depends on activation
 * - weekly report  Mondays, ONLY for users with sessions that week
 * - tip            Thursdays, opt-out separately, one per ISO week
 * - winback        after 14 quiet days, max twice ever
 *
 * Every send claims a unique dedupe key first, so re-runs and overlap
 * with the auth callback can never double-send.
 */

const DAY_MS = 24 * 60 * 60 * 1000
// Resend free tier is 100/day; leave headroom for the auth callback.
const MAX_SENDS_PER_RUN = 80

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!emailConfigured()) {
    return NextResponse.json({ skipped: 'email not configured' })
  }

  const db = createEmailAdminClient()
  const now = new Date()
  const day = now.getUTCDay() // 0 = Sunday, 1 = Monday, 4 = Thursday
  const week = isoWeek(now)

  const [{ data: profiles }, { data: sent }, { data: sessions }] = await Promise.all([
    db
      .from('profiles')
      .select('id, email, full_name, tier, created_at, email_weekly, email_tips')
      .eq('email_unsubscribed', false),
    db.from('emails_sent').select('user_id, email_type, dedupe_key, sent_at'),
    db
      .from('prompt_sessions')
      .select('user_id, created_at, clarity_score_before, clarity_score_after, original_prompt, id')
      .eq('status', 'completed')
      .gte('created_at', new Date(now.getTime() - 90 * DAY_MS).toISOString()),
  ])

  const sentKeys = new Set((sent ?? []).map(r => r.dedupe_key))
  const winbacks = new Map<string, { count: number; last: number }>()
  for (const r of sent ?? []) {
    if (r.email_type !== 'winback') continue
    const cur = winbacks.get(r.user_id) ?? { count: 0, last: 0 }
    winbacks.set(r.user_id, {
      count: cur.count + 1,
      last: Math.max(cur.last, new Date(r.sent_at).getTime()),
    })
  }

  const byUser = new Map<string, NonNullable<typeof sessions>>()
  for (const s of sessions ?? []) {
    const list = byUser.get(s.user_id) ?? []
    list.push(s)
    byUser.set(s.user_id, list)
  }

  let sends = 0
  const outcome = { welcome: 0, nudge: 0, weekly: 0, tip: 0, winback: 0, failed: 0 }

  async function trySend(
    user: { id: string; email: string },
    type: keyof typeof outcome & string,
    dedupeKey: string,
    content: ReturnType<typeof welcomeEmail>
  ) {
    if (sends >= MAX_SENDS_PER_RUN || sentKeys.has(dedupeKey)) return
    const result = await claimAndSend(db, {
      userId: user.id,
      email: user.email,
      emailType: type,
      dedupeKey,
      content,
    })
    if (result === 'sent') {
      sends++
      outcome[type as keyof typeof outcome]++
      sentKeys.add(dedupeKey)
    } else if (result === 'failed') {
      outcome.failed++
    }
  }

  for (const user of profiles ?? []) {
    if (sends >= MAX_SENDS_PER_RUN) break

    const createdAt = new Date(user.created_at).getTime()
    const ageDays = (now.getTime() - createdAt) / DAY_MS
    const userSessions = byUser.get(user.id) ?? []
    const weekSessions = userSessions.filter(
      s => now.getTime() - new Date(s.created_at).getTime() < 7 * DAY_MS
    )
    const lastSessionAt = userSessions.length
      ? Math.max(...userSessions.map(s => new Date(s.created_at).getTime()))
      : null

    // 1. Welcome sweep - the auth callback normally sends this.
    if (ageDays < 3) {
      await trySend(user, 'welcome', `welcome:${user.id}`, welcomeEmail(user.id, user.full_name))
    }

    // 2. Activation nudge - once ever, day 2 to 7.
    if (ageDays >= 2 && ageDays <= 7) {
      const content = userSessions.length
        ? nudgeActiveUserEmail(user.id, user.full_name)
        : nudgeNewUserEmail(user.id, user.full_name)
      await trySend(user, 'nudge', `nudge:${user.id}`, content)
    }

    // 3. Weekly report - Mondays, data-gated. Zero sessions means no
    //    email: a report saying "you did nothing" is a guilt trip.
    if (day === 1 && user.email_weekly && weekSessions.length > 0) {
      const scored = weekSessions.filter(
        s => s.clarity_score_before != null && s.clarity_score_after != null
      )
      const avgLift = scored.length
        ? Math.round(
            scored.reduce((a, s) => a + (s.clarity_score_after! - s.clarity_score_before!), 0) /
              scored.length
          )
        : 0
      const best = scored.length
        ? scored.reduce((b, s) =>
            s.clarity_score_after! - s.clarity_score_before! >
            b.clarity_score_after! - b.clarity_score_before!
              ? s
              : b
          )
        : null
      // The pattern line is the Pro insights hook, so Pro only.
      const topGap = user.tier === 'pro' ? await topGapFor(db, scored.map(s => s.id)) : null
      await trySend(
        user,
        'weekly',
        `weekly:${user.id}:${week}`,
        weeklyReportEmail(user.id, user.full_name, {
          sessionCount: weekSessions.length,
          avgLift,
          bestOriginal: best?.original_prompt ?? null,
          topGap,
        })
      )
    }

    // 4. Tip of the week - Thursdays, separate opt-out, skip week one
    //    (they already got welcome + nudge).
    if (day === 4 && user.email_tips && ageDays > 7) {
      await trySend(
        user,
        'tip',
        `tip:${user.id}:${week}`,
        tipEmail(user.id, user.full_name, weekNumber(now))
      )
    }

    // 5. Win-back - 14 quiet days, max twice, 14 days between attempts.
    if (lastSessionAt !== null && now.getTime() - lastSessionAt > 14 * DAY_MS) {
      const wb = winbacks.get(user.id) ?? { count: 0, last: 0 }
      if (wb.count < 2 && now.getTime() - wb.last > 14 * DAY_MS) {
        const scored = userSessions.filter(
          s => s.clarity_score_before != null && s.clarity_score_after != null
        )
        const best = scored.length
          ? scored.reduce((b, s) =>
              s.clarity_score_after! - s.clarity_score_before! >
              b.clarity_score_after! - b.clarity_score_before!
                ? s
                : b
            )
          : null
        await trySend(
          user,
          'winback',
          `winback:${user.id}:${wb.count + 1}`,
          winbackEmail(
            user.id,
            user.full_name,
            best ? { before: best.clarity_score_before!, after: best.clarity_score_after! } : null
          )
        )
        // Keep the in-memory count honest within this run.
        winbacks.set(user.id, { count: wb.count + 1, last: now.getTime() })
      }
    }
  }

  return NextResponse.json({ ...outcome, total: sends })
}

async function topGapFor(
  db: ReturnType<typeof createEmailAdminClient>,
  sessionIds: string[]
): Promise<string | null> {
  if (sessionIds.length === 0) return null
  const { data } = await db
    .from('prompt_improvements')
    .select('improvement_tags')
    .in('session_id', sessionIds)
  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    for (const t of row.improvement_tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return top ? humanTag(top[0]) : null
}

function humanTag(tag: string): string {
  const names: Record<string, string> = {
    context: 'the context',
    role: 'a role for the AI',
    action: 'a clear action',
    format: 'the output format',
    constraints: 'your constraints',
    examples: 'an example',
    specificity: 'the specifics',
  }
  return names[tag] ?? tag.replace(/_/g, ' ')
}

/** ISO week key like "2026-W27" for dedupe, plus a numeric week for tip rotation. */
function isoWeek(date: Date): string {
  return `${date.getUTCFullYear()}-W${String(weekNumber(date)).padStart(2, '0')}`
}

function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7)
}
