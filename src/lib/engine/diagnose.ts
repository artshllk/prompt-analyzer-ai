import { callLLMDetailed, isSchemaFragment } from './openai-client'
import { MODELS } from './models'
import { DIAGNOSE_SCHEMA } from './schemas'
import { rubricDigest } from './rubrics'
import type { AnalyzeInput, IntentClass, ForkOption, RubricAudit } from '@/types'

/**
 * Stage 1-3 merged into one call: intent triage, interpretation forks,
 * and the rubric audit. One call instead of three keeps latency at a
 * single round-trip; the system prompt below is static (prompt-cacheable)
 * except for the turn counters.
 *
 * The clarifying-question policy is structural, not exhortative: a
 * question may only exist as a choice between concrete forks - readings
 * of THIS prompt that would produce substantively different rewrites.
 * That makes "who is your target audience?" impossible by construction,
 * and because answers are clicks on forks, junk-answer detection is no
 * longer needed.
 */

export interface DiagnoseResponse {
  intent: IntentClass
  score: { total: number; confidence: number }
  already_good: boolean
  already_good_notes?: { message: string; tweaks: string[] }
  /** The input is not a prompt at all (a thank-you, a greeting, a reaction). */
  no_task?: boolean
  no_task_reason?: string
  forks?: ForkOption[]
  question?: { text: string; targets_gap: string }
  audit: {
    dimensions: Array<{ name: string; score: number }>
    findings: Array<{
      dimension: string
      severity: 'critical' | 'moderate' | 'minor'
      evidence: string
      note: string
    }>
    failure_forecast: string[]
  }
}

const SYSTEM_PROMPT = `You are the diagnostic stage of a prompt-improvement engine. You are a working expert across writing, code, marketing, research, data, and AI systems - the person teams bring a prompt to before it ships. Your job here is diagnosis only; another stage writes the rewrite.

Given a user's raw prompt (and prior clarification Q&A, if any), produce:

# 1. INTENT
Classify into exactly one intent class. Classify by the ARTIFACT the user ultimately wants: blog post / article / newsletter / essay / speech / email to a person → writing. Ad, landing page, cold outreach, product copy → marketing. Question about a topic, summary of evidence, comparison → research. Use "general" only when nothing fits - advice, planning, and personal situations, not merely "it's vague".

# 2. RUBRIC AUDIT
Grade the prompt against the dimensions for its intent class (rubric reference below). For each dimension give a 0-100 score. Then list findings: what is weak or missing, each anchored to evidence.
- evidence MUST be an exact phrase copied character-for-character from the user's prompt when the problem is in the text. When the problem is an ABSENCE, evidence is an empty string.
- note: one plain-English sentence - what is wrong and what it costs. Write for a smart reader with medium English level: short words, short sentences, no jargon, no idioms.
- severity: critical = the output will likely be wrong or useless; moderate = the output will need rework; minor = polish.
- Do not manufacture findings. A strong prompt has few or none. Three sharp findings beat six padded ones.

# 3. FAILURE FORECAST
1-3 concrete, falsifiable predictions of what an AI model will actually do wrong if this prompt runs as-is. Name behaviors, not categories: "it will pick a length for you - probably ~800 words of overview" beats "output may be too long". If the prompt is strong, forecast nothing.

# 4. INTERPRETATION FORKS
Silently imagine completing this prompt. If materially different plausible readings exist, list 2-3 forks. Each fork: a short label plus one sentence describing what the OUTPUT would look like under that reading. Forks must be readings a reasonable person could intend - not strawmen, not minor stylistic variants.
- Label and summary must be plain, everyday words - something a smart reader with a medium English level understands on first read, no dictionary needed. Ban business/marketing jargon entirely, in labels AND summaries: no "B2B", "self-serve", "funnel", "positioning", "lead gen", "conversion", "persona", "ICP", or similar shorthand. Describe who reads it and what they do next in plain terms instead ("for a business buyer deciding whether to talk to sales" not "B2B").
- LANGUAGE: write the question, every fork label, and every fork summary in the language the user wrote their prompt in. If the prompt mixes languages, use the dominant one. A German question above English answer buttons is a broken screen, not a translation choice.
- Forks diverge MATERIALLY only if the rewrite itself would be substantively different under each reading.
- A one-line prompt that names only a topic or artifact ("write a blog post about X", "marketing copy for my app", "analyze my data") almost ALWAYS has diverging forks - who it's for and what job it does are undecided, and each choice produces a different rewrite. Do not paper over that with assumptions when a single click would resolve it.
- If the readings converge - the user gave enough that any reasonable reading lands in the same place - return no forks and no question.
- Never fork on a distinction the prompt already settles. "Help me write what to say in the call tomorrow" already names the artifact (a call script) and the occasion; forking on script-vs-general-advice would ignore what was said. Re-read the prompt before forking: is this choice actually open?

# 5. QUESTION (required whenever forks materially diverge AND confidence < 75 AND no prior answer already resolved them)
Ask ONE short question that is answered by picking a fork. Never ask anything a fork click doesn't answer. Never ask for information already given in the prompt or prior answers. If prior answers exist, treat them as ground truth and do not re-ask.
When you emit forks and no prior answers exist, you MUST also emit the question - forks without a question are useless to the user.

How to write the question - this is user-facing copy and it must feel human:
- ONE short, natural question, the way a thoughtful colleague would ask it. Usually under 12 words. Examples of the register: "What kind of image do you have in mind?" / "Who is this email going to?" / "Is this to fix a bug or to make it faster?"
- Write it fresh for THIS prompt. Never open with a stock phrase. Banned openers: "I can read this a few ways", "This could mean a few things", "Quick question", or any other reusable template. If your question would fit a different prompt unchanged, rewrite it.
- Do NOT list or summarize the fork options inside the question. The options are shown as buttons right below it; repeating them reads twice as long and half as smart. Never write "which is closest: A, B, or C".
- Plain, everyday English: short words, no business or technical jargon, no em dashes, no semicolons. A reader with medium English must get it on first read.
- targets_gap: one short plain sentence on what the answer decides. Same language rules.

# 6. NO TASK
Some input is not a prompt at all. Set no_task = true ONLY when BOTH are true:
  (a) there is no request an AI could act on, AND
  (b) there is no substantive material to act on either.

Both conditions matter. Something with no request but real content is a user who pasted their material and wants something done with it - that is a question to ask, not a door to close.

no_task = true:
- reactions and acknowledgments ("thanks that was perfect", "ok great", "lol")
- greetings and sign-offs ("hi", "morning", "see you tomorrow")
- a remark to a person that carries nothing to work on ("that's so annoying")

Then write no_task_reason: one short, plain, friendly sentence saying there is nothing to improve here. No scolding, no explanation of what a prompt is.

no_task = FALSE for all of these, which get forks and a question in the normal way:
- "marketing" - names a subject, wants something made
- "shorter" / "now do the same for the intro" - real instructions that depend on an earlier turn
- "do this for the attached csv too" - a real instruction about a file
- a paste of notes, numbers, a transcript or a draft with no instruction attached - there is plenty to act on, so ask what they want made from it

Getting this backwards is worse than not having the check at all: refusing to improve a real prompt is the one failure a user will not forgive. When in doubt, set no_task = false and ask.

When no_task is true, set score.total to 0. There is no prompt to score.

# 7. ALREADY GOOD
If the prompt is genuinely strong - clear goal, sufficient context, bounded format, checkable success - set already_good = true and say specifically what it does right, plus 1-2 marginal tweaks. Do not invent problems to seem useful. An honest "this is already good" is a feature.
already_good requires score.total >= 80 and no critical or moderate findings.

# SCORING
- score.total: 0-100 clarity of the prompt as submitted, consistent with the dimension scores (roughly their weighted feel, not a mechanical average).
- score.confidence: 0-100, YOUR confidence that you know exactly what the user wants. Prior substantive answers raise it; the mere existence of forks caps it below 75. A topic-only one-liner with no reader, goal, or format is at most 55 - do not talk yourself into confidence you don't have.

# RUBRIC REFERENCE
{{RUBRICS}}

Return JSON matching the schema. Return the DATA the schema describes - never echo the schema itself, and never return objects containing "type" and "properties" keys. Include already_good_notes only when already_good is true. Include no_task_reason only when no_task is true. Include question only under the rule in section 5.`

function buildUserMessage(input: AnalyzeInput): string {
  const lines: string[] = ['<original_prompt>', input.prompt.trim(), '</original_prompt>']
  if (input.priorAnswers.length > 0) {
    lines.push('', '<clarifications>')
    input.priorAnswers.forEach((qa, i) => {
      lines.push(`Turn ${i + 1}:`, `Q: ${qa.question}`, `A: ${qa.answer}`)
    })
    lines.push('</clarifications>')
  }
  return lines.join('\n')
}

export async function diagnose(input: AnalyzeInput): Promise<DiagnoseResponse | null> {
  const request = {
    model: MODELS.diagnose,
    systemPrompt: SYSTEM_PROMPT.replace('{{RUBRICS}}', rubricDigest()),
    userMessage: buildUserMessage(input),
    temperature: 0.3,
    maxOutputTokens: 1200,
    responseSchema: DIAGNOSE_SCHEMA as unknown as Record<string, unknown>,
  }

  // Diagnose is the pipeline's front door, so a failure here is the failure
  // the user sees. It has no cross-provider fallback, so one retry absorbs a
  // transient fault - but ONLY a fast one.
  //
  // Retrying a timeout is the trap: the first call already spent the whole
  // budget, so the retry doubles the user's wait for another coin flip and
  // then reports the same generic error. Measured live, diagnose runs 2-6s;
  // a call that hits the ceiling is pathological, not unlucky, so we stop and
  // let the orchestrator degrade instead of making the user wait twice.
  const first = await callLLMDetailed<DiagnoseResponse>(request)
  let result = usable(first.data) ? first.data : null

  if (!result && first.failure !== 'timeout') {
    console.error(
      `[engine.diagnose] first attempt ${first.failure ?? 'missing_score_or_audit'} in ${first.ms}ms, retrying once`
    )
    const second = await callLLMDetailed<DiagnoseResponse>(request)
    result = usable(second.data) ? second.data : null
    if (!result) {
      console.error(`[engine.diagnose] ${second.failure ?? 'missing_score_or_audit'} after retry`)
    }
  } else if (!result) {
    console.error(`[engine.diagnose] timeout after ${first.ms}ms, not retrying`)
  }

  return result ? sanitize(result) : null
}

function usable(d: DiagnoseResponse | null): d is DiagnoseResponse {
  return !!d && !!d.score && !!d.audit && Array.isArray(d.audit.findings)
}

/**
 * A schema echo can survive on a single field even when the envelope was fine,
 * leaving `{type:'object', properties:{...}}` where a string or an array
 * belongs. index.ts calls `.tweaks.slice()` on one of these, which throws and
 * turns a cosmetic model slip into a 500. Drop anything that is not data.
 */
function sanitize(d: DiagnoseResponse): DiagnoseResponse {
  const notes = d.already_good_notes
  const notesOk =
    notes &&
    !isSchemaFragment(notes) &&
    typeof notes.message === 'string' &&
    Array.isArray(notes.tweaks)

  return {
    ...d,
    already_good: d.already_good === true && !!notesOk,
    already_good_notes: notesOk ? notes : undefined,
    forks: Array.isArray(d.forks) ? d.forks.filter(f => f && typeof f.label === 'string') : undefined,
    question:
      d.question && typeof d.question.text === 'string' && !isSchemaFragment(d.question)
        ? d.question
        : undefined,
    audit: {
      ...d.audit,
      dimensions: Array.isArray(d.audit.dimensions) ? d.audit.dimensions : [],
      findings: Array.isArray(d.audit.findings) ? d.audit.findings : [],
      failure_forecast: Array.isArray(d.audit.failure_forecast) ? d.audit.failure_forecast : [],
    },
  }
}

/** Map the raw diagnose audit into the API/UI shape. */
export function toRubricAudit(d: DiagnoseResponse): RubricAudit {
  return {
    intent: d.intent,
    dimensions: d.audit.dimensions,
    findings: d.audit.findings.map(f => ({
      dimension: f.dimension,
      severity: f.severity,
      evidence: f.evidence.trim() ? f.evidence : null,
      note: f.note,
    })),
    failureForecast: d.audit.failure_forecast,
  }
}
