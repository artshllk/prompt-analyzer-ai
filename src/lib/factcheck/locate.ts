import type { ClaimSpan } from './types'

/**
 * Finding a claim's exact position in the document.
 *
 * WHY THIS IS NOT ONE indexOf CALL
 *
 * The extractor returns the claim as a quoted substring, because models
 * cannot count characters and any offset they return is fiction. But the
 * quote they return is not always byte-identical to the document either.
 * Models reflow whitespace, straighten curly quotes, turn an em dash into a
 * hyphen, and drop a trailing full stop. Every one of those breaks a naive
 * indexOf, and every one of them is common.
 *
 * So: a cascade, cheapest and most certain first, and a hard rule at the end.
 *
 * THE HARD RULE: WHEN IN DOUBT, DO NOT ANCHOR.
 *
 * An unplaced claim is listed below the document instead of highlighted. That
 * is a small loss. A MISPLACED claim puts a coloured mark on a sentence that
 * has nothing to do with it, and if that mark is red we have accused the
 * writer of fabricating a sentence they wrote correctly. The reader catches
 * that with their own eyes, immediately, and never trusts the tool again.
 *
 * This file is pure and has no dependencies. It is the most testable and the
 * most dangerous code in the product, which is a good combination.
 */

/**
 * The document's coordinate system.
 *
 * Everything downstream indexes into the NORMALIZED string, and the client
 * renders the normalized string the server returns rather than the text it
 * still has in its textarea. That single decision removes an entire class of
 * off-by-N bugs, because there is only ever one version of the document.
 */
export function normalizeDocument(raw: string): string {
  return raw.replace(/\r\n?/g, '\n').normalize('NFC')
}

/**
 * A folded view of the text, plus a map back to the original.
 *
 * Built once per document, not once per claim. The map is what makes folding
 * safe: we can match against a whitespace-collapsed, typographically-flattened
 * string and still return positions that are correct in the real document.
 * `detector/sentences.ts` collapses whitespace and throws this away, which is
 * exactly why it cannot be used for anchoring.
 */
export interface FoldedIndex {
  folded: string
  /** map[i] is the index in the original of folded character i. */
  map: number[]
}

/** Typographic characters models routinely normalise away. */
const TYPOGRAPHIC: Record<string, string> = {
  '‘': "'", '’': "'", '‚': "'", '‛': "'",
  '“': '"', '”': '"', '„': '"', '‟': '"',
  '–': '-', '—': '-', '−': '-', '‐': '-', '‑': '-',
  ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ',
  '…': '...',
}

function foldChar(ch: string): string {
  return TYPOGRAPHIC[ch] ?? ch
}

/**
 * Lowercase, flatten typography, collapse whitespace runs to one space.
 *
 * Whitespace runs collapse to a SINGLE space rather than being removed, so
 * word boundaries survive. Removing them entirely would let "the rapist"
 * match "therapist", which is the kind of bug that only shows up in a
 * screenshot someone posts.
 */
export function buildFoldedIndex(text: string): FoldedIndex {
  let folded = ''
  const map: number[] = []
  let lastWasSpace = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (/\s/.test(ch)) {
      if (lastWasSpace) continue
      folded += ' '
      map.push(i)
      lastWasSpace = true
      continue
    }
    lastWasSpace = false
    const sub = foldChar(ch).toLowerCase()
    // An ellipsis folds to three characters, all mapping back to the one
    // original index. The map stays the same length as `folded`, which is
    // the invariant every lookup below relies on.
    for (const c of sub) {
      folded += c
      map.push(i)
    }
  }
  return { folded, map }
}

/**
 * Where the folded match ends, in original coordinates.
 *
 * `map[i]` is the START of the original character that produced folded
 * character `i`. For an exclusive end we need one past the LAST character, so
 * we take the last mapped index and step to the next original position.
 */
function originalEnd(index: FoldedIndex, foldedEnd: number, docLength: number): number {
  if (foldedEnd <= 0) return 0
  const lastFolded = foldedEnd - 1
  const orig = index.map[lastFolded]
  if (orig === undefined) return docLength
  return Math.min(docLength, orig + 1)
}

/** All occurrences of `needle` in `haystack`. */
function allIndexesOf(haystack: string, needle: string): number[] {
  if (!needle) return []
  const out: number[] = []
  let from = 0
  for (;;) {
    const at = haystack.indexOf(needle, from)
    if (at === -1) return out
    out.push(at)
    from = at + 1
  }
}

/**
 * Pick the occurrence that comes after the previous claim.
 *
 * Claims arrive in document order, so a repeated phrase almost always belongs
 * to the next occurrence rather than the first. This is a heuristic, so it
 * downgrades precision rather than claiming an exact match.
 */
function pickByOrder(positions: number[], searchFrom: number): number | null {
  for (const p of positions) if (p >= searchFrom) return p
  return positions.length === 1 ? positions[0] : null
}

export interface LocateOptions {
  /** Folded index of the character after the previous claim. */
  searchFrom?: number
}

export interface LocateHit {
  span: ClaimSpan
  /** Folded index just past this match, to seed the next claim's search. */
  nextSearchFrom: number
}

/**
 * Find one quote in the document. Returns null rather than guessing.
 */
export function locateQuote(
  doc: string,
  index: FoldedIndex,
  quote: string,
  options: LocateOptions = {}
): LocateHit | null {
  const searchFrom = options.searchFrom ?? 0
  if (!quote || !quote.trim()) return null

  // ---- 1. Exact, in the real document. The only certain answer.
  const exact = allIndexesOf(doc, quote)
  if (exact.length === 1) {
    return {
      span: { start: exact[0], end: exact[0] + quote.length, precision: 'exact' },
      nextSearchFrom: foldedPositionOf(index, exact[0] + quote.length),
    }
  }

  // ---- 2. Exact but repeated: disambiguate by document order.
  if (exact.length > 1) {
    const origFrom = index.map[Math.min(searchFrom, index.map.length - 1)] ?? 0
    const pick = pickByOrder(exact, origFrom)
    if (pick !== null) {
      return {
        span: { start: pick, end: pick + quote.length, precision: 'exact' },
        nextSearchFrom: foldedPositionOf(index, pick + quote.length),
      }
    }
    // Genuinely ambiguous and no order to break the tie. Do not guess.
    return null
  }

  // ---- 3. Folded: survives reflowed whitespace and straightened quotes.
  const foldedQuote = buildFoldedIndex(quote).folded.trim()
  if (!foldedQuote) return null

  const foldedHits = allIndexesOf(index.folded, foldedQuote)
  if (foldedHits.length >= 1) {
    const pick =
      foldedHits.length === 1 ? foldedHits[0] : pickByOrder(foldedHits, searchFrom)
    if (pick === null) return null
    const start = index.map[pick]
    const end = originalEnd(index, pick + foldedQuote.length, doc.length)
    if (start === undefined || end <= start) return null
    return {
      span: { start, end, precision: 'folded' },
      nextSearchFrom: pick + foldedQuote.length,
    }
  }

  // ---- 4. Anchor and extend: the model paraphrased the middle.
  //
  // Match the first and last few words and take the span between them. Bounded
  // hard at 1.6x the quote length, because an unbounded version will happily
  // swallow three paragraphs when the anchors happen to repeat, and a mark
  // covering half the document is worse than no mark.
  const words = foldedQuote.split(' ').filter(Boolean)
  if (words.length < 8) return null

  const head = words.slice(0, 4).join(' ')
  const tail = words.slice(-4).join(' ')
  const headAt = index.folded.indexOf(head, searchFrom)
  if (headAt === -1) return null
  const tailAt = index.folded.indexOf(tail, headAt + head.length)
  if (tailAt === -1) return null

  const foldedEnd = tailAt + tail.length
  const foldedLen = foldedEnd - headAt
  if (foldedLen > foldedQuote.length * 1.6) return null

  const start = index.map[headAt]
  const end = originalEnd(index, foldedEnd, doc.length)
  if (start === undefined || end <= start) return null

  return {
    span: { start, end, precision: 'fuzzy' },
    nextSearchFrom: foldedEnd,
  }
}

/** Original index -> folded index. Linear scan, only used to seed the next search. */
function foldedPositionOf(index: FoldedIndex, originalIndex: number): number {
  for (let i = 0; i < index.map.length; i++) {
    if (index.map[i] >= originalIndex) return i
  }
  return index.folded.length
}

export interface LocatedClaim<T> {
  claim: T
  span?: ClaimSpan
}

/**
 * Locate a list of quotes in one pass, in document order.
 *
 * Threading `searchFrom` between calls is what makes repeated phrases
 * resolvable at all: the third "we surveyed 200 customers" in a document is
 * findable only because the first two are already behind us.
 */
export function locateAll<T extends { quote: string }>(
  doc: string,
  claims: T[]
): LocatedClaim<T>[] {
  const index = buildFoldedIndex(doc)
  let cursor = 0
  return claims.map(claim => {
    const hit = locateQuote(doc, index, claim.quote, { searchFrom: cursor })
    if (!hit) return { claim }
    cursor = hit.nextSearchFrom
    return { claim, span: hit.span }
  })
}
