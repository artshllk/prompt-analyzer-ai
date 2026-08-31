import { diagnose, toRubricAudit, type DiagnoseResponse } from './diagnose'
import { rewrite } from './rewrite'
import { parseSegments, stripMarkers, hasMarkers } from './segments'
import type { AnalyzeInput, AnalyzeResult } from '@/types'

/**
 * The prompt engine: a staged diagnostic pipeline, orchestrated behind
 * one pure, portable function (no Next/Supabase/HTTP deps - this is why
 * the extension, anon route, and future VS Code/MCP clients are cheap).
 *
 *   diagnose (gpt-5.4-mini)  - intent, interpretation forks, rubric audit,
 *                              failure forecast, already-good check
 *   rewrite  (mini / Gemini) - minimal edit + restructure + template
 *
 * Clarifying questions exist only as a choice between interpretation
 * forks - concrete readings of this prompt that would produce different
 * rewrites. The user answers by clicking one, so generic interview
 * questions and junk free-text answers are both impossible by design.
 *
 * ONE QUESTION, OR NONE. The cap was two. A second question is a second
 * gate in front of a result the user has not seen yet, and the first one
 * has already resolved the reading that mattered. If we are still unsure
 * after one answer, that is our problem to solve with a better rewrite,
 * not theirs to solve with more typing. Staying quiet is the feature.
 */

export const MAX_CLARIFY_TURNS = 1

/**
 * The diagnostic still scores the prompt, and that score never leaves this
 * file's decisions. It gates two things: whether the prompt is already good
 * enough to leave alone, and whether we are unsure enough to ask a question.
 *
 * What is gone is showing a number to the user. "Clarity 22 -> 87" was two
 * model self-reports dressed as a measurement, and the second one was the
 * rewrite model grading its own rewrite. Nothing checkable, so nothing worth
 * printing. The countable replacement is how many constraints we added and
 * how many of those we guessed.
 */
const DIRECT_IMPROVE_THRESHOLD = 75

/**
 * When diagnose fails we can still rewrite - worse informed, but a rewrite.
 *
 * Returning null here surfaces as "Something went wrong on our end", which is
 * the failure users read as "this product is broken". Measured against the
 * live pipeline, diagnose failed on 2 of 25 adversarial prompts, so this is
 * not hypothetical. A neutral diagnosis costs the rewrite its findings and its
 * intent-specific rubric; it does not cost the user their result.
 */
const NEUTRAL_DIAGNOSIS: DiagnoseResponse = {
  intent: 'general',
  score: { total: 50, confidence: 50 },
  already_good: false,
  audit: { dimensions: [], findings: [], failure_forecast: [] },
}

export async function analyzePrompt(input: AnalyzeInput): Promise<AnalyzeResult | null> {
  const turnCount = input.priorAnswers.length
  const mustImprove = turnCount >= MAX_CLARIFY_TURNS

  const diagnosed = await diagnose(input)
  const diag = diagnosed ?? NEUTRAL_DIAGNOSIS
  if (!diagnosed) {
    console.error('[engine] diagnose unavailable, rewriting without a diagnosis')
  }

  const audit = toRubricAudit(diag)

  // Not a prompt at all: a thank-you, a greeting, a reaction. Improving these
  // produces a prompt for replying to yourself, which is what the engine did
  // with "thanks that was perfect" before this existed. Saying "there is
  // nothing here" is the honest answer and costs the user nothing.
  if (diagnosed && diag.no_task && turnCount === 0) {
    return {
      type: 'no_task',
      message: diag.no_task_reason?.trim() || 'There is no prompt here to improve yet.',
      audit,
    }
  }

  // Honest path: a strong prompt gets told it's strong, not rewritten
  // into noise. Only on the first turn - if we already asked a question,
  // the user is owed a rewrite that uses their answer.
  if (diag.already_good && diag.already_good_notes && turnCount === 0) {
    return {
      type: 'already_good',
      message: diag.already_good_notes.message,
      tweaks: (diag.already_good_notes.tweaks ?? []).slice(0, 2),
      audit,
    }
  }

  // Ask only when the model produced a question grounded in >=2 diverging
  // forks AND it isn't confident. The threshold and turn cap are enforced
  // here in code, not left to the model.
  const forks = diag.forks ?? []
  if (
    !mustImprove &&
    diag.question &&
    forks.length >= 2 &&
    diag.score.confidence < DIRECT_IMPROVE_THRESHOLD
  ) {
    return {
      type: 'clarifying',
      question: diag.question.text,
      targetsGap: diag.question.targets_gap,
      options: forks,
      audit,
    }
  }

  const rw = await rewrite(input, diag)
  if (!rw) return null

  /**
   * The rewrite comes back with its own additions marked inline. Split it
   * once, here, so every client gets the same two things: a prompt with no
   * markers in it, and the provenance for that prompt.
   *
   * `improvedPrompt` is derived from the segments rather than stripped
   * separately, which makes "the segments concatenate to the prompt" true by
   * construction instead of by agreement between two functions.
   *
   * If the model returned no markers at all we ship an unlabelled rewrite.
   * That is exactly what the user got before any of this existed, so a model
   * having an off day costs the labelling, never the result.
   */
  const segments = parseSegments(rw.restructured)
  const improvedPrompt = segments.map(s => s.text).join('')

  return {
    type: 'improved',
    improvedPrompt,
    segments: hasMarkers(rw.restructured) ? segments : undefined,
    // Neither of these is supposed to carry markers. Stripping them anyway
    // costs nothing and means one confused response cannot put bracket junk
    // in front of a user.
    minimalEdit: stripMarkers(rw.minimal_edit),
    template: stripMarkers(rw.template),
    explanation: rw.explanation,
    improvementTags: rw.improvement_tags,
    audit,
    intent: diag.intent,
  }
}
