/**
 * The proof beside a finding, cut from the page rather than asked for.
 *
 * ===================================================================
 * WHY THE MODEL NO LONGER WRITES THE QUOTE
 * ===================================================================
 *
 * Two of three real findings shipped with proof that proved nothing. One had
 * no quote at all, because the judge's quote failed the verbatim gate and was
 * dropped, correctly, leaving an assertion with nothing beside it. The other
 * quoted "For every 100 searches on Google desktop in September, 2018, there
 * were:" - a header, with the numbers it introduces left out.
 *
 * Both are the same mistake: asking a model to select evidence and then having
 * no recourse when it selects badly. The gate can refuse a bad quote. It
 * cannot produce a good one.
 *
 * We already locate the figure in the page to decide `figureOnPage`. That
 * position is the answer. Cut outward from it and the excerpt is a slice of
 * the page by construction: verbatim, always containing the number the finding
 * is about, and incapable of failing a gate it never needs to pass.
 *
 * ===================================================================
 * THE ONE PLACE THIS COULD STILL GO WRONG
 * ===================================================================
 *
 * A window that is too tight is the failure we are fixing, not a safe default.
 * "61.5 no-click searches" is a complete sentence and useless on its own; the
 * thing that makes it evidence is the line above it saying which device those
 * hundred searches were on. So sentence boundaries are preferred but not
 * trusted, and an excerpt that comes out too short to mean anything widens
 * back to a character window. See MIN_USEFUL.
 */

/**
 * Characters either side of the figure when sentence boundaries do not help.
 *
 * Measured against the real findings: the line introducing a bulleted list of
 * per-device numbers sat 120 characters before the figure, so 160 clears it
 * with room, and two windows plus the figure stay short enough to read in a
 * panel.
 */
const RADIUS = 160

/**
 * Below this, an excerpt is not evidence.
 *
 * A bullet like "61.5 no-click searches" is a whole sentence and says nothing
 * about what it counts. When trimming to a sentence lands under this, the
 * wider window is the honest answer even though it carries more than asked.
 */
const MIN_USEFUL = 80

/**
 * The longest excerpt worth showing. Past this it is a page, not a quote.
 */
const MAX_EXCERPT = 420

/**
 * Where one segment ends and the next begins.
 *
 * A NEWLINE ALWAYS ENDS ONE. A FULL STOP ONLY DOES WHEN A SPACE FOLLOWS IT.
 * That second rule is not pedantry: without it "Google.com" ends a sentence
 * after "Google", and a real finding shipped quoting a source as saying
 * "...initiated on Google." The domain was the evidence.
 */
function isBoundaryAt(body: string, i: number): boolean {
  const ch = body[i]
  if (ch === '\n') return true
  // A pipe is layout, not language: markdown tables use it, and so do the
  // header and footer rules PDFs leave behind. Nothing readable ever runs
  // across one, so it ends a segment.
  if (ch === '|') return true
  if (ch !== '.' && ch !== '!' && ch !== '?') return false
  const next = body[i + 1]
  return next === undefined || /\s/.test(next)
}

/** A markdown list item, which must never be split from the list it is in. */
function isListItem(line: string): boolean {
  return /^\s*(?:[*+-]|\d+\.)\s+/.test(line)
}

/** Does this segment introduce a list rather than stand on its own? */
function introducesList(segment: string): boolean {
  return /:\s*$/.test(segment)
}

/**
 * Split the window into segments, and say where the figure landed.
 *
 * Segments are what expansion works in. Expanding by characters is what
 * produced "phenomenon. For every 100 searches..." with half a word on the
 * front.
 */
function segment(body: string, from: number, to: number): { text: string; start: number }[] {
  const out: { text: string; start: number }[] = []
  let start = from
  for (let i = from; i < to; i++) {
    if (!isBoundaryAt(body, i)) continue
    out.push({ text: body.slice(start, i + 1), start })
    start = i + 1
  }
  if (start < to) out.push({ text: body.slice(start, to), start })
  return out.filter(seg => seg.text.trim().length > 0)
}

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= '0' && ch <= '9'
}

/**
 * Where a figure sits in the page, or -1.
 *
 * Boundary-checked, because "61.5" appears inside "161.55" and an excerpt
 * built around the wrong number is worse than no excerpt at all.
 */
export function findFigureAt(body: string, figure: string): number {
  if (!figure) return -1
  let from = 0
  for (;;) {
    const at = body.indexOf(figure, from)
    if (at === -1) return -1
    const before = body[at - 1]
    const after = body[at + figure.length]
    // Not part of a longer number on either side. A digit is disqualifying,
    // and so is a separator that itself continues into digits.
    const extendsLeft = isDigit(before) || ((before === '.' || before === ',') && isDigit(body[at - 2]))
    const extendsRight = isDigit(after) || ((after === '.' || after === ',') && isDigit(body[at + figure.length + 1]))
    if (!extendsLeft && !extendsRight) return at
    from = at + 1
  }
}

/**
 * The forms of a figure worth looking for, most specific first.
 *
 * "61.5%" is written with a percent sign in the document and appears as
 * "61.5 no-click searches" in the source. That is not a different number, and
 * refusing to find it is how a real finding ended up with no proof.
 */
export function figureForms(figure: string): string[] {
  const forms = [figure]
  const bare = figure.replace(/\s*(%|percent|per cent|pts?|percentage points?)\s*$/i, '').trim()
  if (bare && bare !== figure) forms.push(bare)
  const stripped = bare.replace(/,/g, '')
  if (stripped && !forms.includes(stripped)) forms.push(stripped)
  return forms
}

/**
 * Tidy for reading, without adding a word.
 *
 * Markdown list markers and newlines are layout, not language, so they go and
 * the words close up. Nothing is inserted, reordered or rephrased, which is
 * what keeps the result something the page actually says. `findQuote` folds
 * whitespace too, so an excerpt tidied this way still satisfies the gate it
 * no longer has to pass.
 */
/**
 * Tokens that cannot begin a sentence, dropped from the front.
 *
 * A PDF footer runs "…| info@brightedge.com BrightEdge Research found that…"
 * with no punctuation between the address and the sentence, so an excerpt cut
 * from there opens on an email. An address, a bare domain and a phone number
 * are never the first word of a claim about the world, so a leading run of
 * them goes.
 */
const NOT_A_SENTENCE_START = /^(?:\S+@\S+|https?:\/\/\S+|(?:www\.)?\S+\.(?:com|org|net|io|co|gov|edu)\b\S*|[\d.()+-]{7,})$/i

function trimLeadingJunk(text: string): string {
  const words = text.split(' ')
  let i = 0
  while (i < words.length - 3 && NOT_A_SENTENCE_START.test(words[i])) i++
  return words.slice(i).join(' ')
}

export function tidyExcerpt(raw: string): string {
  return trimLeadingJunk(
    raw
    .split('\n')
    .map(line => line.replace(/^\s*(?:[*+-]|\d+\.)\s+/, ''))
    .join('\n')
      .replace(/\s+/g, ' ')
      .replace(/\*+/g, '')
      .replace(/^[|\s]+|[|\s]+$/g, '')
      .trim()
  )
}

/** Pull the window back to whitespace so a word is never cut in half. */
function toWordStart(body: string, i: number): number {
  if (i <= 0) return 0
  let j = i
  while (j < body.length && !/\s/.test(body[j])) j++
  return j
}

function toWordEnd(body: string, i: number): number {
  if (i >= body.length) return body.length
  let j = i
  while (j > 0 && !/\s/.test(body[j - 1])) j--
  return j
}

/**
 * The excerpt for one finding, or null when there is nothing to build from.
 *
 * Null means the caller keeps the old path: use the judge's quote if it passes
 * the gate, and show nothing if it does not. An unverified quote is never an
 * option on either route.
 */
export function excerptAround(body: string, figures: (string | undefined)[]): string | null {
  for (const figure of figures) {
    if (!figure) continue
    for (const form of figureForms(figure)) {
      const at = findFigureAt(body, form)
      if (at === -1) continue

      // The pool we are allowed to draw from. Word-trimmed so no expansion can
      // ever start or end inside a word.
      const from = toWordStart(body, Math.max(0, at - RADIUS))
      const to = toWordEnd(body, Math.min(body.length, at + form.length + RADIUS))
      const segs = segment(body, from, to)
      const home = segs.findIndex(sg => at >= sg.start && at < sg.start + sg.text.length)
      if (home === -1) continue

      /**
       * Expand backwards, and keep going while what we just took was a list
       * item.
       *
       * "61.5 no-click searches" is a whole segment and says nothing about
       * what it counts. The line that gives it meaning is above three bullets,
       * so a rule that stops at a length threshold stops one line short of the
       * only line that matters. Instead: a list item is never the last thing
       * we take, so expansion runs until it reaches the line that introduces
       * the list, and takes that too.
       */
      let lo = home
      let hi = home
      const width = () => segs.slice(lo, hi + 1).reduce((n, sg) => n + sg.text.length, 0)
      while (lo > 0) {
        const takenIsListItem = isListItem(segs[lo].text)
        if (!takenIsListItem && width() >= MIN_USEFUL) break
        if (width() + segs[lo - 1].text.length > MAX_EXCERPT) break
        lo--
        if (introducesList(segs[lo].text)) break
      }
      // Then forwards, only if it is still too thin to mean anything.
      while (hi < segs.length - 1 && width() < MIN_USEFUL) {
        if (width() + segs[hi + 1].text.length > MAX_EXCERPT) break
        hi++
      }

      const chosen = tidyExcerpt(
        body.slice(segs[lo].start, segs[hi].start + segs[hi].text.length)
      )
      if (chosen.length > 0) return chosen
    }
  }
  return null
}

/**
 * Is this excerpt actually made of the page?
 *
 * Belt and braces on a function that constructs its own evidence. If a future
 * change to `tidyExcerpt` ever starts inventing text, this fails rather than
 * shipping it, and the caller falls back to showing nothing.
 */
export function isDerivedFrom(excerpt: string, body: string): boolean {
  const fold = (s: string) => s.replace(/\s+/g, ' ').replace(/\*+/g, '').toLowerCase()
  const hay = fold(body)
  // Every word of the excerpt, in order, with only layout removed between.
  return excerpt
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .every(w => hay.includes(w))
}
