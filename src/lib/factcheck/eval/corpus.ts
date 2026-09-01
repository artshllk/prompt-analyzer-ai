import type { CitationCheck, Claim, ClaimSubject, SourceForm } from '../types'

/**
 * The citation-axis eval corpus.
 *
 * BUILT FROM DEFECTS THAT ACTUALLY HAPPENED, not from invented fabrications.
 * Validation over 64 hand-checked claims across two real published articles
 * found zero invented statistics and five real defects, every one of them a
 * TRUE claim behind a citation that does not support it. Those five are better
 * fixtures than anything synthetic could be, because they are what the product
 * will actually meet.
 *
 * The five, and what each is called here:
 *
 *   wrong_article   a real figure attributed to the wrong article by the same
 *                   publisher, nine months newer than the study it came from
 *   date_qualifier  "as of January 2026" on a figure the source never dates
 *   shifted_ordinal a ranked list with an entry quietly dropped, moving
 *                   something from 5th to 4th
 *   subject_swap    the source says "Teams", the article says "knowledge
 *                   workers". Number right, subject quietly changed
 *   rounding        numbers rounded in the author's favour
 *
 * ===================================================================
 * THE NEAR-MISS SET IS THE POINT, AND IT IS ROUGHLY HALF THE CORPUS
 * ===================================================================
 *
 * A judge that flags every near-miss scores well on recall and destroys the
 * product. `rounding` is the sharpest case and it is deliberately expected to
 * be `supports`: the page contains the figure, and whether the writer rounded
 * in their own favour is a judgement about intent that we refuse to make.
 *
 * Every fixture whose expectation is `supports` is a chance to make a false
 * accusation, and falseDefectRate over that set is the gated metric.
 *
 * Sources are FROZEN TEXT. This corpus runs offline against a stub provider
 * and costs zero retrieval credits. The judge model is the thing under test,
 * so it is the only thing that costs anything.
 */

export type DefectClass =
  | 'clean'
  | 'wrong_article'
  | 'date_qualifier'
  | 'shifted_ordinal'
  | 'subject_swap'
  | 'rounding'
  | 'absent'
  | 'year_off_by_one'
  | 'unit_confusion'

/**
 * Realistic page furniture, wrapped around every fixture source.
 *
 * WRITTEN BECAUSE THE FIXTURES BROKE THE PRODUCT'S OWN GUARD. Raising
 * MIN_READABLE_CHARS to 3,000, from measurements on real paywalled pages,
 * classified every source in this file as a shell, and recall went to zero.
 * The product was right and the corpus was wrong: no real article is four
 * hundred characters long.
 *
 * That is the synthetic-corpus problem in miniature, and it is why this file
 * cannot measure anything. Padding it is a patch on the symptom. Deliberately
 * carries NO digits, so it cannot become a distractor or accidentally satisfy
 * a claim.
 */
const PAGE_FURNITURE = `

About the research

This page is part of an ongoing series looking at how organisations work, how
they buy, and how those patterns shift over time. The series draws on survey
responses gathered across several markets, on interviews with practitioners,
and on data shared with us by participating companies under agreement.

Methodology notes are published alongside each release. Where a figure has been
revised, the revision is recorded in the changelog rather than applied silently
to the original text. Where a question changed wording between waves, we say so,
because a comparison across a changed question is not a comparison.

Readers are welcome to quote from this page. We ask only that quotations name
the wave they came from, since several of the measures here move meaningfully
between releases and a number without its date invites a reader to compare
things that were never comparable.

Related reading

Our earlier work in this area covers adoption patterns, buying committees, and
the gap between what teams say they will do next year and what they turn out to
have done. Those pages are linked from the series index.

Questions about the underlying data, requests for the full crosstabs, and
corrections should go to the research team through the contact page. We publish
corrections in full and we do not remove them.
`.trim()

/**
 * Wrap a fixture source in furniture until it is the length of a real page.
 *
 * Pads to a length rather than a fixed number of repetitions, so a short
 * fixture body cannot quietly fall back under the product's readability floor
 * the next time that floor moves.
 */
function page(body: string): string {
  let out = body
  while (out.length < 4_000) out += `\n\n${PAGE_FURNITURE}`
  return out
}

export interface Fixture {
  id: string
  /** What kind of real-world defect, or `clean` for a citation that is fine. */
  defect: DefectClass
  claimText: string
  figure?: string
  subject?: ClaimSubject
  sourceForm?: SourceForm
  sourceName?: string
  /** The page the writer cited, frozen. */
  source: string
  expect: CitationCheck
  /** Why this is the expected answer. Read this before changing an expectation. */
  because: string
}

const AHREFS_STUDY = page(`Ahrefs Study: 96.55% of Pages Get No Traffic

We studied 1 billion pages and found that 96.55% of all pages in our index get
zero organic search traffic from Google. Another 1.94% get between one and ten
monthly visits. Only 0.63% of pages receive more than 1,000 monthly visits.

The study was run in March 2025 on a sample drawn from the Ahrefs Content
Explorer index. 87% of marketers surveyed use AI to create or help create
content, based on 769 out of 879 respondents.`)

const AHREFS_ROUNDUP = page(`SEO Statistics for 2026

A roundup of the SEO numbers worth knowing this year, updated December 2025.

Search remains the dominant discovery channel. Most pages never rank. AI
Overviews are associated with a 58% lower average click-through rate for the
top-ranking organic page.

For the underlying research on indexing and traffic distribution, see our
earlier study.`)

const COLLAB_REPORT = page(`The State of Work, 2025

Our annual survey covers 9,000 respondents across six countries.

Teams using the platform daily reported saving 4.1 hours per week on average.
Adoption among Teams grew 34.2% year over year.

Respondents outside of Teams were not asked this question.`)

const MARKET_SHARE = page(`Search Engine Market Share, Full Year 2025

Ranked by global share across all devices for the twelve months to December
2025:

1. Google, 89.7%
2. Bing, 4.1%
3. Yandex, 2.6%
4. DuckDuckGo, 1.3%
5. Yahoo, 0.8%
6. Baidu, 0.7%`)

const REVENUE_NOTE = page(`Quarterly Results

Revenue for the quarter was $10,240,000, up from $7.8 million a year earlier.
The company added 34,219 net new customers over the same period.`)

export const CORPUS: Fixture[] = [
  /* ------------------------------------------------- clean, must not flag */
  {
    id: 'clean-exact',
    defect: 'clean',
    claimText: '96.55% of all pages get zero organic search traffic from Google.',
    figure: '96.55%',
    source: AHREFS_STUDY,
    expect: 'supports',
    because: 'The source states this verbatim. Anything else here is a false accusation.',
  },
  {
    id: 'clean-entailed',
    defect: 'clean',
    claimText: 'Fewer than 1% of pages receive more than 1,000 monthly visits.',
    figure: '1%',
    source: AHREFS_STUDY,
    expect: 'supports',
    because: '0.63% is fewer than 1%. Entailment counts as support, or the tool flags honest paraphrase.',
  },
  {
    id: 'clean-reworded',
    defect: 'clean',
    claimText: 'Ahrefs looked at a billion pages for this study.',
    figure: '1 billion',
    source: AHREFS_STUDY,
    expect: 'supports',
    because: 'Same fact, different words. A judge that needs exact phrasing is useless on real prose.',
  },

  /* ------------------------------- rounding: the sharpest near-miss there is */
  {
    id: 'rounding-favourable',
    defect: 'rounding',
    claimText: 'Over 10 million in quarterly revenue.',
    figure: '10 million',
    source: REVENUE_NOTE,
    expect: 'supports',
    because:
      '$10,240,000 is over 10 million. Rounding in the writer\'s favour is a judgement about intent and we refuse to make it. We show the source figure instead.',
  },
  {
    id: 'rounding-up-to-a-third',
    defect: 'rounding',
    claimText: 'Adoption among Teams grew by about a third year over year.',
    figure: 'a third',
    source: COLLAB_REPORT,
    expect: 'supports',
    because: '34.2% is about a third. Flagging this flags every honest paraphrase of a percentage.',
  },
  {
    id: 'rounding-customers',
    defect: 'rounding',
    claimText: 'The company added more than 34,000 customers in the quarter.',
    figure: '34,000',
    source: REVENUE_NOTE,
    expect: 'supports',
    because: '34,219 is more than 34,000.',
  },

  /* -------------------------------------------- the five real defect classes */
  {
    id: 'wrong-article',
    defect: 'wrong_article',
    claimText: '96.55% of all pages get zero organic search traffic from Google.',
    figure: '96.55%',
    source: AHREFS_ROUNDUP,
    expect: 'does_not_contain',
    because:
      'THE COMMONEST REAL DEFECT. The claim is TRUE and this publisher did publish it, just not on this page. Follow the link and the number is not there.',
  },
  {
    id: 'subject-swap',
    defect: 'subject_swap',
    claimText: 'Knowledge workers save 4.1 hours per week using the platform.',
    figure: '4.1 hours',
    source: COLLAB_REPORT,
    expect: 'does_not_contain',
    because:
      'The source says Teams users, and explicitly says everyone else was not asked. The number matches, which is why this is easy to miss and worth catching.',
  },
  {
    id: 'date-qualifier',
    defect: 'date_qualifier',
    claimText: 'As of January 2026, 96.55% of pages get no organic search traffic.',
    figure: '96.55%',
    source: AHREFS_STUDY,
    expect: 'does_not_contain',
    because:
      'The figure is there and the date is not. The source says March 2025. A date qualifier the source never supports is part of the claim.',
  },
  {
    id: 'shifted-ordinal',
    defect: 'shifted_ordinal',
    claimText: 'Yahoo is the fourth largest search engine by global market share.',
    figure: 'fourth',
    source: MARKET_SHARE,
    expect: 'does_not_contain',
    because:
      'The source ranks Yahoo FIFTH. The claim says fourth, which is what happens when a competitor is dropped from a list and everything below moves up. Invisible unless the rank itself is treated as a claim.',
  },
  {
    id: 'absent-entirely',
    defect: 'absent',
    claimText: '42% of marketers say link building is the hardest part of SEO.',
    figure: '42%',
    source: AHREFS_STUDY,
    expect: 'does_not_contain',
    because: 'Plausible, on-topic, and simply not in this source.',
  },

  /* ---------------------- near misses that must NOT be called a defect ----- */
  {
    id: 'near-year-adjacent',
    defect: 'year_off_by_one',
    claimText: 'Ahrefs ran this study in 2025.',
    figure: '2025',
    source: AHREFS_STUDY,
    expect: 'supports',
    because: 'March 2025 is 2025. A judge that trips on a less precise but correct date is unusable.',
  },
  {
    id: 'near-respondent-count',
    defect: 'rounding',
    claimText: 'The survey covered nearly 900 respondents.',
    figure: '900',
    source: AHREFS_STUDY,
    expect: 'supports',
    because: '879 is nearly 900.',
  },
  {
    id: 'near-different-unit',
    defect: 'unit_confusion',
    claimText: 'Teams using the platform daily save over four hours a day.',
    figure: 'four hours',
    source: COLLAB_REPORT,
    expect: 'does_not_contain',
    because:
      'Per week became per day. The number and the subject both match, and only the unit is wrong, which makes it the hardest true defect in the set.',
  },
  {
    id: 'near-top-of-list',
    defect: 'clean',
    claimText: 'Google holds 89.7% of the global search market.',
    figure: '89.7%',
    source: MARKET_SHARE,
    expect: 'supports',
    because: 'Exactly what the source says. Present so the ranked-list source is not only ever a defect.',
  },

  /* --------------------------------------------- the named-publisher path -- */
  {
    id: 'named-found',
    defect: 'clean',
    claimText: '96.55% of all pages get zero organic search traffic from Google.',
    figure: '96.55%',
    sourceForm: 'named',
    sourceName: 'Ahrefs',
    source: AHREFS_STUDY,
    expect: 'supports',
    because: 'No link, but the publisher does say it. The advice is to link it, not that it is wrong.',
  },
]

/** Build a Claim from a fixture. Everything not under test gets a neutral value. */
export function toClaim(f: Fixture): Claim {
  const form: SourceForm = f.sourceForm ?? 'linked'
  return {
    id: f.id,
    quote: f.claimText,
    claimText: f.claimText,
    kind: f.defect === 'shifted_ordinal' ? 'ranking' : 'statistic',
    subject: f.subject ?? 'population',
    sourceForm: form,
    sourceUrl: form === 'linked' ? `https://frozen.test/${f.id}` : undefined,
    sourceName: form === 'named' ? f.sourceName : undefined,
    figure: f.figure,
    looksPublished: true,
    judgement: { verdict: 'unchecked', reason: 'not_checked', evidence: [] },
    citation: { check: 'not_applicable', evidence: [] },
  }
}
