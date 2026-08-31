/**
 * Sample prompts shown as one-tap chips in the hero, on /playground, and in
 * the dashboard empty state. These are the first thing a cold visitor taps,
 * so each is written the way a real person would type it (short, rough, a bit
 * lazy) while pointing at a clear, valuable outcome.
 *
 * We never show all of them at once. `pickThree()` returns a rotating set so
 * a refresh surfaces a fresh mix.
 *
 * ONE OF THE THREE IS ALWAYS ALREADY GOOD. See ALREADY_GOOD_SAMPLE below.
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
 * A prompt that does not need improving, offered alongside the rough ones.
 *
 * Every other sample here demonstrates the obvious half of the product: a
 * lazy prompt goes in, a better one comes out. The half nobody sees is the
 * tool declining to touch a prompt that is already fine, and staying silent
 * instead of inventing a question. That is genuinely unusual and it is
 * completely invisible unless a visitor happens to paste something good,
 * which on a first visit they almost never do.
 *
 * So one of the three chips is always this one. It is specific about reader,
 * length, structure and what to lead with, which is what makes the engine
 * return already_good rather than a rewrite.
 */
export const ALREADY_GOOD_SAMPLE =
  'Summarise this quarterly sales report in 150 words for my manager, who has two minutes. Lead with the single biggest change and name the number.'

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
  // Spread the picks roughly a third of the list apart so the set is varied,
  // not three neighbours.
  const step = Math.floor(n / 3)
  return [0, 1].map((i) => list[(start + i * step) % n])
}

/**
 * The three chips shown above the input: two rough prompts and the
 * already-good one, in a rotating order.
 *
 * The already-good chip is never dropped and never always first. Never
 * dropped, because the quiet path is the thing a visitor will otherwise
 * never see. Never always first, because the first chip gets most of the
 * taps and leading with "we did nothing" is a poor opening.
 */
export function pickSamples(): string[] {
  const rough = pickThree()
  const at = 1 + Math.floor(Math.random() * 2)
  const out = [...rough]
  out.splice(at, 0, ALREADY_GOOD_SAMPLE)
  return out
}
