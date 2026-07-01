/**
 * AI-detection orchestrator.
 *
 * Pipeline:
 *   1. Compute deterministic signals from the text (pure math).
 *   2. Combine signals into a verdict band (likely-human / mixed / likely-ai).
 *   3. Ask Gemini to write a short, honest explanation of *why* - given
 *      the actual signal values. The LLM is a commentator on data we
 *      computed, not a judge of the text itself.
 *
 * The verdict band is computed deterministically from signals, NOT from
 * the LLM. The LLM only generates copy. This means the band is stable
 * and reproducible; only the prose explanation can vary.
 */

import { callGemini } from '@/lib/engine/gemini-client'
import { computeSignals, computeLeans, verdictFromLeans, type Signals, type VerdictBand } from './signals'
import { getModelLean } from './model-score'

export interface DetectorResult {
  band: VerdictBand
  // Qualitative confidence label - never a number, never a "94% AI".
  confidenceLabel: 'low' | 'moderate' | 'high'
  // 1–3 short sentences from Gemini explaining why this band, in plain
  // language, referencing actual signal values where useful.
  reasoning: string
  // The honest disclaimer text shown alongside every result.
  disclaimer: string
  signals: Signals
  // Per-signal commentary the LLM produced - keyed by signal name.
  // Used to power the "why this signal matters" hover/sidebar later.
  signalNotes: Record<string, string>
}

const REASONING_SCHEMA = {
  type: 'object',
  properties: {
    reasoning: { type: 'string' },
    signalNotes: {
      type: 'object',
      properties: {
        burstiness: { type: 'string' },
        vocabulary: { type: 'string' },
        emDashes: { type: 'string' },
        transitions: { type: 'string' },
        cliches: { type: 'string' },
      },
      required: ['burstiness', 'vocabulary', 'emDashes', 'transitions', 'cliches'],
    },
  },
  required: ['reasoning', 'signalNotes'],
}

const DISCLAIMER =
  'AI detection is imperfect. Models change, writers vary, and short or technical text confuses every detector. Use this as one signal among many - not a verdict.'

function buildSystemPrompt(band: VerdictBand, signals: Signals): string {
  return `You are explaining an AI-detection result to a careful, smart reader. The verdict band has already been decided by a deterministic algorithm based on real measured signals from the input text. Your job is ONLY to explain it honestly in plain language.

# THE RULES YOU NEVER BREAK
1. Never claim certainty. Use language like "leans toward", "suggests", "is consistent with".
2. Never invent a percentage. The system uses three bands: likely-human, mixed, likely-ai. That is it.
3. Reference real signal values when useful (e.g. "burstiness of 0.28, which is on the low side for human writing").
4. Acknowledge the limitation: human writing varies, LLMs can be coached, short texts are hard.
5. No filler. No "in conclusion". No "it's important to note". No "delve". No em-dashes mid-sentence. (We detect those.)

# THE VERDICT BAND
${band}

# THE MEASURED SIGNALS
- Word count: ${signals.wordCount}
- Sentence count: ${signals.sentenceCount}
- Mean sentence length: ${signals.meanSentenceLength} words
- Burstiness (sentence-length variance / mean): ${signals.burstiness} (human prose typically ~0.45+; LLM output typically ~0.25–0.35)
- Vocabulary diversity (type-token ratio): ${signals.typeTokenRatio} (human ~0.65+; LLM lower)
- Em-dashes per 100 words: ${signals.emDashDensity}
- Transition words per 100 words: ${signals.transitionDensity}
- AI-cliché phrase score: ${signals.clicheScore} (number of weighted matches per 100 words)
- AI-cliché matches found: ${signals.clicheHits.length > 0 ? signals.clicheHits.map(h => `"${h.phrase}"`).slice(0, 6).join(', ') : 'none'}
- LLM-style lead-ins ("Certainly!", "As an AI", etc.): ${signals.llmLeadInCount}

# WHAT TO RETURN

\`reasoning\`: 2–3 sentences explaining why this verdict band, referencing the most influential signals. Direct, honest, no theatre. Max 70 words.

\`signalNotes\`: a one-sentence plain-language note for each of: burstiness, vocabulary, emDashes, transitions, cliches. Each note should describe what the value means and which way it leans (toward human, toward AI, or neutral). Max 20 words per note.

Return JSON matching the schema. Nothing else.`
}

export async function analyzeText(text: string): Promise<DetectorResult | null> {
  const signals = computeSignals(text)

  // Edge case: text is too short to analyze meaningfully.
  if (signals.wordCount < 30) {
    return {
      band: 'mixed',
      confidenceLabel: 'low',
      reasoning:
        'This text is too short to analyze with confidence. AI detection needs at least 30 words of running prose to produce a useful signal - ideally a few paragraphs.',
      disclaimer: DISCLAIMER,
      signals,
      signalNotes: {
        burstiness: 'Not enough sentences to measure variance.',
        vocabulary: 'Sample too small for a meaningful vocabulary score.',
        emDashes: 'Not measured below 30 words.',
        transitions: 'Not measured below 30 words.',
        cliches: 'Not measured below 30 words.',
      },
    }
  }

  const leans = computeLeans(signals)

  // Phase 4: optional model-based lean, blended into the verdict at 30%.
  // Returns null (no effect) unless DETECTOR_MODEL_SCORE=1 is set.
  const modelLean = await getModelLean(text)

  const { band, intensity } = verdictFromLeans(leans, signals, modelLean)

  const confidenceLabel: 'low' | 'moderate' | 'high' =
    intensity >= 0.55 ? 'high' : intensity >= 0.30 ? 'moderate' : 'low'

  const llmOut = await callGemini<{
    reasoning: string
    signalNotes: Record<string, string>
  }>({
    systemPrompt: buildSystemPrompt(band, signals),
    userMessage: `<text_to_analyze>\n${text.trim().slice(0, 8000)}\n</text_to_analyze>`,
    temperature: 0.3,
    maxOutputTokens: 600,
    responseSchema: REASONING_SCHEMA as unknown as Record<string, unknown>,
  })

  // If Gemini failed entirely, ship a deterministic fallback so the
  // user always sees a result. The signals are the real evidence.
  if (!llmOut) {
    return {
      band,
      confidenceLabel,
      reasoning: fallbackReasoning(band, signals),
      disclaimer: DISCLAIMER,
      signals,
      signalNotes: fallbackSignalNotes(signals),
    }
  }

  return {
    band,
    confidenceLabel,
    reasoning: llmOut.reasoning,
    disclaimer: DISCLAIMER,
    signals,
    signalNotes: llmOut.signalNotes,
  }
}

function fallbackReasoning(band: VerdictBand, signals: Signals): string {
  if (band === 'likely-ai') {
    return `Signals lean toward AI-generated. Burstiness of ${signals.burstiness} is on the low side for human writing, and we found ${signals.clicheHits.length} common LLM-cliché phrases. Read the per-signal breakdown for detail.`
  }
  if (band === 'likely-human') {
    return `Signals lean toward human writing. Burstiness of ${signals.burstiness} indicates varied sentence rhythm, and vocabulary diversity (${signals.typeTokenRatio}) is in the human range. Read the per-signal breakdown for detail.`
  }
  return `Signals are mixed. Burstiness (${signals.burstiness}) and vocabulary diversity (${signals.typeTokenRatio}) don't strongly point either direction. Read the per-signal breakdown for detail.`
}

function fallbackSignalNotes(s: Signals): Record<string, string> {
  return {
    burstiness: `Variance in sentence length divided by mean. Yours: ${s.burstiness}.`,
    vocabulary: `Unique words over total. Yours: ${s.typeTokenRatio}.`,
    emDashes: `Em-dashes per 100 words. Yours: ${s.emDashDensity}.`,
    transitions: `Transition words per 100 words. Yours: ${s.transitionDensity}.`,
    cliches: `${s.clicheHits.length} cliché phrases matched.`,
  }
}
