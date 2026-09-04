/**
 * The citation audit, as numbers instead of prose.
 *
 * Every figure here is a count from `docs/citation-audit/coverage.md`, which
 * is 114 statistics read out of 11 stats-heavy articles with no judge calls
 * and no human labelling. They are counts, so they can be checked by hand
 * against that table, and they add up, which the test below this file's
 * consumers asserts.
 *
 * IT EXISTS BECAUSE THE TAXONOMY CARDS PRINT THESE. A card that says "51.2%
 * frequency in corpus" is the exact shape of the five copy-versus-reality
 * bugs already written up in CLAUDE.md: a plausible number, typed near a real
 * measurement, that nobody re-derives. The real share of statistics citing
 * nothing is 48.2%, not 51.2%, and the way to stop that recurring is for the
 * page to have no opinion of its own about what the number is.
 *
 * Do not add a figure here that is not in the audit. If a card needs a number
 * the audit did not measure, the card ships without the number.
 */
export const CITATION_AUDIT = {
  /** Statistics read. */
  statistics: 114,
  /** Articles they were read out of. */
  articles: 11,
  /** Cited a source we could open and read. */
  readable: 34,
  /** Cited a source behind a paywall. */
  paywalled: 20,
  /** Cited a link that is gone. */
  dead: 3,
  /** Cited a page that only ever shows current data. */
  live: 2,
  /** Cited nothing at all. The largest group. */
  noSource: 55,
} as const

/**
 * The SECOND audit, and it is a different set of documents.
 *
 * `docs/citation-audit/flags-by-cause.md` reads 59 claims across six named
 * publishers and splits the raw flag rate by cause. It is not the 114, and the
 * two must never be mixed: the 114 answers "how much of an article can we say
 * anything about", this answers "when we flag something, whose fault is it".
 *
 * `contextMismatch` is the class the worked example belongs to: the figure IS
 * on the page and is attached to something else. The subject-swap. It is the
 * defect a writer never catches by eye, which is the entire argument for the
 * product, so the page is allowed to say how often we saw it.
 *
 * Counts are the Context-mismatch column of that table, summed:
 * 1 + 4 + 1 + 2 + 2 + 3 = 13, against 12 + 14 + 12 + 13 + 4 + 4 = 59 claims.
 */
export const FLAG_AUDIT = {
  /** Claims read across six publishers. */
  claims: 59,
  /** Of those, the ones we flagged at all. */
  flagged: 39,
  /** The figure is on the page, attached to something else. */
  contextMismatch: 13,
  /** The writer's-error class: a citation that did not support its claim. */
  writersError: 26,
} as const

/**
 * A share of the audit, to one decimal place.
 *
 * One decimal because that is the precision the counts support: 55/114 is
 * 48.2%, and rounding it to 48% throws away a digit a reader could check,
 * while a second decimal would claim a precision 114 samples do not have.
 */
export function shareOfAudit(count: number): string {
  return `${((count / CITATION_AUDIT.statistics) * 100).toFixed(1)}%`
}

/** "55 of 114". The form a reader can verify against the audit table. */
export function outOfAudit(count: number): string {
  return `${count} of ${CITATION_AUDIT.statistics}`
}
