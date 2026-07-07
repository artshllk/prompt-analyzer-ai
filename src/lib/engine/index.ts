import { callLLM } from './openai-client'
import { STEP_SCHEMA } from './schemas'
import type { AnalyzeInput, AnalyzeResult } from '@/types'
import type { ImprovementTag, Tone } from '@/types/database'

// Clarifying questions have a real UX cost - each one is a gate the user
// can abandon at. So we hard-cap at 3 and bias the model toward shipping
// a strong rewrite the moment it has enough context. Crucially: the
// model must also detect *junk* clarification answers ("blablabla",
// single random word, "idk") and treat them as adding zero confidence -
// otherwise an impatient user gets a worse rewrite than they would have
// gotten with no clarifications at all. See JUNK-ANSWER DETECTION below.
const MAX_CLARIFY_TURNS = 3
const DIRECT_IMPROVE_THRESHOLD = 75

// Pro-only Deep Rewrite: a stronger model plus an explicit
// draft -> critique -> refine pass before the model answers. Costs more
// per call and runs a little slower - that's the paid quality tier.
const DEEP_MODEL = 'gpt-4.1-mini'
const DEEP_MAX_OUTPUT_TOKENS = 1400

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

/**
 * Render the compiled Context Graph brief. Placed high in the system
 * prompt as durable background the model should weight - but the user's
 * explicit prompt and clarifications always take precedence over it.
 */
function buildContextBlock(input: AnalyzeInput): string {
  const ctx = input.context
  if (!ctx || (!ctx.identity?.length && !ctx.styleHints?.length)) return ''

  const lines: string[] = ['# CONTEXT — who you are writing for (persistent profile)']
  lines.push('Weight this, but never let it override the explicit prompt or clarifications below.')
  if (ctx.identity?.length) {
    lines.push('', 'About the user:')
    ctx.identity.forEach(l => lines.push(`- ${l}`))
  }
  if (ctx.styleHints?.length) {
    lines.push('', 'Learned style preferences (from outputs they actually accepted):')
    ctx.styleHints.forEach(l => lines.push(`- ${l}`))
  }
  return lines.join('\n') + '\n\n'
}

function buildSystemPrompt(input: AnalyzeInput): string {
  const turnCount = input.priorAnswers.length
  const remainingTurns = MAX_CLARIFY_TURNS - turnCount
  const mustImprove = remainingTurns <= 0

  const toneRule = TONE_RULES[input.tone]

  return `${buildContextBlock(input)}You are operating as a top-0.1% prompt engineer - the kind a senior staff engineer would consult before shipping a critical AI feature. You have shipped real systems in code, content, design, research, and business strategy. You think first, then act.

# YOUR JOB

Given a user's raw prompt (and any prior clarification Q&A), do ONE of two things:

1. **decision = "ask"** - If a critical piece of intent is missing and answering one question would meaningfully change the rewritten prompt, ask exactly ONE question.
2. **decision = "improve"** - If you have enough to write a substantially better prompt, rewrite it.

# DECISION RULES - BIAS HARD TOWARD IMPROVING

A clarifying question is expensive. Every question is a gate the user can
abandon at. Your job is to ship a substantially better prompt with the
fewest possible questions - not a perfect prompt after an interview. A
strong rewrite the user gets immediately beats a marginally stronger one
they never wait for.

- Confidence ≥ ${DIRECT_IMPROVE_THRESHOLD}% → decision MUST be "improve". Do not ask.
- Below ${DIRECT_IMPROVE_THRESHOLD}%, only ask IF the missing piece is genuinely
  critical - meaning the rewrite would be substantively different (not just
  marginally better) depending on the answer. If you could write a strong,
  useful rewrite by making one reasonable assumption and stating it, do
  that instead: decision = "improve".
- Never ask to satisfy a checklist. "Could be nicer to know" is not a
  reason to ask. "I cannot write a good prompt without this" is.
- ${mustImprove ? `You have used all ${MAX_CLARIFY_TURNS} clarifying turns. decision MUST be "improve" regardless of confidence. Make reasonable assumptions, state them in the rewrite, ship it.` : `Clarifying turns remaining: ${remainingTurns}. Treat asking again as a last resort.`}

# JUNK-ANSWER DETECTION (CRITICAL)

When prior clarifications exist, judge their QUALITY before using them:

A clarification answer is **junk** if it is any of:
- Fewer than 2 meaningful words ("yes", "ok", "sure", "idk")
- Gibberish or filler ("blablabla", "asdf", "test", random keystrokes)
- A literal restatement of the question
- Off-topic / unrelated to what was asked
- A meta-complaint ("just rewrite it already", "skip this")

If the latest answer is junk, treat its information value as **zero**:
- Do NOT raise score.confidence based on it.
- Either ask ONE more targeted question (rephrased, simpler, with 2-4
  concrete options if possible) so the user has an easier path to a
  useful answer - OR, if turns are exhausted, improve using only the
  information you trust, making reasonable assumptions explicit in the
  rewrite.
- Never pretend a junk answer gave you context it did not. The user is
  better served by one more question than by a confidently wrong rewrite.

When the answer IS substantive (a real sentence, a concrete detail), let
confidence rise meaningfully. The point of clarification is to reach a
strong rewrite, not to run an interview.

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
- **score.confidence** (0–100): YOUR confidence that you understand exactly what the user wants. ${turnCount > 0 ? `You now have ${turnCount} answered clarification(s). Confidence should rise meaningfully ONLY if those answers were substantive (see JUNK-ANSWER DETECTION). Junk answers add zero confidence.` : 'No prior answers yet.'}
- **score.gaps**: 1–3 short noun phrases naming what's missing. Concrete: "target audience", "success metric", "integration constraints" - not "more details".
- **score.domain**: short label for the inferred domain (e.g. "saas landing page", "react ui component", "data analysis sql").
- **improvement.clarity_score_after**: estimated clarity of your rewritten version (should be much higher than score.total).

${input.deep ? `# DEEP REWRITE MODE (PRO)

This user is on the paid quality tier. When improving, do NOT settle for
your first draft. Before emitting the JSON, silently run three passes:

1. **Draft**: write the full improved prompt as usual.
2. **Critique**: attack your draft the way a hostile senior reviewer
   would. Where is it still generic? Which CRAFT element is weakest?
   What would the target model most likely get wrong when given this
   prompt? Is any sentence filler?
3. **Refine**: rewrite the draft resolving every critique. Sharpen the
   role, tighten constraints, and add one concrete example or acceptance
   criterion if the domain benefits from it.

Only the refined version goes in \`improvement.improved_prompt\`. The
explanation should mention the single deepest improvement the refine
pass made. Length may extend to 350 words when the domain warrants it.

` : ''}# OUTPUT

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

  const result = await callLLM<StepResponse>({
    systemPrompt: buildSystemPrompt(input),
    userMessage: buildUserMessage(input),
    temperature: 0.4,
    // Improved prompts are spec'd at 80-250 words plus a short
    // explanation and score JSON. ~900 tokens is comfortable headroom;
    // the extra 500 only added generation latency. Deep mode allows
    // longer rewrites, so it gets more room.
    maxOutputTokens: input.deep ? DEEP_MAX_OUTPUT_TOKENS : 900,
    responseSchema: STEP_SCHEMA as unknown as Record<string, unknown>,
    ...(input.deep && { model: DEEP_MODEL }),
  })

  if (!result || !result.score) {
    // callLLM already logged the failure detail; this distinguishes
    // "provider failed entirely" from "returned JSON but missing score".
    console.error(
      `[engine] null result: ${!result ? 'llm_failed' : 'response_missing_score'}`
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
  // question payload. This is a model-output bug, not infra - log it
  // distinctly so we don't confuse it with a Gemini outage.
  console.error(
    `[engine] decision=${result.decision} but no payload ` +
    `(improvement=${!!result.improvement} question=${!!result.question} ` +
    `confidence=${result.score.confidence})`
  )
  return null
}
