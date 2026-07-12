import { diagnose, toRubricAudit } from './diagnose'
import { rewrite } from './rewrite'
import { critic } from './critic'
import type { AnalyzeInput, AnalyzeResult } from '@/types'

/**
 * The prompt engine: a staged diagnostic pipeline, orchestrated behind
 * one pure, portable function (no Next/Supabase/HTTP deps - this is why
 * the extension, anon route, and future VS Code/MCP clients are cheap).
 *
 *   diagnose (gpt-5.4-mini)  - intent, interpretation forks, rubric audit,
 *                              failure forecast, already-good check
 *   rewrite  (mini / Gemini) - minimal edit + restructure + template
 *   critic   (Gemini, deep)  - hostile review pass; critique is SHOWN
 *
 * Clarifying questions exist only as a choice between interpretation
 * forks - concrete readings of this prompt that would produce different
 * rewrites. The user answers by clicking one, so generic interview
 * questions and junk free-text answers are both impossible by design.
 * Questions are still a gate the user can abandon at, so we cap turns
 * and bias hard toward shipping the rewrite.
 */

export const MAX_CLARIFY_TURNS = 2
const DIRECT_IMPROVE_THRESHOLD = 75

export async function analyzePrompt(input: AnalyzeInput): Promise<AnalyzeResult | null> {
  const turnCount = input.priorAnswers.length
  const mustImprove = turnCount >= MAX_CLARIFY_TURNS

  const diag = await diagnose(input)
  if (!diag) return null

  const audit = toRubricAudit(diag)

  // Honest path: a strong prompt gets told it's strong, not rewritten
  // into noise. Only on the first turn - if we already asked a question,
  // the user is owed a rewrite that uses their answer.
  if (diag.already_good && diag.already_good_notes && turnCount === 0) {
    return {
      type: 'already_good',
      message: diag.already_good_notes.message,
      tweaks: diag.already_good_notes.tweaks.slice(0, 2),
      scoreBeforeImprovement: diag.score.total,
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
      confidenceSoFar: diag.score.confidence,
      scoreBeforeImprovement: diag.score.total,
      audit,
    }
  }

  const rw = await rewrite(input, diag)
  if (!rw) return null

  let improvedPrompt = rw.restructured
  let critique: string | undefined

  if (input.deep) {
    const crit = await critic({
      originalPrompt: input.prompt,
      draftRewrite: rw.restructured,
      intent: diag.intent,
    })
    if (crit) {
      critique = crit.critique
      improvedPrompt = crit.refined_prompt
    }
    // If the critic fails we ship the draft - degraded, not broken.
  }

  return {
    type: 'improved',
    improvedPrompt,
    minimalEdit: rw.minimal_edit,
    template: rw.template,
    explanation: rw.explanation,
    improvementTags: rw.improvement_tags,
    clarityScoreAfter: rw.clarity_score_after,
    scoreBeforeImprovement: diag.score.total,
    audit,
    critique,
    intent: diag.intent,
  }
}
