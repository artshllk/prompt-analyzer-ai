/**
 * List the checkable claims in a text file.
 *
 *   npm run extract -- path/to/file.txt
 *
 * Built for one job: making the manual unverifiable-rate test cheap enough to
 * actually do. Read a list instead of hunting a document by hand, then mark
 * each line verified / unverifiable / contradicted yourself.
 *
 * No UI, no server, no persistence, no verdicts. One model call, and the same
 * extractClaims() the product uses, so what you read here is what the product
 * would show.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// The engine reads keys from the environment. Same hand-rolled loader as
// lib/engine/eval.ts, for the same reason: no dotenv dependency.
function loadEnvLocal(): void {
  if (process.env.OPENAI_API_KEY) return
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // No .env.local. Fall back to the shell environment.
  }
}
loadEnvLocal()

const { extractClaims } = await import('../src/lib/factcheck/extract.js')
const { MAX_CLAIMS_PER_DOC, MAX_DOC_CHARS } = await import('../src/lib/factcheck/types.js')

const KIND_WIDTH = 11

function die(message: string): never {
  console.error(message)
  process.exit(1)
}

const file = process.argv[2]
if (!file) {
  die('usage: npm run extract -- path/to/file.txt')
}

let raw: string
try {
  raw = readFileSync(resolve(process.cwd(), file), 'utf8')
} catch {
  die(`cannot read ${file}`)
}

const words = raw.trim().split(/\s+/).filter(Boolean).length
const result = await extractClaims(raw)

const REASONS: Record<string, string> = {
  too_short: 'too short: needs a bit more text to find claims in',
  too_long: `too long: ${raw.length} characters, the limit is ${MAX_DOC_CHARS} (about 2000 words)`,
  too_dense: 'too dense: more claims in there than one reply can hold, try a shorter section',
  unavailable: 'the model did not answer, try again',
}
if (typeof result === 'string') {
  die(REASONS[result] ?? result)
}

console.log('')
console.log(`  ${file}`)
console.log(`  ${words} words, ${result.claims.length} checkable claims`)
if (result.truncated) {
  console.log(`  found ${result.foundCount}, showing the first ${MAX_CLAIMS_PER_DOC} by consequence`)
}
if (result.unanchoredCount > 0) {
  // Worth knowing while hand-checking: these are the ones the product could
  // not highlight in place, so they would render in a list underneath.
  console.log(`  ${result.unanchoredCount} could not be located in the text`)
}
console.log('')

if (result.claims.length === 0) {
  console.log('  No checkable claims. That is a real answer, not a failure.')
  console.log('')
  process.exit(0)
}

/**
 * Quotes are stored character for character so they can be located in the
 * document, which means they carry the source's line breaks. That is correct
 * for anchoring and unreadable in a terminal list, so the DISPLAY collapses
 * whitespace and wraps. The stored quote is never touched.
 */
const flow = (t: string) => t.replace(/\s+/g, ' ').trim()

function wrap(text: string, width: number, indent: string): string[] {
  const words = flow(text).split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if (line && line.length + 1 + w.length > width) {
      lines.push(line)
      line = w
    } else {
      line = line ? `${line} ${w}` : w
    }
  }
  if (line) lines.push(line)
  return lines.map((l, i) => (i === 0 ? l : indent + l))
}

const GUTTER = ' '.repeat(6 + KIND_WIDTH + 2)
const WIDTH = 92

for (const [i, c] of result.claims.entries()) {
  const n = String(i + 1).padStart(2, ' ')
  const kind = c.kind.padEnd(KIND_WIDTH, ' ')
  const flag = c.span ? ' ' : '?'
  const body = wrap(c.quote, WIDTH, GUTTER)
  console.log(`  ${n}. ${kind}${flag} ${body[0]}`)
  for (const rest of body.slice(1)) console.log(rest)

  // The standalone restatement is what a search would be built from, so it is
  // worth seeing when it says something the quote does not. That gap is
  // usually where an unresolved pronoun was hiding. Skipped when the only
  // difference is whitespace, which would be noise.
  if (flow(c.claimText) !== flow(c.quote)) {
    const alt = wrap(c.claimText, WIDTH - 3, GUTTER + '   ')
    console.log(`${GUTTER}-> ${alt[0]}`)
    for (const rest of alt.slice(1)) console.log(rest)
  }
  console.log('')
}

console.log('')
console.log('  ? = quote could not be located in the document')
console.log('')
console.log('  Now mark each one yourself: verified / unverifiable / contradicted.')
console.log('  The number that matters is what fraction come back unverifiable.')
console.log('')
