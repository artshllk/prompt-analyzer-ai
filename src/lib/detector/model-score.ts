/**
 * Phase 4 - optional model-based detection score.
 *
 * The deterministic signals in ./signals.ts measure surface statistics.
 * A model can also judge the text holistically (rhythm, "voice", the
 * ineffable staleness of generated prose) in ways no regex captures. This
 * module asks Gemini for exactly that - a single 0–1 AI-likelihood - and
 * returns it as a lean in [-1, 1] that verdictFromLeans() blends in at 30%.
 *
 * WHY IT'S OFF BY DEFAULT
 * The detector's whole pitch (see the /detector page) is that verdicts are
 * DETERMINISTIC and REPRODUCIBLE - same text, same band, every time. An
 * LLM in the verdict path breaks that guarantee. So this is opt-in via
 * DETECTOR_MODEL_SCORE=1. Turn it on only if you're willing to trade a bit
 * of reproducibility for accuracy, and update the disclaimer copy to match.
 *
 * NOTE: this is a model *judgement*, not true perplexity. Real perplexity
 * needs token log-probs, which the current Gemini REST path doesn't return.
 * If you later add a log-prob-capable endpoint, replace the body here with
 * a perplexity computation - the blend point in verdictFromLeans stays the
 * same.
 */

import { callGemini } from '@/lib/engine/gemini-client'

export function isModelScoreEnabled(): boolean {
  return process.env.DETECTOR_MODEL_SCORE === '1'
}

const SCHEMA = {
  type: 'object',
  properties: {
    aiLikelihood: { type: 'number' },
    rationale: { type: 'string' },
  },
  required: ['aiLikelihood', 'rationale'],
}

const SYSTEM_PROMPT = `You are a forensic linguist estimating whether a passage was written by a large language model (ChatGPT, Claude, Gemini) or by a human.

Judge holistically: cadence, sentence-opening variety, over-smooth transitions, generic hedging, "voice" vs. lived specificity, and the flat evenness typical of generated prose. Humanized/paraphrased AI still tends to lack concrete, idiosyncratic detail.

Return JSON only:
- aiLikelihood: a number from 0 to 1. 0 = confidently human, 0.5 = genuinely unsure, 1 = confidently AI. Use the full range; do not anchor at 0.5.
- rationale: one short sentence, max 25 words.

Do not explain your scale. Do not add fields. Non-native or plain human writing is STILL human - do not penalise simple English.`

/**
 * Returns a lean in [-1, 1] (+1 = leans AI) or null if the model call
 * failed or the flag is off. Callers must treat null as "no model signal"
 * and fall back to the deterministic score alone.
 */
export async function getModelLean(text: string): Promise<number | null> {
  if (!isModelScoreEnabled()) return null

  const out = await callGemini<{ aiLikelihood: number; rationale: string }>({
    systemPrompt: SYSTEM_PROMPT,
    userMessage: `<text>\n${text.trim().slice(0, 8000)}\n</text>`,
    temperature: 0, // as reproducible as an LLM gets
    maxOutputTokens: 120,
    responseSchema: SCHEMA as unknown as Record<string, unknown>,
  })

  if (!out || typeof out.aiLikelihood !== 'number' || Number.isNaN(out.aiLikelihood)) {
    return null
  }

  const p = Math.max(0, Math.min(1, out.aiLikelihood))
  return p * 2 - 1 // 0..1  ->  -1..1
}
