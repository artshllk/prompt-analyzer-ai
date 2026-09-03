/**
 * Tell the owner something happened, when nobody is watching the logs.
 *
 * ONE CHANNEL, SET BY ONE ENVIRONMENT VARIABLE, AND SILENT WITHOUT IT. There
 * is no email sender in this codebase and no reason to add one back for
 * operational messages, so this posts to whatever webhook URL is configured -
 * Slack and Discord both read `text` - and does nothing at all when none is.
 *
 * Every caller must be able to run with alerting switched off, so this never
 * throws and never blocks a decision. A failed alert is logged and swallowed:
 * turning "we could not tell you" into "the request failed" would make the
 * monitoring worse than not having it.
 */
export async function alertOps(headline: string, detail: string): Promise<boolean> {
  const url = process.env.HEALTH_ALERT_WEBHOOK
  if (!url) return false
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `${headline} ${detail}`, headline, detail }),
    })
    if (!res.ok) console.error(`[alert] webhook returned ${res.status}`)
    return res.ok
  } catch (err) {
    console.error('[alert] webhook failed:', (err as Error).message)
    return false
  }
}
