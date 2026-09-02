/**
 * What the model calls actually cost, counted rather than estimated.
 *
 * The Tavily meter next door counts credits. This counts the other half of the
 * bill, and it exists for one reason: on this product the model spend is not
 * per document, it is per CLAIM, and the two scale completely differently.
 *
 * Extraction is one call per document whose output grows with how many claims
 * the document holds. Judging is one call per claim checked, capped. So a
 * document with 89 claims and one with 6 pay very different extraction bills
 * and the same judge bill per claim. Any pricing built on a flat
 * "cents per document" is averaging over that difference, and the average is
 * not where the money is.
 *
 * Prices are per million tokens, from the models file. They are the one thing
 * here that can go stale, so they live in a single object with the model name
 * next to them rather than being folded into a rate.
 */

export interface TokenPrice {
  /** USD per million input tokens. */
  in: number
  /** USD per million output tokens. Includes hidden reasoning tokens. */
  out: number
}

export const PRICES: Record<string, TokenPrice> = {
  'gpt-5.4-mini': { in: 0.75, out: 4.5 },
}

export interface CallRecord {
  stage: string
  model: string
  promptTokens: number
  completionTokens: number
  ms: number
}

/** USD for one call. Unknown models cost 0 and say so by being absent. */
export function costOf(r: CallRecord): number {
  const p = PRICES[r.model]
  if (!p) return 0
  return (r.promptTokens * p.in + r.completionTokens * p.out) / 1_000_000
}

class TokenMeter {
  private calls: CallRecord[] = []
  /** Set by whoever is running a measurement. Off in production. */
  private stage = ''

  /** Label the calls that happen inside `fn`. */
  async under<T>(stage: string, fn: () => Promise<T>): Promise<T> {
    const before = this.stage
    this.stage = stage
    try {
      return await fn()
    } finally {
      this.stage = before
    }
  }

  record(model: string, promptTokens: number, completionTokens: number, ms: number): void {
    this.calls.push({ stage: this.stage, model, promptTokens, completionTokens, ms })
  }

  read(): CallRecord[] {
    return [...this.calls]
  }

  reset(): void {
    this.calls = []
  }

  /** Total USD, or the total for one stage. */
  usd(stage?: string): number {
    return this.calls
      .filter(c => stage === undefined || c.stage === stage)
      .reduce((sum, c) => sum + costOf(c), 0)
  }

  count(stage?: string): number {
    return this.calls.filter(c => stage === undefined || c.stage === stage).length
  }
}

export const tokenMeter = new TokenMeter()
