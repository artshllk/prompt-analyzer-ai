import { NextRequest, NextResponse } from 'next/server'

/**
 * Stated, not inherited. A full-size document measures at about 43 seconds end
 * to end: 35 for extraction, the rest for the citation checks. The platform
 * default happens to be 300 today, but a ceiling this route depends on should
 * be readable in this file rather than looked up.
 */
export const maxDuration = 300

/**
 * Our own ceiling, deliberately below the platform's.
 *
 * The difference between the two is the entire point. At 300 the platform
 * kills the function and the reader gets nothing, however much had already
 * resolved. At 240 we stop ourselves with sixty seconds spare, keep every
 * result we have, and say what we did not get to.
 *
 * Measured end to end on a dense 20-claim document: 42 seconds, 35 of it
 * extraction. So this is not a limit anything normal comes near. It is the
 * floor under the bad case.
 */
const DEADLINE_MS = 240_000
import {
  take,
  getClientIp,
  ANON_LIMIT,
  ANON_FACTCHECK_DAY,
  USER_LIMIT,
  PRO_USER_LIMIT,
} from '@/lib/rate-limit'
import { resolveCaller } from '@/lib/auth/caller'
import { consumeAnonRun } from '@/lib/db/anon-budget'
import { alertOps } from '@/lib/alert'
import { getFactcheckAllowance, recordFactcheckUsage } from '@/lib/db/usage'
import { extractClaims } from '@/lib/factcheck/extract'
import { streamCitations } from '@/lib/factcheck/citation'
import { rankFlags } from '@/lib/factcheck/flags'
import { groupFindings } from '@/lib/factcheck/severity'
import { meter } from '@/lib/factcheck/providers/meter'
import { MAX_DOC_CHARS, type CitationResult, type UncheckedReason } from '@/lib/factcheck/types'
import { visibleLength } from '@/lib/factcheck/paste'

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
  const requestStart = Date.now()
  const who = await resolveCaller(req)
  if (who.state === 'unknown') return json({ error: 'identity_unavailable' }, 503)
  const auth = who.state === 'known' ? who.caller : null

  if (!auth) {
    const ip = getClientIp(req)
    const limit = take(`factcheck:anon:${ip}`, ANON_LIMIT)
    if (!limit.allowed) return json({ error: 'rate_limited', retryAfterMs: limit.retryAfterMs }, 429)

    // 2 a day per IP. In memory, so best effort: an instance that recycles
    // forgets it. The global bucket below is what actually bounds the bill.
    const daily = take(`factcheck:anon:day:${ip}`, ANON_FACTCHECK_DAY)
    if (!daily.allowed) {
      return json({ error: 'anon_daily_limit', retryAfterMs: daily.retryAfterMs }, 429)
    }
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
  // Same measure as the counter under the box. See extract.ts.
  const visible = visibleLength(text)
  if (visible > MAX_DOC_CHARS) {
    return json({ error: 'too_long', limit: MAX_DOC_CHARS, got: visible }, 400)
  }

  if (!auth) {
    const budget = await consumeAnonRun('factcheck')
    if (!budget.allowed) {
      /**
       * A DAY WHERE VISITOR 41 IS TURNED AWAY IS A DAY WORTH KNOWING ABOUT.
       *
       * A silent refusal and no demand look identical from the outside, and
       * they are opposite problems: one says spend more, the other says the
       * product is not landing. Reading them the same way is how a good day
       * gets mistaken for a bad one.
       *
       * Fires on the FIRST refusal only. `used` is the post-increment count
       * from an atomic RPC, so exactly one request in the day sees cap + 1,
       * however many instances are running. The failure branches of
       * consumeAnonRun return `used: cap`, which means a database outage
       * refusing everyone does not masquerade as demand.
       */
      if (budget.used === budget.cap + 1) {
        console.error(`[factcheck] daily cap ${budget.cap} reached`)
        await alertOps(
          `Deepclario hit its daily free cap of ${budget.cap} checks.`,
          `Anonymous visitors are being turned away until ${budget.resetAt}. ` +
            `Raise FACTCHECK_DAILY_CAP if this is real demand rather than a script.`
        )
      }
      return json({ error: 'daily_capacity', resetAt: budget.resetAt }, 429)
    }
  } else {
    /**
     * THE PER-USER CEILING, and until now there was none.
     *
     * consumeAnonRun only ran when there was no auth, so a signed-in caller
     * passed straight through to the model with nothing counting. One account
     * could have run five hundred documents. That is unbounded cost per user
     * and it becomes real the first time somebody signs up.
     *
     * The count itself happens in `finally`, which runs on an abort too, so
     * it is still not something a closed tab can dodge. What it is NOT is
     * unconditional: see the note there.
     */
    const serviceRole = auth.via === 'token'
    const allowance = await getFactcheckAllowance(auth.userId, auth.tier, serviceRole)
    if (allowance.isAtLimit) {
      return json(
        {
          error: auth.tier === 'pro' ? 'pro_monthly_limit' : 'free_monthly_limit',
          limit: allowance.limit,
        },
        429
      )
    }
    // Recorded in `finally` below, not here. See the note there.
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
    // too_short, too_long and too_dense are all about the document, so 400.
    // Only `unavailable` is us failing, and that is the one 503.
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
          duplicates: result.duplicates,
          linkCount: result.linkCount,
        })

        /**
         * WHAT RESOLVES GETS KEPT, ALWAYS.
         *
         * The claims we hold here are the ones the counters are computed
         * from, and until now nothing ever wrote a result back onto them.
         * Every `done` said `flags: 0` on every document, including the ones
         * that found things, so the one number that says whether the product
         * works has never been true.
         */
        const claims = result.claims
        const byId = new Map(claims.map(c => [c.id, c]))
        const pending = new Set(claims.map(c => c.id))
        const apply = (id: string, citation: CitationResult, reason?: UncheckedReason) => {
          const claim = byId.get(id)
          if (!claim) return
          claim.citation = citation
          // The citation axis never writes a verdict. It reports what it
          // learned, and only a reason, and only onto a claim still unchecked.
          if (reason && claim.judgement.verdict === 'unchecked') {
            claim.judgement = { ...claim.judgement, reason }
          }
          pending.delete(id)
        }

        const it = streamCitations(claims)[Symbol.asyncIterator]()
        let timer: ReturnType<typeof setTimeout> | undefined
        let outOfTime = false
        try {
          const left = () => DEADLINE_MS - (Date.now() - requestStart)
          const expiry = new Promise<'deadline'>(resolve => {
            timer = setTimeout(() => resolve('deadline'), Math.max(0, left()))
          })
          while (true) {
            // The client can vanish at any point. Writing to a closed
            // controller throws, and the loop must stop rather than keep
            // paying a provider for a document nobody is reading.
            if (req.signal.aborted) { closed = true; break }
            if (left() <= 0) { outOfTime = true; break }
            /**
             * Raced, not polled. A per-iteration time check only fires when
             * the generator yields, so one hung page would hold the whole
             * document past the platform ceiling and the run would be killed
             * with nothing shown. The race bounds the wait itself.
             */
            const step = await Promise.race([it.next(), expiry])
            if (step === 'deadline') { outOfTime = true; break }
            if (step.done) break
            const event = step.value
            if (event.type === 'resolved') apply(event.id, event.citation)
            else if (event.type === 'refusals') {
              for (const [id, citation] of Object.entries(event.results)) {
                apply(id, citation, event.claimReasons[id])
              }
            }
            send(event)
          }
        } finally {
          clearTimeout(timer)
          // Let the generator run its own cleanup rather than abandoning it
          // mid-flight with pages still open.
          await it.return?.(undefined)
        }

        if (outOfTime) {
          /**
           * A RUN THAT PART-WORKED MUST SHOW WHAT IT DID.
           *
           * Fifteen of twenty resolved is fifteen findings the writer can act
           * on. Throwing them away to report a clean failure is the worst
           * outcome available, and it is the one we had: the platform killed
           * the function and the reader saw "nothing was checked".
           *
           * So the deadline is ours, it sits below the platform ceiling, and
           * what it produces is a sentence rather than a kill.
           */
          const ids = [...pending]
          for (const id of ids) {
            const claim = byId.get(id)
            if (claim && claim.judgement.verdict === 'unchecked') {
              claim.judgement = { ...claim.judgement, reason: 'deadline' }
            }
          }
          console.error(`[factcheck] deadline at ${Date.now() - requestStart}ms, ${ids.length} unresolved`)
          if (!closed) send({ type: 'deadline', ids })
        }

        if (!closed) {
          const found = groupFindings(claims)
          send({
            type: 'done',
            flags: rankFlags(claims, result.text.length).fired,
            findings: found.total,
            unsupported: found.unsupported.length,
            noSource: found.noSource.length,
            unverifiable: found.unverifiable.length,
            unresolved: pending.size,
          })
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
        /**
         * A RUN THAT CHECKED NOTHING IS NOT A CHECK, AND IS NOT CHARGED.
         *
         * A document with no links costs $0.018 and produces no verdict about
         * any source, because there was no source to open. Spending one of
         * five monthly checks on that is charging someone for the discovery
         * that we had nothing to do, and it is exactly how a first-time
         * visitor burns an allowance learning what the tool is and never
         * comes back.
         *
         * The test is the one the health check uses: `supports` and
         * `does_not_contain` are the only outcomes reachable by reading a
         * page. Everything else is reachable with retrieval completely dead.
         *
         * STILL IN `finally`, so closing the tab does not dodge it. A reader
         * who aborts after fifteen claims resolved is charged, because
         * fifteen claims really were checked.
         */
        // `result.claims` and the `claims` alias inside the try are the same
        // array, and apply() mutates the claim objects in place, so this sees
        // every result the run reached before it ended.
        const judged = result.claims.filter(
          c => c.citation.check === 'supports' || c.citation.check === 'does_not_contain'
        ).length
        if (auth && judged > 0) {
          try {
            await recordFactcheckUsage(auth.userId, auth.via === 'token')
          } catch (err) {
            // Never block on the counter write. Our problem, not theirs.
            console.error('[factcheck] usage record failed, continuing:', err)
          }
        }

        const spent = meter.read().credits - spentBefore
        console.log(
          `[factcheck] claims=${result.claims.length}/${result.foundCount} judged=${judged} ` +
            `dupes=${result.duplicates} ` +
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
