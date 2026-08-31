import { parseSegments, countAdditions, type Segment } from '@/lib/engine/segments'

/**
 * A finished example, rendered on first paint.
 *
 * WHY THIS EXISTS
 *
 * The hero used to be an empty input. A stranger arriving from a link had to
 * think of a prompt, type it, and wait, before seeing the one thing that
 * makes this product different from every other rewriter: that it shows you
 * what it added and lets you take it back. Most people will not do that work
 * for a tool they have never heard of. They will look for a second and leave.
 *
 * So the answer is already on the screen. This is a real marked-up rewrite in
 * the real format, parsed by the real parser and rendered by the real
 * component, so it cannot drift from what the product actually produces. If
 * the marker format changes and this stops parsing, the example degrades to
 * plain text exactly as a live response would.
 *
 * STATIC ON PURPOSE. No API call, no model, no cost, no spinner, and it is in
 * the server-rendered HTML, so it is there before any JavaScript runs. It is
 * also fully interactive: a visitor can remove a guess and watch the count
 * drop without typing anything or spending a run.
 */

/** The rough prompt someone would actually type. */
export const SAMPLE_ORIGINAL = 'write a launch email for my app'

/** What the user picked when asked which reading they meant. */
export const SAMPLE_ANSWER = 'Announcing a paid tier, to people already on the free plan.'

/**
 * The rewrite, in the engine's own marker format.
 *
 *   ⟦a⟧…⟦/a⟧  came from their answer above
 *   ⟦g⟧…⟦/g⟧  we decided it
 *
 * Two guessed spans, each a complete sentence, because the rule is that a
 * marked span has to read correctly when it is deleted.
 */
const SAMPLE_MARKED =
  'Write a launch email to ⟦a⟧people already on the free plan, announcing a paid tier⟦/a⟧. ' +
  '⟦g⟧Keep it under 150 words.⟦/g⟧ ' +
  '⟦g⟧Open with the single change that affects them, then give one clear action.⟦/g⟧ ' +
  'Use only the facts I give you and do not invent pricing.'

export const SAMPLE_SEGMENTS: Segment[] = parseSegments(SAMPLE_MARKED)

/** Precomputed so the label can be checked against the paragraph by hand. */
export const SAMPLE_COUNT = countAdditions(SAMPLE_SEGMENTS)
