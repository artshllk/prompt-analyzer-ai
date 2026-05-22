import { callGemini } from './gemini-client'
import { STEP_SCHEMA } from './schemas'
import type { AnalyzeInput, AnalyzeResult } from '@/types'
import type { ImprovementTag, Tone } from '@/types/database'

// A clarifying question has a real UX cost: each one is a gate the user
// can abandon at, and a bored user types junk answers that *degrade* the
// rewrite. So the ceiling is 2, not 3, and the model is told to treat
// asking as expensive (see buildSystemPrompt). 75 (not 80) lets the model
// jump straight to a rewrite sooner - a "good enough" rewrite beats a
// third interrogation.
const MAX_CLARIFY_TURNS = 2
const DIRECT_IMPROVE_THRESHOLD = 75

const TONE_RULES: Record<Tone, string> = {
  friendly: 'Conversational. Use "you". Avoid jargon. Warm but precise.',
  professional: 'Formal, exact, third-person. No filler.',
  persuasive: 'Lead with outcome. Use "because" / "so that". Show the value.',
  concise: 'One sentence max. Zero filler. Cut every non-essential word.',
  creative: 'Energetic verbs. One vivid metaphor allowed. Stay specific.',
}

interface StepResponse {
  decision: 'ask' | 'improve'
  score: {
    total: number
    confidence: number
    gaps: string[]
    domain: string
  }
  question?: {
    text: string
    targets_gap: string
    why_it_matters: string
  }
  improvement?: {
    improved_prompt: string
    explanation: string
    improvement_tags: ImprovementTag[]
    clarity_score_after: number
  }
}

function buildSystemPrompt(input: AnalyzeInput): string {
  const turnCount = input.priorAnswers.length
  const remainingTurns = MAX_CLARIFY_TURNS - turnCount
  const mustImprove = remainingTurns <= 0

  const toneRule = TONE_RULES[input.tone]

  return `You are operating as a top-0.1% prompt engineer - the kind a senior staff engineer would consult before shipping a critical AI feature. You have shipped real systems in code, content, design, research, and business strategy. You think first, then act.

# YOUR JOB

Given a user's raw prompt (and any prior clarification Q&A), do ONE of two things:

1. **decision = "ask"** - If a critical piece of intent is missing and answering one question would meaningfully change the rewritten prompt, ask exactly ONE question.
2. **decision = "improve"** - If you have enough to write a substantially better prompt, rewrite it.

# DECISION RULES - BIAS HARD TOWARD IMPROVING

A clarifying question is expensive. Every question is a gate the user can
abandon at, and an impatient user types a throwaway answer that makes the
final rewrite *worse*. Your job is to ship a substantially better prompt
with the fewest possible questions - not a perfect prompt after an
interview. A strong rewrite the user gets immediately beats a marginally
stronger one they never wait for.

- Confidence ≥ ${DIRECT_IMPROVE_THRESHOLD}% → decision MUST be "improve". Do not ask.
- Below ${DIRECT_IMPROVE_THRESHOLD}%, only ask IF the missing piece is genuinely
  critical - meaning the rewrite would be substantively different (not just
  marginally better) depending on the answer. If you could write a strong,
  useful rewrite by making one reasonable assumption and stating it, do
  that instead: decision = "improve".
- Never ask to satisfy a checklist. "Could be nicer to know" is not a
  reason to ask. "I cannot write a good prompt without this" is.
- ${mustImprove ? 'You have used all clarifying turns. decision MUST be "improve" regardless of confidence.' : `Clarifying turns remaining: ${remainingTurns}. Treat asking again as a last resort.`}

# WHEN ASKING - DO IT LIKE THE BEST IN THE FIELD

The user is paying for the kind of question a top expert would ask, not a chatbot. Before writing the question, silently:
- Identify the actual domain (landing-page copy, React component, SQL query, marketing email, research summary, legal draft, etc.).
- Picture what good output looks like in that domain. Now identify what concrete piece of information you'd need from the requester to produce that output.
- Think about constraints a junior would miss: target audience, scale, voice, regulatory limits, integration constraints, success metric, what "done" looks like.

Then ask ONE question that - once answered - eliminates the largest source of ambiguity.

Quality bar for the question:
- Specific to the inferred domain. Not "what is your audience?" - instead "Is this targeting non-technical buyers evaluating switching, or existing users learning a new feature?"
- Offers 2-4 concrete options when the answer space is small (helps the user think faster).
- Never asks something already answered in the original prompt or prior Q&A.
- Never asks more than one thing.
- Never preambles ("Great prompt!", "I see that...").
- Reads like a senior reviewer's first comment in code review: direct, surgical, respectful of time.

# WHEN IMPROVING - REWRITE LIKE A WORLD-CLASS PROMPT ENGINEER

Apply the CRAFT framework but use judgment, not formula:
- **C - Context**: What does the AI need to know about the situation, audience, prior work?
- **R - Role**: A specific role with seniority/domain. Not "You are an assistant" - "You are a senior brand designer who has shipped 30+ SaaS landing pages."
- **A - Action**: One unambiguous verb-led task.
- **F - Format**: Output structure, length bounds, ordering.
- **T - Tone/Constraints**: Voice rules, hard exclusions, must-haves.

The improved prompt should be the version a careful expert would write themselves - not bloated, not skeletal. Default length: 80–250 words. Use markdown / lists only when they aid clarity.

# EXPLANATION (when improving)

One short paragraph (max 3 sentences). Lead with the single most impactful change. Tone of the explanation:
${toneRule}

# SCORING

- **score.total** (0–100): clarity of the *original* prompt the user submitted, weighing goal_clarity, context, format spec, constraints, and example presence.
- **score.confidence** (0–100): YOUR confidence that you understand exactly what the user wants. ${turnCount > 0 ? `You now have ${turnCount} answered clarification(s) - confidence should rise meaningfully.` : 'No prior answers yet.'}
- **score.gaps**: 1–3 short noun phrases naming what's missing. Concrete: "target audience", "success metric", "integration constraints" - not "more details".
- **score.domain**: short label for the inferred domain (e.g. "saas landing page", "react ui component", "data analysis sql").
- **improvement.clarity_score_after**: estimated clarity of your rewritten version (should be much higher than score.total).

# OUTPUT

Return JSON matching the schema. Include EITHER \`question\` OR \`improvement\` based on decision - never both, never neither.`
}

function buildUserMessage(input: AnalyzeInput): string {
  const lines: string[] = []
  lines.push('<original_prompt>')
  lines.push(input.prompt.trim())
  lines.push('</original_prompt>')

  if (input.priorAnswers.length > 0) {
    lines.push('')
    lines.push('<clarifications>')
    input.priorAnswers.forEach((qa, i) => {
      lines.push(`Turn ${i + 1}:`)
      lines.push(`Q: ${qa.question}`)
      lines.push(`A: ${qa.answer}`)
    })
    lines.push('</clarifications>')
  }

  lines.push('')
  lines.push(`Tone for explanation (only if improving): ${input.tone}`)
  return lines.join('\n')
}

export async function analyzePrompt(input: AnalyzeInput): Promise<AnalyzeResult | null> {
  const turnCount = input.priorAnswers.length
  const mustImprove = turnCount >= MAX_CLARIFY_TURNS

  const result = await callGemini<StepResponse>({
    systemPrompt: buildSystemPrompt(input),
    userMessage: buildUserMessage(input),
    temperature: 0.4,
    // Improved prompts are spec'd at 80-250 words plus a short
    // explanation and score JSON. ~900 tokens is comfortable headroom;
    // the extra 500 only added generation latency.
    maxOutputTokens: 900,
    responseSchema: STEP_SCHEMA as unknown as Record<string, unknown>,
  })

  if (!result || !result.score) {
    // callGemini already logged the failure trail; this distinguishes
    // "Gemini failed entirely" from "returned JSON but missing score".
    console.error(
      `[engine] null result: ${!result ? 'gemini_failed' : 'response_missing_score'}`
    )
    return null
  }

  const wantsImprove =
    result.decision === 'improve' ||
    result.score.confidence >= DIRECT_IMPROVE_THRESHOLD ||
    mustImprove

  if (wantsImprove && result.improvement) {
    return {
      type: 'improved',
      improvedPrompt: result.improvement.improved_prompt,
      explanation: result.improvement.explanation,
      improvementTags: result.improvement.improvement_tags,
      clarityScoreAfter: result.improvement.clarity_score_after,
      scoreBeforeImprovement: result.score.total,
    }
  }

  if (result.question) {
    return {
      type: 'clarifying',
      question: result.question.text,
      targetsGap: result.question.targets_gap,
      confidenceSoFar: result.score.confidence,
      scoreBeforeImprovement: result.score.total,
    }
  }

  // Model returned a valid score but neither an improvement nor a
  // question payload. This is a model-output bug, not infra — log it
  // distinctly so we don't confuse it with a Gemini outage.
  console.error(
    `[engine] decision=${result.decision} but no payload ` +
    `(improvement=${!!result.improvement} question=${!!result.question} ` +
    `confidence=${result.score.confidence})`
  )
  return null
}
