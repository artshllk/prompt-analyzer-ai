/**
 * Content-free counters for the on-site tool.
 *
 * Same contract as the extension's track() in extension/content.js: an event
 * name, a tier and a surface, and never the prompt, the rewrite, any part of
 * either, or any identifier. The endpoint is unauthenticated by necessity
 * (anonymous visitors are most of the funnel), so the set of storable strings
 * is a closed list here, in the route, and in a CHECK constraint.
 *
 * Always fire and forget. A counter must never be able to interrupt, slow, or
 * fail the thing it is counting.
 */

import type { ExtensionEvent } from '@/types/database'

/** Local-only marker for "this browser has run the tool before". */
const SEEN_KEY = 'dc:has_run'

export function track(event: ExtensionEvent): void {
  try {
    void fetch('/api/anon/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, tier: 'anon', surface: 'web' }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Never matters.
  }
}

/**
 * Count a run, and say whether this browser has done it before.
 *
 * The repeat flag is read from local storage and immediately forgotten. It
 * never leaves the browser and never reaches the row: the server learns that
 * *a* repeat happened, not whose. That is the difference between a return
 * rate and a user identifier, and it is why this table is allowed to be
 * written without auth.
 */
export function trackRun(): void {
  let repeat = false
  try {
    repeat = window.localStorage.getItem(SEEN_KEY) === '1'
    window.localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Private mode, blocked storage: count it as a first run.
  }
  track(repeat ? 'tool_run_repeat' : 'tool_run')
}
