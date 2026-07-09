/**
 * Sample prompts shown as one-tap chips in the playground, the homepage
 * demo modal, and the dashboard empty state. These are the first thing a
 * cold visitor taps, so each one is written the way a real person would
 * type it (short, rough, a bit lazy) while pointing at a clear, valuable
 * outcome. The rewrite is the payoff; these are the bait.
 *
 * We never show all ten at once. `pickThree()` returns a rotating set of
 * three so refreshing the page or reopening the modal surfaces a fresh
 * mix, which keeps the surface alive and nudges more first taps.
 */
export const SAMPLE_PROMPTS = [
  'Write a cover letter for a marketing job',
  'Turn these messy notes into clear action items',
  'Reply to this angry customer email',
  'Explain this topic to me like I am five',
  'Write a cold email that actually gets a reply',
  'Review my code for bugs and security issues',
  'Summarize this long article in plain English',
  'Make this paragraph sound more confident',
  'Plan a 3-day trip to Rome on a budget',
  'Write product descriptions that sell',
]

/**
 * Return three sample prompts with a randomized starting point and even
 * spacing across the list, so each session sees a different lead prompt
 * and a varied trio rather than the same first three every time.
 *
 * Deterministic within a single call (one random seed), so a server
 * render and its markup stay consistent. Callers that must avoid a
 * hydration mismatch should call this once in lazy state on the client.
 */
export function pickThree(list: readonly string[] = SAMPLE_PROMPTS): string[] {
  const n = list.length
  if (n <= 3) return [...list]
  const start = Math.floor(Math.random() * n)
  // Spread the three picks roughly a third of the list apart so the trio
  // is varied, not three neighbours.
  const step = Math.floor(n / 3)
  return [0, 1, 2].map((i) => list[(start + i * step) % n])
}
