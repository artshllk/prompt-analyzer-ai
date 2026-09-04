/**
 * What a crawler receives, checked from outside, with JavaScript switched off.
 *
 * ===================================================================
 * WHY THIS EXISTS
 * ===================================================================
 *
 * Three times something was correct locally and absent from the HTML a
 * crawler gets, and every time it took a fetch from outside to notice:
 *
 *   the FAQ answers, which were `{isOpen && <answer>}` so a closed answer
 *   never entered the DOM at all
 *
 *   the FAQPage structured data, which did not exist
 *
 *   the Tools menu and both tool links, which were simply not deployed yet
 *
 * `npm test`, `tsc` and `npm run build` were green for all three. They test
 * the source. This tests the artifact.
 *
 * ===================================================================
 * IT STRIPS TAGS BEFORE MATCHING, AND THAT IS NOT COSMETIC
 * ===================================================================
 *
 * React splits text around an interpolation with comment markers, so the
 * pricing page ships:
 *
 *   You can run <!-- -->3<!-- --> checks a month without one.
 *
 * A raw `grep -c "3 checks a month"` returns 0 on that, and it is on the
 * page. I reported a false alarm from exactly this. Any check that greps
 * rendered HTML for a sentence containing a number has to strip tags first
 * or it will cry wolf on correct output.
 *
 *   npx tsx scripts/check-production-html.mts [origin]
 */

const ORIGIN = process.argv[2] ?? 'https://deepclario.com'

interface Check {
  path: string
  /** Present in the visible text, after tags are stripped. */
  text?: string[]
  /** Present in the raw HTML: attributes, JSON-LD, hrefs. */
  raw?: string[]
}

const CHECKS: Check[] = [
  {
    path: '/faq',
    text: [
      // One phrase from every answer. A heading proves nothing: the page had
      // all ten questions and zero answers.
      'It checks the sources in a piece of writing',
      'We never save it',
      'cut straight from the page',
      'We can be wrong',
      'behind a paywall',
      'is the most we check in one document',
      'Without an account you can run',
      'we list the ones with no source',
      'You have to paste the text',
      'Two people, Art Shllaku and Agon',
    ],
    raw: [
      '"@type":"FAQPage"',
      '"acceptedAnswer"',
    ],
  },
  {
    path: '/',
    // Every navigation destination, because a link that only appears after
    // JavaScript is a link a crawler never follows.
    raw: ['href="/detector"', 'href="/playground"', 'href="/pricing"', 'href="/faq"', 'href="/blog"'],
    text: ['Tools', 'AI text detector', 'Prompt improver'],
  },
  {
    path: '/pricing',
    text: ['source checks a month', 'prompt improvements a month', 'AI text detections a month'],
  },
]

function visibleText(html: string): string {
  return html
    // The comment markers React puts around an interpolation.
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
}

let failures = 0
for (const check of CHECKS) {
  const url = `${ORIGIN}${check.path}`
  let html: string
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'deepclario-html-check' } })
    if (!res.ok) {
      console.error(`  FAIL  ${check.path} returned ${res.status}`)
      failures++
      continue
    }
    html = await res.text()
  } catch (err) {
    console.error(`  FAIL  ${check.path} could not be fetched: ${(err as Error).message}`)
    failures++
    continue
  }

  const text = visibleText(html)
  const missingText = (check.text ?? []).filter(t => !text.includes(t))
  // Raw matches are normalised only for whitespace: JSON-LD is minified and
  // attribute quoting is stable, but Next can wrap long attribute lists.
  const flatRaw = html.replace(/\s+/g, '')
  const missingRaw = (check.raw ?? []).filter(t => !flatRaw.includes(t.replace(/\s+/g, '')))

  if (missingText.length === 0 && missingRaw.length === 0) {
    const n = (check.text?.length ?? 0) + (check.raw?.length ?? 0)
    console.log(`  ok    ${check.path}  ${n} strings present without JavaScript`)
    continue
  }
  failures++
  for (const m of missingText) console.error(`  FAIL  ${check.path} missing visible text: "${m}"`)
  for (const m of missingRaw) console.error(`  FAIL  ${check.path} missing in HTML: "${m}"`)
}

console.log(
  failures === 0
    ? `\n  ${ORIGIN} serves everything a crawler needs.`
    : `\n  ${failures} page${failures === 1 ? '' : 's'} incomplete without JavaScript.`
)
process.exit(failures === 0 ? 0 : 1)
