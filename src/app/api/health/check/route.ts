import { NextRequest, NextResponse } from 'next/server'
import { extractClaims } from '@/lib/factcheck/extract'
import { checkCitations } from '@/lib/factcheck/citation'
import { HEALTH_DOC, judgedCount, type HealthVerdict } from '@/lib/factcheck/health'
import { meter } from '@/lib/factcheck/providers/meter'

/**
 * Runs one tiny document all the way through, on a schedule.
 *
 * NON-200 IS THE ALERT. Vercel surfaces a failing cron in the dashboard and
 * notifies on it, so the cheapest reliable channel is simply to fail loudly
 * and let the platform do the telling. HEALTH_ALERT_WEBHOOK adds a second
 * channel when set, and its absence changes nothing about whether the failure
 * is visible.
 *
 * See lib/factcheck/health.ts for why this asserts on the result and not on a
 * status code.
 */
export const maxDuration = 120

function say(v: HealthVerdict): NextResponse {
  return NextResponse.json(v, { status: v.ok ? 200 : 500 })
}

async function shout(v: Extract<HealthVerdict, { ok: false }>): Promise<void> {
  const url = process.env.HEALTH_ALERT_WEBHOOK
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Slack and Discord both read `text`. Anything else gets the fields.
      body: JSON.stringify({
        text: `Deepclario source checker is DOWN: ${v.reason}. ${v.detail}`,
        ...v,
      }),
    })
  } catch (err) {
    // A failed alert must never turn into a passing health check.
    console.error('[health] alert webhook failed:', err)
  }
}

export async function GET(req: NextRequest) {
  /**
   * Vercel signs its own cron calls. The secret is required in production so
   * this cannot be used by anyone else to spend our budget on demand, and is
   * optional locally so it can be run by hand.
   */
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  const ms = () => Date.now() - started
  const before = meter.read().credits

  let extracted
  try {
    extracted = await extractClaims(HEALTH_DOC)
  } catch (err) {
    const v = { ok: false as const, reason: 'extract_threw', detail: String(err), ms: ms() }
    await shout(v)
    return say(v)
  }
  if (typeof extracted === 'string') {
    // The model call is the usual suspect here: an expired key or an exhausted
    // balance both land as `unavailable`.
    const v = { ok: false as const, reason: `extract_${extracted}`, detail: 'no claims were produced', ms: ms() }
    await shout(v)
    return say(v)
  }

  try {
    const run = await checkCitations(extracted.claims)
    for (const claim of extracted.claims) {
      const found = run.results.get(claim.id)
      if (found) claim.citation = found
    }
    if (run.failure) {
      const v = { ok: false as const, reason: `retrieval_${run.failure}`, detail: 'the citation axis could not run', ms: ms() }
      await shout(v)
      return say(v)
    }
  } catch (err) {
    const v = { ok: false as const, reason: 'citations_threw', detail: String(err), ms: ms() }
    await shout(v)
    return say(v)
  }

  const judged = judgedCount(extracted.claims)
  const spent = meter.read().credits - before

  /**
   * THE ASSERTION. Zero judged claims is the exact shape of the outage that
   * ran for weeks behind an HTTP 200.
   */
  if (judged === 0) {
    const v = {
      ok: false as const,
      reason: 'nothing_judged',
      detail:
        `${extracted.claims.length} claims, none reached a page. ` +
        `Outcomes: ${extracted.claims.map(c => c.citation.check).join(', ')}. ` +
        `Tavily credits spent: ${spent}.`,
      ms: ms(),
    }
    console.error(`[health] DOWN: ${v.detail}`)
    await shout(v)
    return say(v)
  }

  console.info(`[health] ok: ${judged} judged of ${extracted.claims.length} in ${ms()}ms, ${spent} credits`)
  return say({ ok: true, judged, checked: extracted.claims.length, ms: ms() })
}
