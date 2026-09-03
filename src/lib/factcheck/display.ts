/**
 * The document as a reader should see it, without moving a single offset.
 *
 * ===================================================================
 * WHY A MAP AND NOT A STRIPPED COPY
 * ===================================================================
 *
 * `result.text` carries markdown link syntax, and every claim span is a pair
 * of offsets into that exact string. Rendering it literally put 108 raw URLs
 * through the middle of one real article, so a visitor watching their own
 * document arrive saw us mangle it.
 *
 * The obvious fix, stripping the syntax before rendering, is wrong twice
 * over. Strip the whole string and every span points somewhere else. Strip
 * each render run separately and a claim quote that CONTAINS a link splits
 * mid-syntax, leaving "[BrightEdge" in one run and "](https://...)" in the
 * next.
 *
 * So nothing is mutated. We build a map from source offsets to display
 * offsets, translate the spans through it, and render from the display
 * string. The source text stays byte-for-byte what the extractor anchored
 * against, which is what keeps the marks in the right place.
 */

/** Must stay identical to the pattern countLinks uses. One shape, one place. */
const MARKDOWN_LINK = /\[([^\]]*)\]\((https?:\/\/[^)\s]*)\)/g

export interface DisplayLink {
  /** Offsets into the DISPLAY string. */
  start: number
  end: number
  href: string
}

export interface DisplayMap {
  /** What the reader sees. Link syntax gone, anchor text kept. */
  text: string
  /** Length of the SOURCE string, so a span can be validated before mapping. */
  sourceLength: number
  /** Where the links ended up, in display coordinates. */
  links: DisplayLink[]
  /**
   * Translate one source offset to its display offset.
   *
   * An offset inside link syntax has no exact display position, so it lands
   * on the nearest sensible edge: anywhere in `[` or the anchor text maps
   * into the anchor, and anywhere in `](url)` maps to the anchor's end. A
   * claim span can then never straddle a link into nonsense.
   */
  toDisplay(sourceOffset: number): number
}

/**
 * One contiguous stretch of source that survives into the display, plus the
 * link that follows it. Built once per document.
 */
interface Piece {
  srcStart: number
  srcEnd: number
  dispStart: number
}

export function buildDisplay(source: string): DisplayMap {
  const pieces: Piece[] = []
  const links: DisplayLink[] = []
  let out = ''
  let cursor = 0

  MARKDOWN_LINK.lastIndex = 0
  for (const m of source.matchAll(MARKDOWN_LINK)) {
    const at = m.index
    const anchor = m[1]
    const href = m[2]

    // The plain text before this link passes through unchanged.
    if (at > cursor) {
      pieces.push({ srcStart: cursor, srcEnd: at, dispStart: out.length })
      out += source.slice(cursor, at)
    }

    /**
     * A link with no anchor text would vanish, taking its offsets with it and
     * leaving nothing for a reader to click. Show the host instead, which is
     * the only part of a bare URL worth reading.
     */
    const shown = anchor.length > 0 ? anchor : hostOf(href)
    const dispStart = out.length
    // The anchor text maps back to the WHOLE link, syntax included, so any
    // source offset inside the construct resolves into the anchor.
    pieces.push({ srcStart: at, srcEnd: at + m[0].length, dispStart, isLink: true } as Piece & { isLink: true })
    out += shown
    links.push({ start: dispStart, end: out.length, href })
    cursor = at + m[0].length
  }

  if (cursor < source.length) {
    pieces.push({ srcStart: cursor, srcEnd: source.length, dispStart: out.length })
    out += source.slice(cursor)
  }

  function toDisplay(sourceOffset: number): number {
    if (sourceOffset <= 0) return 0
    if (sourceOffset >= source.length) return out.length
    // Binary search for the piece holding this offset.
    let lo = 0
    let hi = pieces.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (pieces[mid].srcStart <= sourceOffset) lo = mid
      else hi = mid - 1
    }
    const p = pieces[lo]
    if (sourceOffset >= p.srcEnd) {
      // Past the end of this piece, which only happens between pieces.
      return lo + 1 < pieces.length ? pieces[lo + 1].dispStart : out.length
    }
    const isLink = (p as Piece & { isLink?: true }).isLink === true
    if (isLink) {
      // Inside link syntax. Clamp to the anchor rather than inventing a
      // position inside text the reader cannot see.
      const link = links.find(l => l.start === p.dispStart)!
      const intoAnchor = sourceOffset - (p.srcStart + 1)
      if (intoAnchor <= 0) return link.start
      return Math.min(link.start + intoAnchor, link.end)
    }
    return p.dispStart + (sourceOffset - p.srcStart)
  }

  return { text: out, sourceLength: source.length, links, toDisplay }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * One stretch of the display string with everything that applies to it.
 *
 * A claim mark and a link can cover the same characters, so an atom carries
 * both rather than the renderer having to choose a winner up front.
 */
export interface DisplayRun {
  text: string
  claimId: string | null
  href: string | null
}

/**
 * Cut the display string at every boundary that matters, then merge back.
 *
 * WHY BOUNDARIES AND NOT NESTING. A link inside a claim is two overlapping
 * ranges, and HTML cannot nest an anchor inside a button. Splitting at both
 * sets of edges gives a flat list where each piece has at most one
 * interactive owner, so the mark stays clickable either side of a link and
 * the link stays a link.
 *
 * THIS IS THE COMMON CASE, NOT THE EDGE CASE. Measured on one real article:
 * 18 of 56 marked runs are also a link, because a writer citing a statistic
 * usually puts the link inside the sentence making the claim. An earlier
 * measurement said zero and was taken against a fixture whose links were
 * broken, which is worth remembering: the rare-looking branch was the main
 * one.
 *
 * Claims never overlap each other here: resolveOverlaps has already settled
 * that, and the source-to-display mapping is monotonic, so it stays settled.
 */
export function toDisplayRuns(
  map: DisplayMap,
  spans: { id: string; start: number; end: number }[]
): DisplayRun[] {
  const marks = spans
    /**
     * Validated in SOURCE space, before mapping, and skipped rather than
     * clamped. A span past the end of the document would otherwise map onto
     * the last character and mark it, so a bad offset would paint a mark on
     * an innocent sentence. Dropping it costs one mark; keeping it puts a
     * colour on somebody's writing for no reason.
     */
    .filter(s => s.start >= 0 && s.end <= map.sourceLength && s.end > s.start)
    .map(s => ({ id: s.id, start: map.toDisplay(s.start), end: map.toDisplay(s.end) }))
    .filter(s => s.end > s.start)
    .sort((a, b) => a.start - b.start)

  const cuts = new Set<number>([0, map.text.length])
  for (const m of marks) { cuts.add(m.start); cuts.add(m.end) }
  for (const l of map.links) { cuts.add(l.start); cuts.add(l.end) }
  const edges = [...cuts].filter(n => n >= 0 && n <= map.text.length).sort((a, b) => a - b)

  const out: DisplayRun[] = []
  for (let i = 0; i < edges.length - 1; i++) {
    const start = edges[i]
    const end = edges[i + 1]
    if (end <= start) continue
    const mark = marks.find(m => m.start <= start && m.end >= end)
    const link = map.links.find(l => l.start <= start && l.end >= end)
    const run: DisplayRun = {
      text: map.text.slice(start, end),
      claimId: mark?.id ?? null,
      href: link?.href ?? null,
    }
    const prev = out[out.length - 1]
    // Merge back anything the cuts split for no reason, so the DOM has one
    // node per visually distinct stretch and not one per boundary.
    if (prev && prev.claimId === run.claimId && prev.href === run.href) prev.text += run.text
    else out.push(run)
  }
  return out.filter(r => r.text.length > 0)
}
