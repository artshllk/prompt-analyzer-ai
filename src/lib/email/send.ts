/**
 * Minimal Resend sender. Plain text only, on purpose: plain text gets
 * better inbox placement and reads as human because it is.
 *
 * Sending is disabled (returns false, logs once) until RESEND_API_KEY
 * and EMAIL_SECRET are set, so the cron and auth callback are safe to
 * deploy before the email service is configured.
 */

interface SendArgs {
  to: string
  subject: string
  text: string
  /** One-click unsubscribe target; becomes the List-Unsubscribe header. */
  unsubscribeUrl?: string | null
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_SECRET)
}

export async function sendEmail({ to, subject, text, unsubscribeUrl }: SendArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set; skipping send to', to)
    return false
  }

  const from = process.env.EMAIL_FROM ?? 'Deepclario <contact@deepclario.com>'
  const replyTo = process.env.EMAIL_REPLY_TO ?? 'contact@deepclario.com'

  // Gmail and Yahoo require one-click unsubscribe headers at volume;
  // they also route spam-button clicks into unsubscribes instead of
  // reputation damage.
  const headers: Record<string, string> = {}
  if (unsubscribeUrl) {
    headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        reply_to: replyTo,
        headers: Object.keys(headers).length ? headers : undefined,
      }),
    })
    if (!res.ok) {
      console.error('[email] Resend error', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[email] send failed', err)
    return false
  }
}
