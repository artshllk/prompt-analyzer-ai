import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { sendEmail } from './send'
import type { EmailContent } from './templates'

export type SendOutcome = 'sent' | 'duplicate' | 'failed'

/**
 * Claim the dedupe key, then send. The unique constraint on
 * emails_sent.dedupe_key is the whole safety story: two concurrent
 * runs (cron + auth callback, or overlapping crons) cannot both send,
 * because only one insert wins. If the send itself fails, the claim
 * is released so the next run retries.
 */
export async function claimAndSend(
  db: SupabaseClient<Database>,
  args: {
    userId: string
    email: string
    emailType: string
    dedupeKey: string
    content: EmailContent
  }
): Promise<SendOutcome> {
  const { error } = await db.from('emails_sent').insert({
    user_id: args.userId,
    email_type: args.emailType,
    dedupe_key: args.dedupeKey,
  })

  if (error) {
    // 23505 = unique_violation: someone else already claimed it.
    if (error.code === '23505') return 'duplicate'
    console.error('[email] claim failed', args.dedupeKey, error.message)
    return 'failed'
  }

  const ok = await sendEmail({
    to: args.email,
    subject: args.content.subject,
    text: args.content.text,
    unsubscribeUrl: args.content.unsubscribeUrl,
  })

  if (!ok) {
    await db.from('emails_sent').delete().eq('dedupe_key', args.dedupeKey)
    return 'failed'
  }
  return 'sent'
}
