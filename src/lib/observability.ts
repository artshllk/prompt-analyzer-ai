/**
 * Conditional Sentry wrapper. Only initializes if NEXT_PUBLIC_SENTRY_DSN is set,
 * so this remains a no-op in dev / unconfigured environments.
 *
 * Why a wrapper: avoids forcing every route handler to import Sentry directly,
 * keeps the install optional, and lets us swap providers later without churn.
 *
 * ===================================================================
 * IT MUST NEVER CAPTURE A REQUEST BODY. THIS IS A PROMISE, NOT A
 * PREFERENCE.
 * ===================================================================
 *
 * The FAQ tells people "we save nothing" about the text they paste into the
 * source checker. That sentence is only true while nothing writes it anywhere,
 * and error reporting is the easiest place for it to leak, because the leak
 * looks like diagnostics.
 *
 * It already happened once. Both model clients used to pass a provider error
 * body into captureError, and a provider error body echoes the offending input
 * back at you. Turning Sentry on would have shipped users' documents to a
 * third party as "context".
 *
 * So: pass lengths, status codes, model names and counts. Never text. If you
 * add `sendDefaultPii`, `Replay`, or any integration that serialises a request,
 * you have broken a published promise and the FAQ has to change first.
 */

type CaptureFn = (err: unknown, context?: Record<string, unknown>) => void

let captureImpl: CaptureFn = (err, context) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[obs]', err, context ?? '')
  }
}

let initialized = false

export async function initObservability() {
  if (initialized) return
  initialized = true

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return

  try {
    // Dynamic, string-based import so TypeScript doesn't require the package
    // to be installed. Sentry is optional - install only if you opt in.
    const moduleName = '@sentry/nextjs'
    const Sentry = await (Function('m', 'return import(m)')(moduleName) as Promise<{
      init: (opts: Record<string, unknown>) => void
      captureException: (err: unknown, ctx?: Record<string, unknown>) => void
    } | null>).catch(() => null)
    if (!Sentry) return

    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    })

    captureImpl = (err, context) => {
      Sentry.captureException(err, context ? { extra: context } : undefined)
    }
  } catch {
    // Stay silent - observability must never crash the app.
  }
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  captureImpl(err, context)
}
