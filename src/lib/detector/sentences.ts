/**
 * Simple sentence splitter for English text.
 *
 * Not perfect (no NLP library can be), but good enough for our signal
 * calculations. Handles abbreviations (Dr., Mr., U.S.), decimals (3.14),
 * and quoted dialogue. Avoids pulling in a 100KB nlp library.
 */

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'mt', 'ft',
  'vs', 'etc', 'e.g', 'i.e', 'inc', 'ltd', 'co', 'corp',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
  'u.s', 'u.k', 'u.n', 'a.m', 'p.m',
])

export function splitSentences(text: string): string[] {
  if (!text || !text.trim()) return []

  // Pre-pass: collapse all whitespace runs to a single space so newlines
  // inside paragraphs don't confuse the splitter.
  const collapsed = text.replace(/\s+/g, ' ').trim()

  // Walk char-by-char, accumulating into the current sentence. End a
  // sentence on . ! or ? followed by space + uppercase OR end of string.
  const out: string[] = []
  let buf = ''
  for (let i = 0; i < collapsed.length; i++) {
    const ch = collapsed[i]
    buf += ch
    if (ch === '.' || ch === '!' || ch === '?') {
      // Look at the prior word to detect abbreviations.
      const prior = buf.slice(0, -1).split(/\s+/).pop() ?? ''
      const cleaned = prior.replace(/[.,;:'"()[\]]/g, '').toLowerCase()
      const isAbbreviation = ABBREVIATIONS.has(cleaned)
      // Numeric decimal (e.g. 3.14 - the . is between digits)
      const prevChar = collapsed[i - 1] ?? ''
      const nextChar = collapsed[i + 1] ?? ''
      const isDecimal = ch === '.' && /\d/.test(prevChar) && /\d/.test(nextChar)
      if (isAbbreviation || isDecimal) continue
      // End of input, or next non-space char looks sentence-initial.
      const rest = collapsed.slice(i + 1).trimStart()
      const restStartsSentence = !rest || /^["'(‘“]?[A-Z0-9]/.test(rest)
      if (restStartsSentence) {
        const sentence = buf.trim()
        if (sentence) out.push(sentence)
        buf = ''
      }
    }
  }
  const tail = buf.trim()
  if (tail) out.push(tail)
  return out
}
