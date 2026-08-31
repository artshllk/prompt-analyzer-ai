/**
 * Provenance for a rewritten prompt: which words are the user's, which came
 * from their answer, and which the tool guessed.
 *
 * WHY THIS EXISTS
 *
 * The rewrite stage is instructed to commit to sensible defaults where the
 * user left something open: a length, an audience, a format, a tone. That is
 * the right call, because a prompt that commits is more useful than one that
 * hedges. The problem was that it committed SILENTLY. The user got back a
 * prompt carrying rules they never chose, could not see which rules those
 * were, and sent it to a model that obeyed all of them equally.
 *
 * So the rewrite now marks its own additions inline, and this module turns
 * that marked text into segments the UI can label and let the user remove.
 *
 * PURE AND PORTABLE - the same rule as analyzePrompt(). No Next, no Supabase,
 * no HTTP, no React, no DOM. The extension's streaming fast path has to be
 * able to call this without dragging anything with it.
 *
 * THE MARKERS
 *
 *   ⟦a⟧...⟦/a⟧   added because the user answered the clarifying question
 *   ⟦g⟧...⟦/g⟧   the tool assumed it
 *
 * Everything outside a marker is the user's own. Mathematical white square
 * brackets (U+27E6/U+27E7) rather than ASCII: a prompt about code is full of
 * [[ and {{ and <>, and a marker that collides with the payload is worse than
 * no marker at all.
 *
 * DEGRADING
 *
 * A model will eventually get the markers wrong, and a stream will eventually
 * be cut in the middle of one. The hard guarantee here is that NO marker
 * character ever reaches a user. Malformed input degrades to clean text with
 * less labelling, never to visible junk. Every branch below either consumes a
 * marker or emits text, and there is no path that emits a marker.
 */

export type SegmentSource = 'yours' | 'answered' | 'guessed'

export interface Segment {
  text: string
  source: SegmentSource
}

/** Open/close pairs, longest first so `⟦/a⟧` never matches as `⟦a⟧`. */
const OPEN_A = '⟦a⟧'
const OPEN_G = '⟦g⟧'
const CLOSE_A = '⟦/a⟧'
const CLOSE_G = '⟦/g⟧'
const ALL_MARKERS = [CLOSE_A, CLOSE_G, OPEN_A, OPEN_G] as const

/** The character that starts every marker. Scanning hinges on this. */
const SENTINEL = '⟦'

/**
 * The character that ends every marker.
 *
 * This needs its own handling and did not have it, which is how a real model
 * response leaked. Every well-formed marker ends with this character and gets
 * consumed as part of the marker, so one arriving on its own in the scan loop
 * is always debris: a close the model half-wrote, or an open it forgot. It
 * used to fall through to "not the sentinel, emit it as text" and land in
 * front of a user. Dropped now, like every other malformed shape.
 */
const SENTINEL_CLOSE = '⟧'

/** The longest marker, so a stream parser knows how much tail to hold back. */
const MAX_MARKER_LEN = Math.max(...ALL_MARKERS.map(m => m.length))

/** The instruction block handed to the rewrite model. Kept next to the parser
 *  so the format and the thing that reads it can never drift apart. */
export const MARKER_INSTRUCTIONS = `# MARKING WHAT YOU ADDED

The user must be able to see every constraint you introduced and take any of
them back. Mark them inline, in the restructured rewrite only:

- Wrap anything you decided for them in ${OPEN_G}...${CLOSE_G}. A length you
  picked, an audience you assumed, a tone, a format, a scope, a persona.
- Wrap anything that came from their answer to the clarifying question in
  ${OPEN_A}...${CLOSE_A}.
- Leave everything that came from their own prompt unmarked.

Rules:
- MARK A SPAN THAT STILL READS CORRECTLY WHEN IT IS DELETED. This is the rule
  that matters most, because the user can remove any span you mark and we send
  what is left to a real model. Prefer a whole clause or sentence over a
  fragment, and include the connective and punctuation that only exist to
  attach it.
  Wrong:  Keep them ${OPEN_G}short and plain${CLOSE_G}, and group them under...
          (deleting that leaves "Keep them, and group them under...")
  Right:  ${OPEN_G}Keep them short and plain.${CLOSE_G} Group them under...
- Mark the decision, not the sentence it happens to sit in. A whole paragraph
  wrapped in one marker tells the user nothing.
- Never nest a marker inside another marker.
- Never mark the user's own words. If they said "50 words", that is theirs.
- Every opened marker must be closed.
- At most 5 marked spans. If you added more than that, you are adding too much.
- The markers go in the restructured rewrite ONLY. minimal_edit and template
  must contain no markers at all.`

/** True if the text contains a marker character at all. */
export function hasMarkers(text: unknown): boolean {
  if (typeof text !== 'string') return false
  return text.includes(SENTINEL) || text.includes(SENTINEL_CLOSE)
}

/**
 * Remove every marker, leaving the prose. Also removes a dangling partial
 * marker at the very end, which is what a truncated stream looks like.
 *
 * Guarantee: the result never contains SENTINEL.
 */
export function stripMarkers(text: unknown): string {
  return parseSegments(text)
    .map(s => s.text)
    .join('')
}

/**
 * Split marked text into segments.
 *
 * A flat state machine, deliberately not a nesting one. Nested provenance is
 * not a thing the product can render or the user can act on, so an open
 * marker encountered while already open is dropped and the current span
 * simply continues. Same for a close that matches nothing.
 *
 * An unclosed marker at the end runs to the end of the input. That is the
 * truncated-stream case, and closing it there is both the honest reading (the
 * span WAS opened) and the safe one (we over-label rather than hide a guess).
 */
export function parseSegments(text: unknown): Segment[] {
  // Structured Outputs with strict:false can hand back a field that is not a
  // string - an array, an object, null. A parser that trusts the type throws
  // inside the engine and costs the user their whole result, which is a far
  // worse outcome than an unlabelled rewrite. Everything here treats a
  // non-string as "nothing to parse".
  if (typeof text !== 'string') return []

  const out: Segment[] = []
  let source: SegmentSource = 'yours'
  let buf = ''
  let i = 0

  const flush = () => {
    if (buf) out.push({ text: buf, source })
    buf = ''
  }

  while (i < text.length) {
    const ch = text[i]

    // A stray close is debris. Never emit either bracket character.
    if (ch === SENTINEL_CLOSE) {
      i += 1
      continue
    }

    if (ch !== SENTINEL) {
      buf += ch
      i += 1
      continue
    }

    // A sentinel. Either it opens a real marker, or it is stray text, or the
    // input ended mid-marker. None of those may emit the character.
    const rest = text.slice(i)
    const marker = ALL_MARKERS.find(m => rest.startsWith(m))

    if (marker === OPEN_A || marker === OPEN_G) {
      const next: SegmentSource = marker === OPEN_A ? 'answered' : 'guessed'
      // Already inside a span: ignore the marker, keep the current source.
      if (source === 'yours') {
        flush()
        source = next
      }
      i += marker.length
      continue
    }

    if (marker === CLOSE_A || marker === CLOSE_G) {
      // A close with nothing open is stray. Drop it and carry on.
      if (source !== 'yours') {
        flush()
        source = 'yours'
      }
      i += marker.length
      continue
    }

    // Not a marker we know. If the remaining input is short enough to be the
    // truncated head of one, it is: drop it. Otherwise it is a stray sentinel
    // in the prose, and it is still dropped, because the alternative is
    // showing a user a character they have no way to interpret.
    if (isPartialMarker(rest)) break
    i += 1
  }

  flush()
  return out
}

/** Could this tail be the beginning of a marker that has not arrived yet? */
function isPartialMarker(tail: string): boolean {
  if (tail.length >= MAX_MARKER_LEN) return false
  return ALL_MARKERS.some(m => m.startsWith(tail))
}

/**
 * How many constraints were added, and how many of those were guesses.
 *
 * COUNTS CONSTRAINTS, NOT SPANS. Two marked spans separated by nothing but a
 * space or a comma are one decision that the model happened to punctuate in
 * the middle, and counting them as two would inflate the number the user is
 * being asked to trust. The number has to be checkable by hand or it is just
 * another invented figure with better manners.
 */
export function countAdditions(segments: Segment[]): { added: number; guessed: number } {
  let added = 0
  let guessed = 0
  let prev: SegmentSource | null = null

  for (const seg of segments) {
    if (seg.source === 'yours') {
      // Only a break with real words in it separates two constraints.
      if (/[^\s,;:.\-–]/.test(seg.text)) prev = null
      continue
    }
    if (seg.source !== prev) {
      added += 1
      if (seg.source === 'guessed') guessed += 1
    }
    prev = seg.source

    /**
     * A span that ENDS a sentence ends the constraint too.
     *
     * The merge rule above only looked at the text between two spans, so
     * "⟦g⟧Keep it under 150 words.⟦/g⟧ ⟦g⟧Open with the single change.⟦/g⟧"
     * counted as one, because the only thing between them is a space. The
     * full stop is inside the first span, not between them. Those are two
     * decisions a user can remove separately, and calling them one
     * understates the number they are being asked to check.
     */
    if (/[.!?]["')\]]?\s*$/.test(seg.text)) prev = null
  }

  return { added, guessed }
}

/**
 * Rebuild the prompt with some segments removed, by index.
 *
 * Splicing a phrase out of a sentence leaves the punctuation that was holding
 * it in place: "Write a launch email, , warmly." Nobody wants to paste that
 * into ChatGPT, and the tidy-up is the difference between a control that
 * works and one the user tries once.
 */
export function renderPrompt(segments: Segment[], removed: ReadonlySet<number>): string {
  const joined = segments
    .filter((_, i) => !removed.has(i))
    .map(s => s.text)
    .join('')
  return tidy(joined)
}

/** Repair the punctuation and spacing a removal leaves behind. */
export function tidy(text: string): string {
  return (
    text
      // Runs of spaces/tabs (not newlines - those carry structure).
      .replace(/[ \t]{2,}/g, ' ')
      // A separator left with nothing on its left: ", ," or "( ,".
      .replace(/([(\[{,;:])\s*([,;:])/g, '$1')
      // Repeated separators.
      .replace(/([,;:])\s*(?:\s*[,;:])+/g, '$1')
      // Space before closing punctuation.
      .replace(/\s+([,.;:!?)\]}])/g, '$1')
      // An opener immediately followed by its closer.
      .replace(/\(\s*\)|\[\s*\]|\{\s*\}/g, '')
      // A separator stranded at the end of a line or the string.
      .replace(/[ \t]*[,;:]+[ \t]*(?=\n|$)/g, '')
      // Blank-line runs.
      .replace(/\n{3,}/g, '\n\n')
      // Leading separator on a line.
      .replace(/(^|\n)[ \t]*[,;:]+[ \t]*/g, '$1')
      .split('\n')
      .map(line => line.replace(/[ \t]+$/, ''))
      .join('\n')
      .trim()
  )
}

/**
 * Incremental marker stripper for a streaming caller.
 *
 * The extension writes the stream straight into the host page's composer as
 * it arrives, so it can never emit a character it might have to take back. It
 * holds back any tail that could still turn out to be the head of a marker,
 * and releases it once the next delta proves it either is or is not one.
 *
 * Phase 7 calls this. It lives here now so that phase is "use the parser",
 * not "write it again and hope the two agree".
 *
 *   const strip = createMarkerStripper()
 *   for await (const delta of stream) composer.append(strip.push(delta))
 *   composer.append(strip.end())
 */
export function createMarkerStripper() {
  let pending = ''

  return {
    /** Safe-to-emit text for this delta. May be empty. */
    push(delta: string): string {
      pending += delta
      // Everything before the last sentinel is unambiguous. Anything from it
      // onwards might be an incomplete marker, so it waits.
      const at = pending.lastIndexOf(SENTINEL)
      if (at === -1) {
        const out = pending
        pending = ''
        return stripMarkers(out)
      }
      const tail = pending.slice(at)
      if (!isPartialMarker(tail)) {
        // It is a complete marker or plain text - nothing left to wait for.
        const out = pending
        pending = ''
        return stripMarkers(out)
      }
      const out = pending.slice(0, at)
      pending = tail
      return stripMarkers(out)
    },

    /** Flush whatever is held back. A partial marker here is dropped. */
    end(): string {
      const out = pending
      pending = ''
      return stripMarkers(out)
    },
  }
}
