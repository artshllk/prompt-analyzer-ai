/**
 * Our own count of what we spent.
 *
 * WHY THIS EXISTS. Tavily's /usage endpoint reported `plan_usage: 0 / 1000`
 * after roughly 35 credits of real work, checked before, between and after
 * three separate extraction passes. It is not lagging by minutes; it did not
 * move at all.
 *
 * A cost guard that reads a number the provider does not update is not a
 * guard, it is a decoration. So we count what we send, from the billing rules
 * rather than from their meter, and treat their number as at best a
 * reconciliation check.
 *
 * BILLING RULES, from Tavily's published pricing:
 *   basic search   1 credit per request
 *   basic extract  1 credit per 5 SUCCESSFUL url extractions
 *   failed extractions are not billed
 *
 * The extract rule is per request, not global, so five URLs across two
 * requests is not one credit. We round each request up, which means our
 * number is an upper bound. An upper bound is the correct direction for a
 * spend guard to be wrong in.
 */

export interface MeterSnapshot {
  searchCalls: number
  extractCalls: number
  /** URLs that actually came back with content. The billed unit. */
  extractedOk: number
  /** URLs the provider named as failed. Not billed. */
  extractedFailed: number
  /** Our upper-bound credit count. Never read from the provider. */
  credits: number
}

const EMPTY: MeterSnapshot = {
  searchCalls: 0,
  extractCalls: 0,
  extractedOk: 0,
  extractedFailed: 0,
  credits: 0,
}

/**
 * Process-local and deliberately simple.
 *
 * This is a spend OBSERVATION, not the spend GUARD. The guard is the daily
 * bucket in the database, which survives a restart and is shared across
 * instances. This exists so a run can be costed honestly in a log, and so the
 * eval can assert that a change did not quietly double what a document costs.
 */
class Meter {
  private state: MeterSnapshot = { ...EMPTY }

  search(): void {
    this.state.searchCalls += 1
    this.state.credits += 1
  }

  extract(okCount: number, failedCount: number): void {
    this.state.extractCalls += 1
    this.state.extractedOk += okCount
    this.state.extractedFailed += failedCount
    // Per request, rounded up: failures are free, and a request that returned
    // nothing costs nothing.
    this.state.credits += Math.ceil(okCount / 5)
  }

  read(): MeterSnapshot {
    return { ...this.state }
  }

  reset(): void {
    this.state = { ...EMPTY }
  }
}

export const meter = new Meter()

export function formatMeter(s: MeterSnapshot = meter.read()): string {
  return (
    `credits~${s.credits} (upper bound, counted by us not by their meter) ` +
    `search=${s.searchCalls} extract=${s.extractCalls} ` +
    `urls_ok=${s.extractedOk} urls_failed=${s.extractedFailed}`
  )
}
