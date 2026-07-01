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
 *   - more varied sentence openings
 *   - lower transition-word density
 *   - lower AI-cliché phrase density
 *   - more variable vocabulary
 *
 * LLM writing on average:
 *   - lower burstiness (sentences hover around the same length)
 *   - heavy em-dash use mid-sentence (the real — U+2014, not a hyphen)
 *   - repetitive sentence openings ("This", "It", "In", "Additionally")
 *   - dense transition words (however, moreover, furthermore)
 *   - frequent AI-cliché phrases
 *   - safer, more repetitive vocabulary
 *
 * Each of these is a *tendency*, not a rule. A human writer can have
 * low burstiness; an LLM can be coaxed into bursty prose. That's why we
 * never report a single percentage - we report the signals openly.
 *
 * CALIBRATION NOTE (2026): thresholds and weights below are tuned against
 * the seed corpus in ./__fixtures__/corpus.ts. Frontier models now write
 * with high burstiness and rich vocabulary, so those two classic signals
 * carry LESS weight than they used to; the lexical/punctuation tells
 * (em-dashes, clichés, opening repetition) carry more. Re-run
 * `npx tsx src/lib/detector/eval.ts` after any change here.
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

// Real dash glyphs LLMs overuse: em-dash (—, U+2014) and en-dash
// (–, U+2013). Deliberately NOT the ASCII hyphen (-, U+002D), which is
// common in ordinary human hyphenated compounds ("well-known") and was
// the source of the original miscount.
const DASH_RE = /[—–]/g

// Punctuation marks we measure entropy over. Variety here leans human.
const PUNCT_MARKS = ['.', ',', ';', ':', '!', '?', '(', ')', '"', "'", '—']

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
  /** Real em/en-dashes per 100 words. Heavy use is a strong LLM signal. */
  emDashDensity: number
  /** Transition words per 100 words. Heavy use is an LLM signal. */
  transitionDensity: number
  /** Weighted AI-cliché phrase score per 100 words. */
  clicheScore: number
  /** The actual cliché hits, for highlighting. */
  clicheHits: ClicheHit[]
  /** Sentences that start with a common LLM lead-in pattern. */
  llmLeadInCount: number
  /** Ratio of unique sentence-opening words to sentence count (0–1).
   *  LLMs reuse openings; low diversity leans AI. */
  openingDiversity: number
  /** Normalised Shannon entropy (0–1) of punctuation usage. Low variety
   *  leans AI. */
  punctuationEntropy: number
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

/** Unique first-word / sentence-count ratio. Neutral (1) when too few
 *  sentences to judge. */
function computeOpeningDiversity(sentences: string[]): number {
  if (sentences.length < 4) return 1
  const openings = sentences.map(s => {
    const first = s.trim().split(/\s+/)[0] ?? ''
    return first.toLowerCase().replace(/[^a-z']/g, '')
  }).filter(Boolean)
  if (openings.length === 0) return 1
  const unique = new Set(openings).size
  return unique / openings.length
}

/** Normalised Shannon entropy of punctuation-mark usage, 0–1. Neutral
 *  (1) when there's essentially no punctuation to measure. */
function computePunctuationEntropy(text: string): number {
  const counts = PUNCT_MARKS.map(m => {
    // Count occurrences of each literal mark.
    let n = 0
    for (let i = 0; i < text.length; i++) if (text[i] === m) n++
    return n
  })
  const total = counts.reduce((s, v) => s + v, 0)
  if (total < 5) return 1
  let h = 0
  for (const c of counts) {
    if (c === 0) continue
    const p = c / total
    h -= p * Math.log2(p)
  }
  const maxH = Math.log2(PUNCT_MARKS.length)
  return maxH > 0 ? h / maxH : 1
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
      openingDiversity: 1,
      punctuationEntropy: 1,
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

  // Real em/en-dashes only - see DASH_RE. This is the fix for the
  // original bug that counted ASCII hyphens and missed the actual
  // LLM em-dash tell entirely.
  const dashes = (cleaned.match(DASH_RE) || []).length
  const emDashDensity = wordCount > 0 ? (dashes / wordCount) * 100 : 0

  const transitions = (cleaned.match(TRANSITION_RE) || []).length
  const transitionDensity = wordCount > 0 ? (transitions / wordCount) * 100 : 0

  const clicheHits = findCliches(cleaned)
  const clicheWeight = clicheHits.reduce((s, h) => s + h.weight, 0)
  const clicheScore = wordCount > 0 ? (clicheWeight / wordCount) * 100 : 0

  const llmLeadInCount = sentences.filter(s =>
    LLM_LEAD_INS.some(re => re.test(s.trim())),
  ).length

  const openingDiversity = computeOpeningDiversity(sentences)
  const punctuationEntropy = computePunctuationEntropy(cleaned)

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
    openingDiversity: Math.round(openingDiversity * 1000) / 1000,
    punctuationEntropy: Math.round(punctuationEntropy * 1000) / 1000,
  }
}

/**
 * Convert raw signal values into per-signal "lean" values from -1 to 1.
 * -1 = strongly leans human
 *  0 = neutral
 * +1 = strongly leans AI
 *
 * DESIGN: signals that are only evidence of AI (em-dashes, clichés,
 * transitions, lead-ins) map into [0, 1] - their absence is neutral, not
 * proof of a human. Signals that genuinely swing both ways (burstiness,
 * vocabulary, opening diversity, punctuation entropy) map into [-1, 1].
 * This removes the old structural bias where every neutral text picked
 * up a small human lean and AI text could never clear the bar.
 */
export interface SignalLeans {
  burstiness: number        // low burstiness leans AI
  vocabulary: number        // low TTR leans AI
  emDashes: number          // high density leans AI (one-directional)
  transitions: number       // high density leans AI (one-directional)
  cliches: number           // high cliché score leans AI (one-directional)
  llmLeadIns: number        // any presence leans AI (one-directional)
  openingRepetition: number // repetitive openings lean AI
  punctuation: number       // low punctuation variety leans AI
}

export function computeLeans(s: Signals): SignalLeans {
  // Burstiness: humans commonly 0.5+, modern LLMs cluster ~0.30–0.40.
  // Two-directional but centred lower than before (frontier models are
  // burstier than the 2023-era output the old 0.55 threshold assumed).
  const burstiness = s.sentenceCount >= 3 ? clamp(map(s.burstiness, 0.55, 0.28, -1, 1)) : 0

  // TTR: two-directional but de-weighted - modern models have rich
  // vocabulary, so this separates the classes less than it once did.
  // Only trusted on longer texts: below ~120 words TTR is near-saturated
  // for BOTH classes, so it becomes a flat human-leaning bias rather than
  // evidence (confirmed by a ~0 human/AI gap in eval). Neutral there.
  const vocabulary = s.wordCount >= 120 ? clamp(map(s.typeTokenRatio, 0.62, 0.42, -1, 1)) : 0

  // Real em/en-dashes: absence is neutral (0), heavy use is a strong AI
  // tell. ~1.5 per 100 words is already heavy for human prose.
  const emDashes = clamp(map(s.emDashDensity, 0.15, 1.5, 0, 1), 0, 1)

  // Transition density: ~0.3 per 100 words is normal, 2+ is heavy.
  const transitions = clamp(map(s.transitionDensity, 0.3, 2.0, 0, 1), 0, 1)

  // Cliché score: density is the signal, not any single phrase.
  const cliches = clamp(map(s.clicheScore, 0.2, 2.5, 0, 1), 0, 1)

  const llmLeadIns = s.llmLeadInCount > 0 ? 1 : 0

  // Opening repetition: high unique-opening ratio (~0.8) leans human,
  // low (~0.45) leans AI. Neutral when too few sentences (ratio forced
  // to 1 upstream → strong human lean, which we damp by only counting
  // when we actually had enough sentences).
  const openingRepetition = s.sentenceCount >= 4
    ? clamp(map(s.openingDiversity, 0.85, 0.45, -1, 1))
    : 0

  // Punctuation entropy: rich variety leans human, monotonous leans AI.
  // Real-world entropy sits lower than the theoretical max, so the human
  // anchor is ~0.62, not 0.75 (miscalibrating this made it a flat AI
  // nudge for everyone in early eval).
  const punctuation = clamp(map(s.punctuationEntropy, 0.62, 0.42, -1, 1))

  return {
    burstiness,
    vocabulary,
    emDashes,
    transitions,
    cliches,
    llmLeadIns,
    openingRepetition,
    punctuation,
  }
}

/**
 * Combine the per-signal leans into a single verdict band. We're
 * deliberately conservative - three bands, never a fake percentage.
 *
 * `modelLean` (optional, -1..1) is the Phase-4 model-based score. When
 * provided it's blended in at 30%, keeping the deterministic signals as
 * the 70% backbone so verdicts stay mostly reproducible.
 */
export type VerdictBand = 'likely-human' | 'mixed' | 'likely-ai'

// Weights sum to ~1.0. Burstiness/vocabulary de-emphasised vs the old
// engine; the working em-dash signal and clichés now pull real weight.
const WEIGHTS = {
  burstiness: 0.18,
  vocabulary: 0.10,
  emDashes: 0.20,
  cliches: 0.22,
  transitions: 0.08,
  llmLeadIns: 0.10,
  openingRepetition: 0.08,
  punctuation: 0.04,
} as const

export function signalWeightedScore(leans: SignalLeans): number {
  return (
    leans.burstiness * WEIGHTS.burstiness +
    leans.vocabulary * WEIGHTS.vocabulary +
    leans.emDashes * WEIGHTS.emDashes +
    leans.cliches * WEIGHTS.cliches +
    leans.transitions * WEIGHTS.transitions +
    leans.llmLeadIns * WEIGHTS.llmLeadIns +
    leans.openingRepetition * WEIGHTS.openingRepetition +
    leans.punctuation * WEIGHTS.punctuation
  )
}

export function verdictFromLeans(
  leans: SignalLeans,
  signals: Signals,
  modelLean?: number | null,
): {
  band: VerdictBand
  // 0–1, used only to drive copy + UI prominence, never shown as a number.
  intensity: number
} {
  // If text is very short, we can't say much.
  if (signals.wordCount < 30) {
    return { band: 'mixed', intensity: 0.3 }
  }

  const signalScore = signalWeightedScore(leans)

  // Blend in the optional model score at 30%.
  const weighted =
    typeof modelLean === 'number'
      ? signalScore * 0.7 + modelLean * 0.3
      : signalScore

  // Symmetric thresholds. Neutral text sits near 0 → honestly "mixed"
  // rather than defaulting to "human" like the old asymmetric bar did.
  // Set to 0.18 against the seed corpus: the widest band that keeps the
  // human false-positive rate at 0 (max human score observed ≈ 0.05).
  if (weighted >= 0.18) return { band: 'likely-ai', intensity: Math.min(1, weighted + 0.1) }
  if (weighted <= -0.18) return { band: 'likely-human', intensity: Math.min(1, -weighted + 0.1) }
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
