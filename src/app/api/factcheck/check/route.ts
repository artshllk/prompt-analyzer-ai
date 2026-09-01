import { NextRequest, NextResponse } from 'next/server'
import { take, getClientIp, ANON_LIMIT, USER_LIMIT, PRO_USER_LIMIT } from '@/lib/rate-limit'
import { resolveCaller } from '@/lib/auth/caller'
import { consumeAnonRun } from '@/lib/db/anon-budget'
import { extractClaims } from '@/lib/factcheck/extract'
import { streamCitations } from '@/lib/factcheck/citation'
import { rankFlags } from '@/lib/factcheck/flags'
import { meter } from '@/lib/factcheck/providers/meter'
import { MAX_DOC_CHARS } from '@/lib/factcheck/types'

/**
 * Extract, then check, streamed as NDJSON.
 *
 * ONE LINE OF JSON PER EVENT, newline delimited, in the order the reader
 * should learn about them. The first line carries every claim at once, so the
 * document is on screen and marked within a few seconds and there is never a
 * blank page behind a spinner. Everything after that resolves one claim at a
 * time.
 *
 * Headers are copied from sharpen/route.ts, which already had to solve
 * buffering on this platform: no-transform stops a proxy rewriting the body,
 * and X-Accel-Buffering: no stops nginx holding chunks until the end, which
 * would turn a stream back into one slow response.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

function json(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  const who = await resolveCaller(req)
  if (who.state === 'unknown') return json({ error: 'identity_unavailable' }, 503)
  const auth = who.state === 'known' ? who.caller : null

  if (!auth) {
    const limit = take(`factcheck:anon:${getClientIp(req)}`, ANON_LIMIT)
    if (!limit.allowed) return json({ error: 'rate_limited', retryAfterMs: limit.retryAfterMs }, 429)
  } else {
    const burst = take(
      `factcheck:user:${auth.userId}`,
      auth.tier === 'pro' ? PRO_USER_LIMIT : USER_LIMIT
    )
    if (!burst.allowed) return json({ error: 'rate_limited', retryAfterMs: burst.retryAfterMs }, 429)
  }

  let body: { text?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_body' }, 400)
  }
  const text = typeof body.text === 'string' ? body.text : ''
  if (!text.trim()) return json({ error: 'empty' }, 400)
  if (text.length > MAX_DOC_CHARS) {
    return json({ error: 'too_long', limit: MAX_DOC_CHARS, got: text.length }, 400)
  }

  if (!auth) {
    const budget = await consumeAnonRun('factcheck')
    if (!budget.allowed) return json({ error: 'daily_capacity', resetAt: budget.resetAt }, 429)
  }

  // Extraction happens BEFORE the stream opens, because its failure modes are
  // ordinary HTTP ones and a 400 is far more useful to a client than a stream
  // whose first line is an error.
  let extracted
  try {
    extracted = await extractClaims(text)
  } catch (err) {
    console.error('[factcheck] extract threw:', err)
    return json({ error: 'unavailable' }, 503)
  }
  if (typeof extracted === 'string') {
    return json({ error: extracted }, extracted === 'unavailable' ? 503 : 400)
  }

  const result = extracted
  const spentBefore = meter.read().credits
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      }
      let closed = false
      try {
        // Everything, at once, marked not checked. The document is readable
        // and complete from the first line of the stream.
        send({
          type: 'claims',
          text: result.text,
          claims: result.claims,
          density: result.density,
          truncated: result.truncated,
          foundCount: result.foundCount,
        })

        for await (const event of streamCitations(result.claims)) {
          // The client can vanish at any point. Writing to a closed controller
          // throws, and the loop must stop rather than keep paying a provider
          // for a document nobody is reading.
          if (req.signal.aborted) { closed = true; break }
          send(event)
        }

        if (!closed) {
          send({ type: 'done', flags: rankFlags(result.claims, result.text.length).fired })
        }
      } catch (err) {
        console.error('[factcheck] stream failed:', err)
        try {
          send({ type: 'failed', failure: 'unavailable' })
        } catch {
          // Client already gone. Nothing to tell.
        }
      } finally {
        /**
         * IN FINALLY, NEVER ON THE SUCCESS PATH.
         *
         * The case this exists for is the user closing the tab mid-stream, and
         * that is exactly when the success path does not run. Anything that
         * has to happen once per document, spend accounting included, belongs
         * here or it silently stops happening for every abandoned run.
         *
         * WHAT THIS DOES NOT DO YET, stated plainly rather than implied by the
         * word "settle": the anonymous budget is one unit per DOCUMENT, so
         * there is no partial amount to settle down to. A real settle-down
         * needs the cents ledger, which reserves a pessimistic estimate and
         * then applies a signed delta that is never positive. That is not
         * built. Until it is, an abandoned run costs its document unit and the
         * line below records what it actually cost in credits, which is the
         * number that would drive the ledger when it lands.
         *
         * Deliberately NOT a refund. A refund path can drive the counter
         * negative and hand out free credit, and a limiter a script can walk
         * past is not a cost control.
         */
        const spent = meter.read().credits - spentBefore
        console.log(
          `[factcheck] claims=${result.claims.length}/${result.foundCount} ` +
            `band=${result.density.band} credits=${spent} aborted=${req.signal.aborted} ` +
            `auth=${auth ? auth.tier : 'anon'} ts=${new Date().toISOString()}`
        )
        try {
          controller.close()
        } catch {
          // Already closed by the client disconnecting.
        }
      }
    },
  })

  return new NextResponse(stream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
