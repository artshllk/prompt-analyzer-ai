/**
 * Statistical signals for AI-detection.
 *
 * Every value here is a real measurable thing - pure text math, no LLM
 * judgement. The orchestrator combines them into a verdict band and an
 * LLM-written reasoning, but the numbers themselves are deterministic
 * and reproducible. That's our transparency edge.
 *
 * Human writing on average:
 *   - higher burstiness (mixes short + long sentences)
 *   - more punctuation variety, fewer em-dashes mid-sentence
 *   - lower transition-word density
 *   - lower AI-cliché phrase density
 *   - more variable vocabulary
 *
 * LLM writing on average:
 *   - lower burstiness (sentences hover around the same length)
 *   - heavy em-dash use mid-sentence
 *   - dense transition words (however, moreover, furthermore)
 *   - frequent AI-cliché phrases
 *   - safer, more repetitive vocabulary
 *
 * Each of these is a *tendency*, not a rule. A human writer can have
 * low burstiness; an LLM can be coaxed into bursty prose. That's why we
 * never report a single percentage - we report the signals openly.
 */

import { splitSentences } from './sentences'
import { findCliches, type ClicheHit } from './cliches'

const TRANSITION_WORDS = [
  'however', 'moreover', 'furthermore', 'additionally', 'therefore',
  'consequently', 'subsequently', 'nevertheless', 'nonetheless', 'thus',
  'hence', 'accordingly', 'meanwhile', 'specifically', 'particularly',
  'importantly', 'notably', 'crucially',
]

const TRANSITION_RE = new RegExp(
  `\\b(${TRANSITION_WORDS.join('|')})\\b`,
  'gi',
)

export interface Signals {
  /** Words in the input. */
  wordCount: number
  /** Sentences in the input. */
  sentenceCount: number
  /** Mean sentence length in words. */
  meanSentenceLength: number
  /** Sample standard deviation of sentence length. Higher = more bursty
   *  = more human-like (humans mix short and long sentences). */
  sentenceLengthStdDev: number
  /** Coefficient of variation: stddev / mean. Normalised burstiness
   *  that's comparable across short and long texts. */
  burstiness: number
  /** Type-token ratio (unique words / total words). Higher = richer
   *  vocabulary. Capped to first 500 words so it isn't punished by length. */
  typeTokenRatio: number
  /** Em-dashes per 100 words. Heavy use is a strong LLM signal. */
  emDashDensity: number
  /** Transition words per 100 words. Heavy use is an LLM signal. */
  transitionDensity: number
  /** Weighted AI-cliché phrase score per 100 words. */
  clicheScore: number
  /** The actual cliché hits, for highlighting. */
  clicheHits: ClicheHit[]
  /** Sentences that start with a common LLM lead-in pattern. */
  llmLeadInCount: number
}

const LLM_LEAD_INS = [
  /^certainly[,!]/i,
  /^of course[,!]/i,
  /^absolutely[,!]/i,
  /^great question/i,
  /^that's a great/i,
  /^as an ai/i,
  /^as a (large )?language model/i,
  /^in conclusion[,]/i,
  /^to summari[sz]e[,]/i,
  /^let's (delve|dive|explore|unpack)/i,
]

function variance(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const sq = values.reduce((s, v) => s + (v - mean) ** 2, 0)
  return sq / (values.length - 1)
}

export function computeSignals(text: string): Signals {
  const cleaned = text.trim()
  if (!cleaned) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      meanSentenceLength: 0,
      sentenceLengthStdDev: 0,
      burstiness: 0,
      typeTokenRatio: 0,
      emDashDensity: 0,
      transitionDensity: 0,
      clicheScore: 0,
      clicheHits: [],
      llmLeadInCount: 0,
    }
  }

  const sentences = splitSentences(cleaned)
  const sentenceLengths = sentences.map(
    s => s.split(/\s+/).filter(Boolean).length,
  )

  const words = cleaned.split(/\s+/).filter(Boolean)
  const wordCount = words.length

  const meanLen = sentenceLengths.length
    ? sentenceLengths.reduce((s, v) => s + v, 0) / sentenceLengths.length
    : 0
  const stdDev = Math.sqrt(variance(sentenceLengths))
  const burstiness = meanLen > 0 ? stdDev / meanLen : 0

  // Vocabulary diversity, capped at 500 words so longer texts don't
  // get unfairly penalised (TTR drops naturally with length).
  const sample = words.slice(0, 500).map(w => w.toLowerCase().replace(/[^a-z']/g, ''))
  const uniques = new Set(sample.filter(Boolean))
  const ttr = sample.length ? uniques.size / sample.length : 0

  const emDashes = (cleaned.match(/-/g) || []).length
  const emDashDensity = wordCount > 0 ? (emDashes / wordCount) * 100 : 0

  const transitions = (cleaned.match(TRANSITION_RE) || []).length
  const transitionDensity = wordCount > 0 ? (transitions / wordCount) * 100 : 0

  const clicheHits = findCliches(cleaned)
  const clicheWeight = clicheHits.reduce((s, h) => s + h.weight, 0)
  const clicheScore = wordCount > 0 ? (clicheWeight / wordCount) * 100 : 0

  const llmLeadInCount = sentences.filter(s =>
    LLM_LEAD_INS.some(re => re.test(s.trim())),
  ).length

  return {
    wordCount,
    sentenceCount: sentences.length,
    meanSentenceLength: Math.round(meanLen * 10) / 10,
    sentenceLengthStdDev: Math.round(stdDev * 10) / 10,
    burstiness: Math.round(burstiness * 1000) / 1000,
    typeTokenRatio: Math.round(ttr * 1000) / 1000,
    emDashDensity: Math.round(emDashDensity * 100) / 100,
    transitionDensity: Math.round(transitionDensity * 100) / 100,
    clicheScore: Math.round(clicheScore * 100) / 100,
    clicheHits,
    llmLeadInCount,
  }
}

/**
 * Convert raw signal values into per-signal "lean" values from -1 to 1.
 * -1 = strongly leans human
 *  0 = neutral
 * +1 = strongly leans AI
 *
 * Thresholds are based on observed distributions in human vs LLM corpora,
 * but they're heuristics - refined as we collect real usage data.
 */
export interface SignalLeans {
  burstiness: number       // low burstiness leans AI
  vocabulary: number       // low TTR leans AI
  emDashes: number         // high density leans AI
  transitions: number      // high density leans AI
  cliches: number          // high cliché score leans AI
  llmLeadIns: number       // any presence leans AI
}

export function computeLeans(s: Signals): SignalLeans {
  // Burstiness: humans tend to be 0.45+, LLMs cluster around 0.25–0.35
  const burstiness = s.sentenceCount >= 3 ? clamp(map(s.burstiness, 0.55, 0.20, -1, 1)) : 0

  // TTR: humans on short texts ~0.65+, LLMs slightly lower
  const vocabulary = s.wordCount >= 30 ? clamp(map(s.typeTokenRatio, 0.75, 0.45, -1, 1)) : 0

  // Em-dashes: above 1 per 100 words is high
  const emDashes = clamp(map(s.emDashDensity, 0, 2.0, -0.2, 1))

  // Transition density: 0.5 per 100 words is normal, 2+ is heavy
  const transitions = clamp(map(s.transitionDensity, 0.2, 2.0, -0.3, 1))

  // Cliché score: any cliché is a small lean toward AI
  const cliches = clamp(map(s.clicheScore, 0, 3.0, -0.2, 1))

  const llmLeadIns = s.llmLeadInCount > 0 ? 1 : 0

  return { burstiness, vocabulary, emDashes, transitions, cliches, llmLeadIns }
}

/**
 * Combine the per-signal leans into a single verdict band. We're
 * deliberately conservative - three bands, never a fake percentage.
 */
export type VerdictBand = 'likely-human' | 'mixed' | 'likely-ai'

export function verdictFromLeans(leans: SignalLeans, signals: Signals): {
  band: VerdictBand
  // 0–1, used only to drive copy + UI prominence, never shown as a number.
  intensity: number
} {
  // If text is very short, we can't say much.
  if (signals.wordCount < 30) {
    return { band: 'mixed', intensity: 0.3 }
  }

  // Weighted sum. Burstiness and vocabulary carry more weight because
  // they're the most studied signals; cliché/em-dash/transition are
  // tie-breakers, not primary evidence.
  const weighted =
    leans.burstiness * 0.32 +
    leans.vocabulary * 0.22 +
    leans.cliches * 0.16 +
    leans.transitions * 0.12 +
    leans.emDashes * 0.10 +
    leans.llmLeadIns * 0.08

  if (weighted >= 0.35) return { band: 'likely-ai', intensity: Math.min(1, weighted + 0.1) }
  if (weighted <= -0.30) return { band: 'likely-human', intensity: Math.min(1, -weighted + 0.1) }
  return { band: 'mixed', intensity: Math.abs(weighted) }
}

function clamp(n: number, lo = -1, hi = 1) {
  return Math.max(lo, Math.min(hi, n))
}

/** Linearly map x from [from, to] (in input space) to [outFrom, outTo]. */
function map(x: number, from: number, to: number, outFrom: number, outTo: number) {
  if (from === to) return outFrom
  const t = (x - from) / (to - from)
  return outFrom + t * (outTo - outFrom)
}
