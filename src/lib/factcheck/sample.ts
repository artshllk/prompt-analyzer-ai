import { MAX_DOC_CHARS, MIN_DOC_CHARS } from '@/lib/factcheck/types'
import { visibleLength, countLinks } from '@/lib/factcheck/paste'

/**
 * The document behind "Load a sample" in the hero.
 *
 * THE BUTTON ONLY EXISTS BECAUSE THIS FILE DOES. A toolbar button that
 * prefills nothing is a dead control on a page whose entire argument is that
 * we do not say things we cannot do, so the button ships with the document or
 * it does not ship.
 *
 * EVERY NUMBER IN HERE IS REAL AND EVERY LINK RESOLVES. It is a specimen a
 * stranger will run through the checker within seconds of arriving, so it
 * cannot contain a fabricated statistic. Both figures were read off the pages
 * they point at on 2026-09-04.
 *
 * It is built to produce three different outcomes, because a sample where
 * everything passes teaches nothing:
 *
 *   1. The speed of light. Wikipedia carries 299,792,458 verbatim, so the
 *      link should support the sentence.
 *   2. Everest at 8,849 metres. The page says 8,848.86. That is the ordinary
 *      rounding a writer does, and it is exactly the case the product handles
 *      without accusing anyone: "Your text says 8,849. The source says
 *      8,848.86." Nothing here calls that wrong, and neither does the tool.
 *   3. The 1856 survey figure, deliberately left with no link, so a reader
 *      sees what "No source given" looks like. Across the 114 numbers on
 *      /how-it-works that group was the largest one.
 *
 * No sentence in here predicts its own verdict. A sample that announced what
 * the checker would find would be a claim we cannot keep, since the answer
 * depends on what the page says on the day it is opened.
 */
export const SAMPLE_DOCUMENT = `A sample document

Light travels at [299,792,458 metres per second](https://en.wikipedia.org/wiki/Speed_of_light) in a vacuum, and nothing carrying information moves faster. That one number sets the floor on how quickly a page can reach a reader on the far side of the world.

Mount Everest rises [8,849 metres](https://en.wikipedia.org/wiki/Mount_Everest) above sea level. Nepal and China announced the figure together in 2020, after each country surveyed the summit.

When Andrew Waugh first announced the mountain as the highest on Earth in 1856, the surveyed height was 8,840 metres.`

/**
 * Everything the checker requires of a document, asserted here rather than
 * discovered by the first visitor who presses the button. A sample that comes
 * back "too short" or "too long" is worse than no sample at all.
 */
export const SAMPLE_LENGTH = visibleLength(SAMPLE_DOCUMENT)
export const SAMPLE_LINKS = countLinks(SAMPLE_DOCUMENT)

export function sampleIsRunnable(): boolean {
  return (
    SAMPLE_LENGTH >= MIN_DOC_CHARS &&
    SAMPLE_LENGTH <= MAX_DOC_CHARS &&
    SAMPLE_LINKS > 0
  )
}
