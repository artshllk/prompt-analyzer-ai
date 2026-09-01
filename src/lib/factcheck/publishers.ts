/**
 * Publisher name to domain, for the named-source path.
 *
 * When a writer says "according to Ahrefs" and gives no link, the only way to
 * check it is to search ahrefs.com. That needs a domain, and the writer gave
 * us a name.
 *
 * MEASURED FREQUENCY: this path is small. Across six real stats-heavy articles
 * and 483 statistic-bearing units, only 2.9% named a publisher without linking
 * it. Attribution phrases were absent entirely from five of the six. This
 * genre either links or says nothing, so a seeded map plus a conservative
 * miss is the right amount of machinery. It is deliberately NOT a resolver
 * that guesses: a wrong domain would search the wrong site, find nothing, and
 * report `does_not_contain` about a citation that was fine, which is the exact
 * false accusation the product is built to avoid.
 *
 * WHEN A NAME IS NOT IN HERE WE SAY NOTHING. domainsFor() returns empty, the
 * claim keeps `not_applicable`, and the writer is told nothing rather than
 * told something wrong. Adding a name is a one-line edit.
 */

const MAP: Record<string, string[]> = {
  // SEO and content marketing, which is where this genre lives
  ahrefs: ['ahrefs.com'],
  semrush: ['semrush.com'],
  moz: ['moz.com'],
  backlinko: ['backlinko.com'],
  hubspot: ['hubspot.com', 'blog.hubspot.com'],
  wordstream: ['wordstream.com'],
  buffer: ['buffer.com'],
  hootsuite: ['hootsuite.com', 'blog.hootsuite.com'],
  sproutsocial: ['sproutsocial.com'],
  'sprout social': ['sproutsocial.com'],
  wyzowl: ['wyzowl.com'],
  'content marketing institute': ['contentmarketinginstitute.com'],
  cmi: ['contentmarketinginstitute.com'],
  siegemedia: ['siegemedia.com'],
  'siege media': ['siegemedia.com'],

  // research and analyst houses
  gartner: ['gartner.com'],
  forrester: ['forrester.com'],
  mckinsey: ['mckinsey.com'],
  deloitte: ['deloitte.com'],
  pwc: ['pwc.com'],
  accenture: ['accenture.com'],
  bain: ['bain.com'],
  idc: ['idc.com'],
  nielsen: ['nielsen.com'],
  statista: ['statista.com'],
  'pew research center': ['pewresearch.org'],
  pew: ['pewresearch.org'],
  'pew research': ['pewresearch.org'],
  gallup: ['gallup.com'],
  ipsos: ['ipsos.com'],
  yougov: ['yougov.com'],
  'harvard business review': ['hbr.org'],
  hbr: ['hbr.org'],
  'mit sloan': ['sloanreview.mit.edu'],

  // platforms that publish their own numbers
  google: ['google.com', 'blog.google', 'thinkwithgoogle.com'],
  'think with google': ['thinkwithgoogle.com'],
  microsoft: ['microsoft.com'],
  meta: ['meta.com', 'about.fb.com'],
  linkedin: ['linkedin.com', 'business.linkedin.com'],
  salesforce: ['salesforce.com'],
  adobe: ['adobe.com', 'business.adobe.com'],
  shopify: ['shopify.com'],
  stripe: ['stripe.com'],
  zendesk: ['zendesk.com'],
  intercom: ['intercom.com'],
  asana: ['asana.com'],
  slack: ['slack.com'],
  zoom: ['zoom.com', 'zoom.us'],
  atlassian: ['atlassian.com'],
  openai: ['openai.com'],
  anthropic: ['anthropic.com'],

  // official statistics
  'bureau of labor statistics': ['bls.gov'],
  bls: ['bls.gov'],
  'census bureau': ['census.gov'],
  'us census': ['census.gov'],
  eurostat: ['ec.europa.eu'],
  oecd: ['oecd.org'],
  'world bank': ['worldbank.org'],
  'small business administration': ['sba.gov'],
  sba: ['sba.gov'],
  'office for national statistics': ['ons.gov.uk'],
  ons: ['ons.gov.uk'],

  // press
  reuters: ['reuters.com'],
  bloomberg: ['bloomberg.com'],
  'financial times': ['ft.com'],
  'wall street journal': ['wsj.com'],
  wsj: ['wsj.com'],
  'new york times': ['nytimes.com'],
  nyt: ['nytimes.com'],
  techcrunch: ['techcrunch.com'],
  'the verge': ['theverge.com'],
  wired: ['wired.com'],
  forbes: ['forbes.com'],
  'the economist': ['economist.com'],
  cnbc: ['cnbc.com'],
  bbc: ['bbc.co.uk', 'bbc.com'],
  guardian: ['theguardian.com'],
  'the guardian': ['theguardian.com'],
}

/**
 * Strip the words a writer wraps a publisher's name in.
 *
 * "a 2025 Gartner study" and "the Pew Research Center" both have to land on
 * the same key as "Gartner" and "Pew Research Center". Years, articles and
 * the handful of nouns that always trail a citation come off; nothing else
 * does, because aggressive stripping is how you turn one publisher's name into
 * another's.
 */
export function normalizePublisher(name: string): string {
  return name
    .toLowerCase()
    .replace(/[""''`]/g, '')
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/\b(a|an|the|its|their)\b/g, ' ')
    .replace(/\b(study|studies|report|reports|survey|surveys|research|data|analysis|blog|article|paper|index|poll)\b/g, ' ')
    // Attribution phrasing, in case the extractor hands back the whole
    // construction rather than the bare name. "according to Ahrefs" has to
    // land on the same key as "Ahrefs".
    .replace(/\b(according to|reported by|published by|found by|cited by|source|sources|per|via|says|said)\b/g, ' ')
    .replace(/[^a-z0-9 &.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // Internal dots stay, because "ahrefs.com" is a name somebody writes.
    // A trailing one is always sentence punctuation and never part of a
    // publisher, and leaving it on made "Ahrefs." miss "Ahrefs".
    .replace(/^[.-]+|[.-]+$/g, '')
    .trim()
}

/**
 * The map, re-keyed through the normalizer at load.
 *
 * Written because a test caught a real bug: "pew research center" strips its
 * own middle word, because `research` is one of the citation nouns writers
 * trail after a publisher's name. That key could therefore never be reached
 * by any input, including itself. It looked like coverage while being dead.
 *
 * Hand-matching every key against the stripper is the kind of correctness that
 * survives exactly until the next entry is added. Normalizing both sides makes
 * it true by construction instead.
 */
const LOOKUP: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {}
  for (const [name, domains] of Object.entries(MAP)) {
    const key = normalizePublisher(name)
    if (key && !out[key]) out[key] = domains
  }
  return out
})()

/**
 * Domains to search for a named publisher, or empty when we do not know.
 *
 * Empty is a real and safe answer. It means the claim keeps `not_applicable`
 * and the writer hears nothing about it, which is always better than searching
 * the wrong site and reporting that their citation is missing.
 */
export function domainsFor(name: string): string[] {
  const key = normalizePublisher(name)
  if (!key) return []
  if (LOOKUP[key]) return LOOKUP[key]

  // One narrow fallback: a name written as its own domain. "ahrefs.com".
  const bare = key.replace(/\.(com|org|net|io|co\.uk|gov)$/, '')
  if (LOOKUP[bare]) return LOOKUP[bare]

  return []
}

/** Exposed so a test can assert every name in the map is actually reachable. */
export const PUBLISHER_NAMES: readonly string[] = Object.keys(MAP)
