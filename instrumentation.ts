/**
 * Next.js instrumentation entry point - runs once on cold start.
 * https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initObservability } = await import('./src/lib/observability')
    await initObservability()
  }
}
