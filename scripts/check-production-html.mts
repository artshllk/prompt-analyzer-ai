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

/**
 * Read, never retyped. The hero prints the ceiling the server applies, so the
 * assertion has to come from the same constant or this script becomes the
 * seventh place a stale number can live.
 */
const { MAX_DOC_CHARS } = await import('../src/lib/factcheck/types.js')
const { CITATION_AUDIT, outOfAudit } = await import('../src/lib/citation-audit.js')

interface Check {
  path: string
  /** Present in the visible text, after tags are stripped. */
  text?: string[]
  /** Present in the raw HTML: attributes, JSON-LD, hrefs. */
  raw?: string[]
  /**
   * ABSENT from the page, in either form.
   *
   * Presence checks catch a thing that stopped shipping. They cannot catch a
   * thing that came back. The hero shed four claims that were not true of
   * this product, and the way each one returns is a revert, a copy-paste from
   * the design file, or somebody rebuilding the console from the mockup
   * without knowing why the tab was dropped. So the removals are pinned too.
   */
  absent?: string[]
}

const CHECKS: Check[] = [
  {
    path: '/faq',
    text: [
      // One phrase from every answer. A heading proves nothing: the page had
      // all ten questions and zero answers.
      //
      // Nine now, not ten. bf2af32 deleted the "who is behind Deepclario"
      // answer, and this list still asserted it, so check:html went red on
      // production the moment that deployed. That is the same failure the
      // "rough"/"bad" note below records: an assertion outliving the copy it
      // pins is how a guard stops being read.
      'It checks the sources in a piece of writing',
      'We never save it',
      'cut straight from the page',
      'We can be wrong',
      'behind a paywall',
      'is the most we check in one document',
      'Without an account you can run',
      'we list the ones with no source',
      'You have to paste the text',
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
    raw: [
      'href="/detector"',
      'href="/prompt-improver"',
      'href="/pricing"',
      'href="/faq"',
      'href="/blog"',
      // The hero's two outbound links. The privacy line points AT the FAQ
      // answer rather than describing how text is handled a second time, and
      // that only works if the anchor is really in the markup.
      'href="/how-it-works"',
      'href="/faq#do-you-keep-my-writing"',
    ],
    text: [
      // The blurbs: they are the only thing telling a reader what these two
      // nouns are, and they live inside the same collapsed panel.
      'Tools',
      'AI text detector',
      'Prompt improver',
      'See if text was written by AI',
      // Stale since f3c2a16 renamed it. The script kept saying "rough" and
      // this check has been red on production ever since, which is how a
      // guard stops being read.
      'Rewrite a bad prompt',

      // ---------------------------------------------------------------
      // THE HERO. Every sentence in it, pinned.
      //
      // The console is a client component, so the whole hero would be a blank
      // box for a crawler if it ever stopped server-rendering. It also
      // carries the four promises this product is judged on, and those are
      // the sentences most worth knowing about the day they change.
      // ---------------------------------------------------------------
      'Does your source really say that?',
      'Paste your article. We open every link and check that the page really says it.',
      'Paste article',
      'Load a sample',
      // The ceiling, read from the constant the server enforces it with.
      `/ ${MAX_DOC_CHARS.toLocaleString()} characters`,
      'We do not save your writing.',
      'How we handle it',
      'We open every link in your text, so do not paste private ones.',
      'We do not judge your numbers.',
      'We show you the sentence from the page and let you decide.',
      'Check my links',
      'How we check a link, and what we found in 114 real numbers',

      // ---------------------------------------------------------------
      // THE REAL EXAMPLE. Two cards side by side, and the swap is the
      // product. Both chips and both footer subjects, because a card that
      // rendered without its labels would still look fine and would have
      // stopped making the argument.
      // ---------------------------------------------------------------
      'Published article claim',
      'Original primary source',
      'The article says',
      'The page they link to says',
      'Subjects swapped',
      'What the page shows',
      'How we check a link',
      'The words are swapped, and one number is rounded differently.',

      // ---------------------------------------------------------------
      // THE FOUR STATES, and the counts under them. The counts come from
      // lib/citation-audit.ts, which pricing-copy.test.ts asserts against
      // docs/citation-audit/coverage.md, so a number here is three hops
      // from a published table and none of the hops is a person retyping.
      // ---------------------------------------------------------------
      'We tell you which kind of nothing.',
      'No link at all',
      'Behind a paywall',
      'Dead link',
      'Live dashboard',
      'In our audit',
      outOfAudit(CITATION_AUDIT.noSource),
      outOfAudit(CITATION_AUDIT.paywalled),

      // The trust cards.
      'Your writing stays yours.',
      'Never used to train AI',
      'Delete everything anytime',
      'Payments by Paddle',

      // The one line that survives where the pricing table used to be.
      'See what Pro adds',
    ],
    absent: [
      // Four claims the approved design carried that this product cannot
      // make. See docs/design/hero-console.html for what was signed off and
      // the comment above CheckClient's console for why each one went.
      'Import URL',
      'headless chromium',
      'DOM Engine',
      'Live link & number verification',
      'v1.4',
      // The pill pulsed. Nothing on this site pulses.
      'animate-pulse',

      // The same class of invention, from the mockups for the sections under
      // the hero. See the test 'the mockup furniture is gone from the worked
      // example' for what each one would be claiming.
      'Case ID',
      'Live Link Spider',
      'Target DOM',
      'Zero human opinion',
      'Raw text match',
      // One digit from the real 48.2%, and the reason lib/citation-audit.ts
      // exists.
      '51.2%',
      'HTTP 401',
      'Time-variant',

      // THE PRICING TABLE, which now lives at /pricing and nowhere else.
      // Two copies of a price is two things that can be read while one is
      // being edited. If any of these come back on the homepage, so has the
      // duplication.
      'Free to start. Pay when you need more.',
      'Most popular',
      'Tier 0',
      'Billed monthly',

      // The primary source is a real company that has not agreed to appear in
      // our marketing. We quote the sentence, because that is the example; we
      // do not put their domain on the page to sell a tool. Same rule that
      // already keeps the publisher who made the mistake unnamed.
      'sparktoro',
      'SparkToro',

      // The founder's note, removed from EarlyDays.tsx along with the owner's
      // name. Pinned absent so a copy-paste from an old revision shows up here
      // rather than on the live page.
      'Early days',
      'Deepclario is new, so you will not find made-up reviews here.',
      'Art Shllaku',
      'Founder, Deepclario',

      // The rest of the diff-inspector mockup's inventions. The two quote
      // lead-ins are the worst of them: fabricated fragments inside quotation
      // marks, attributed to real publications, on the page that argues
      // misquoting a source is the defect we exist to catch.
      'Paragraph 8',
      'anchor text',
      'Raw text match',
      'According to recent search query research',
      'our deep sample confirmed',
      'High-traffic technical guide',
    ],
  },
  {
    // THE PAGE THE HERO'S SUB-LINK PROMISES. It says "what we found in 114
    // real numbers", so the 114 has to be here, on the page it sends people
    // to. Verified before that line shipped; pinned so it stays verified.
    path: '/how-it-works',
    text: ['114 numbers across 11'],
  },
  {
    // Renamed from /playground. Its title and description are what a search
    // result shows, so an empty or default one is a page nobody clicks.
    path: '/prompt-improver',
    text: [
      /**
       * THE "no account" CLAIM, PINNED.
       *
       * This one and the meta description below are now the most load-bearing
       * sentences on the site: they are what a stranger reads in a search
       * result for "prompt improver" before deciding to click.
       *
       * Verified end to end from a clean cookie jar before pinning: the page
       * sets no gate, POST /api/anon/analyze answers with no session, and a
       * full clarify-then-rewrite round trip returned a 607-character
       * improved prompt with no signup prompt, modal or wall anywhere in the
       * response.
       *
       * The headline above them is NOT pinned. It moved from "rough" to "bad"
       * mid-session, and a check that breaks on ordinary copy edits trains
       * people to ignore it. Pin the claim, not the wording.
       */
      'No account, no install',
    ],
    raw: [
      'rel="canonical"href="https://deepclario.com/prompt-improver"',
      'FreePromptImprover',
      // The meta description, whitespace-stripped like every raw match here.
      'Free,noaccountneeded',
    ],
  },
  {
    /**
     * THE DETECTOR, WHICH THIS SCRIPT DID NOT COVER UNTIL IT CHANGED SHAPE.
     *
     * /detector used to serve two audiences from one route: it read the
     * session and rendered either the marketing layout or the app shell. It is
     * now the public page only, with /detect as the signed-in view. That split
     * moved the SEO section, both schemas and the canonical across a rewrite,
     * and none of it was pinned anywhere.
     *
     * The section below the tool is the entire reason this page ranks for
     * "AI text detector" intent, and it renders only on the public page. If
     * the split ever regresses and this route starts reading the session
     * again, a signed-in render drops the whole section and the schemas with
     * it. That failure is invisible to types, to the build and to npm test,
     * because all three test the source. This tests the artifact.
     */
    path: '/detector',
    text: [
      // The hero. The console is a client component, so this is also the
      // proof the page still server-renders at all.
      'Was this written by AI ?',
      'Paste the text. We show you the signs we found.',
      // The promise the whole product is built on. See decision 0002.
      'We never give a score out of 100. Nobody can.',

      // The SEO section, heading and body for each block. A heading proves
      // nothing on its own: the FAQ shipped all ten questions and zero
      // answers, which is the bug this script was written for.
      'How the AI text detector works',
      'sentence-length burstiness, vocabulary diversity, em-dash density, transition-word frequency',
      'three plain bands, likely human, mixed, or likely AI',
      'Is AI content detection accurate?',
      'false-positive rate on human writing',
      'Stanford research found they flag non-native English speakers',
      'AI text detector FAQ',

      // Every question, and a phrase from every answer, the same way /faq
      // does it. These are the four questions the FAQPage schema is built
      // from, so a mismatch here is also a mismatch in the rich result.
      'What is an AI text detector?',
      'estimates whether a passage was written by a person',
      'Is the AI text detector free?',
      'raises that to five texts every 24 hours',
      'Can it detect ChatGPT, Claude, and Gemini text?',
      'statistical fingerprints common to modern large language models',
      'How accurate is AI content detection?',
      'never shows a made-up percentage',
    ],
    raw: [
      // The title is what a stranger reads in a search result for "ai
      // detector" before deciding to click, and it carries the site template.
      '<title>Free AI Text Detector - Shows Its Work | Deepclario</title>',
      // If the split ever regressed to serving the app shell, this is the
      // first thing that would vanish.
      'rel="canonical" href="https://deepclario.com/detector"',
      '"@type":"WebApplication"',
      '"@type":"FAQPage"',
      '"acceptedAnswer"',
      /**
       * The app schema references the one Organization rather than minting
       * its own, so a copy-paste of the old inline publisher shows up here.
       *
       * ANCHORED TO THE OFFERS FIELD ON PURPOSE. The bare publisher string
       * also appears in the root layout's WebSite node, so on its own it
       * passed with this page's entire schema block deleted. Proved by
       * deleting it: everything else here failed and that line did not.
       */
      '"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"publisher":{"@id":"https://deepclario.com/#organization"}',
    ],
  },
  {
    // THE ONLY PLACE PRICING RENDERS. The chrome moved here with it, so the
    // chips are asserted on the page that owns them.
    path: '/pricing',
    text: [
      'source checks a month',
      'prompt improvements a month',
      'AI text detections a month',
      'Free to start. Pay when you need more.',
      'Tier 0',
      'Most popular',
    ],
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
  // Both forms, because a returning claim can come back as visible copy or as
  // a class name, and `animate-pulse` only ever appears as the latter.
  const returned = (check.absent ?? []).filter(
    t => text.includes(t) || flatRaw.includes(t.replace(/\s+/g, ''))
  )

  if (missingText.length === 0 && missingRaw.length === 0 && returned.length === 0) {
    const n =
      (check.text?.length ?? 0) + (check.raw?.length ?? 0) + (check.absent?.length ?? 0)
    console.log(`  ok    ${check.path}  ${n} strings check out without JavaScript`)
    continue
  }
  failures++
  for (const m of missingText) console.error(`  FAIL  ${check.path} missing visible text: "${m}"`)
  for (const m of missingRaw) console.error(`  FAIL  ${check.path} missing in HTML: "${m}"`)
  for (const m of returned) {
    console.error(`  FAIL  ${check.path} says "${m}", which this product does not do`)
  }
}

console.log(
  failures === 0
    ? `\n  ${ORIGIN} serves everything a crawler needs.`
    : `\n  ${failures} page${failures === 1 ? '' : 's'} incomplete without JavaScript.`
)
process.exit(failures === 0 ? 0 : 1)
