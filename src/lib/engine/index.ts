import { diagnose, toRubricAudit, type DiagnoseResponse } from './diagnose'
import { rewrite } from './rewrite'
import { parseSegments, stripMarkers, hasMarkers } from './segments'
import { asString, asText, asStringArray } from './coerce'
import type { AnalyzeInput, AnalyzeResult } from '@/types'
import type { ImprovementTag } from '@/types/database'

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

/**
 * THE GUARD.
 *
 * Every stage in this pipeline returns null on failure, and the orchestrator
 * handles null well: a failed diagnose degrades to NEUTRAL_DIAGNOSIS and the
 * user still gets a rewrite. Nothing handled a THROW.
 *
 * That gap was real and it was reachable. Provider responses are read with
 * `strict:false`, so a field typed `string` can arrive as an array, and one
 * `.trim()` on it three stages later escaped as an unhandled 500. The route
 * has one try/catch and it wraps req.json(), so the exception went straight
 * out to Next and the user was told the product was broken.
 *
 * The whole design here is "degrade, do not fail". This makes that true for
 * exceptions too: anything thrown becomes null, which the route already turns
 * into a clean 503 rather than a stack trace.
 */
export async function analyzePrompt(input: AnalyzeInput): Promise<AnalyzeResult | null> {
  try {
    return await runPipeline(input)
  } catch (err) {
    console.error('[engine] pipeline threw, degrading to no result:', err)
    return null
  }
}

async function runPipeline(input: AnalyzeInput): Promise<AnalyzeResult | null> {
  const turnCount = input.priorAnswers.length
  const mustImprove = turnCount >= MAX_CLARIFY_TURNS

  const diagnosed = await diagnose(input)
  const diag = diagnosed ?? NEUTRAL_DIAGNOSIS
  if (!diagnosed) {
    console.error('[engine] diagnose unavailable, rewriting without a diagnosis')
  }

  /**
   * The audit is caught on its own, and this is the point of doing it that
   * way rather than with one outer catch.
   *
   * The audit is supporting detail: which dimensions were weak, what the
   * evidence was. The rewrite is the thing the user came for. Letting a
   * malformed finding take down the whole request trades the result the user
   * wanted for an error, to protect a panel they may never open. A rewrite
   * with no audit is a fine outcome. A 503 because the audit mapper threw is
   * not.
   */
  let audit: ReturnType<typeof toRubricAudit> | undefined
  try {
    audit = toRubricAudit(diag)
  } catch (err) {
    console.error('[engine] audit mapping failed, shipping without it:', err)
    audit = undefined
  }

  // Not a prompt at all: a thank-you, a greeting, a reaction. Improving these
  // produces a prompt for replying to yourself, which is what the engine did
  // with "thanks that was perfect" before this existed. Saying "there is
  // nothing here" is the honest answer and costs the user nothing.
  if (diagnosed && diag.no_task && turnCount === 0) {
    return {
      type: 'no_task',
      message: asText(diag.no_task_reason, 'There is no prompt here to improve yet.'),
      audit,
    }
  }

  // Honest path: a strong prompt gets told it's strong, not rewritten
  // into noise. Only on the first turn - if we already asked a question,
  // the user is owed a rewrite that uses their answer.
  if (diag.already_good && diag.already_good_notes && turnCount === 0) {
    return {
      type: 'already_good',
      message: asText(
        diag.already_good_notes.message,
        'This prompt is already clear enough to send as it is.'
      ),
      tweaks: asStringArray(diag.already_good_notes.tweaks, 2),
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
      question: asText(diag.question.text),
      targetsGap: asString(diag.question.targets_gap),
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
    explanation: asString(rw.explanation),
    improvementTags: asStringArray(rw.improvement_tags) as ImprovementTag[],
    audit,
    intent: diag.intent,
  }
}
