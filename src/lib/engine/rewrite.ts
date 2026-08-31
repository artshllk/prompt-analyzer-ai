import { callLLM } from './openai-client'
import { callGemini } from './gemini-client'
import { MODELS } from './models'
import { REWRITE_SCHEMA } from './schemas'
import { MARKER_INSTRUCTIONS } from './segments'
import { isText } from './coerce'
import { RUBRICS } from './rubrics'
import type { AnalyzeInput } from '@/types'
import type { ImprovementTag, Tone } from '@/types/database'
import type { DiagnoseResponse } from './diagnose'

/**
 * Stage 4: the rewrite, informed by the diagnosis. Produces two variants
 * (minimal edit that keeps the user's voice, full restructure) plus a
 * reusable template. Pro rewrites run on Gemini 3.5 Flash with an OpenAI
 * fallback; free tier runs on the mini model.
 */

export interface RewriteResponse {
  minimal_edit: string
  restructured: string
  template: string
  explanation: string
  improvement_tags: ImprovementTag[]
}

const TONE_RULES: Record<Tone, string> = {
  friendly: 'Conversational. Use "you". Avoid jargon. Warm but precise.',
  professional: 'Formal, exact, third-person. No filler.',
  persuasive: 'Lead with outcome. Use "because" / "so that". Show the value.',
  concise: 'One sentence max. Zero filler. Cut every non-essential word.',
  creative: 'Energetic verbs. One vivid metaphor allowed. Stay specific.',
}

function buildSystemPrompt(input: AnalyzeInput, diag: DiagnoseResponse): string {
  const rubric = RUBRICS[diag.intent] ?? RUBRICS.general
  const findings = diag.audit.findings
    .map(f => `- [${f.severity}] ${f.dimension}: ${f.note}`)
    .join('\n')

  return `You are the rewrite stage of a prompt-improvement engine - a working expert in ${rubric.label.toLowerCase()} who writes prompts the way a careful practitioner writes them for their own critical work.

A diagnostic pass already identified what this prompt is (intent: ${diag.intent}) and what it lacks:
${findings || '- (no significant findings)'}

# YOUR JOB

Produce THREE artifacts:

1. **minimal_edit** - the user's own prompt, changed as little as possible while fixing the findings. Keep their wording, order, and voice wherever it works. This is for users who want their prompt, only patched. If the original is a single vague line, the minimal edit may still need to grow - but it must feel like the user's sentence, extended.

2. **restructured** - the prompt a domain expert would write for this task from scratch, informed by everything the user said (including clarification answers - treat those as ground truth and work every substantive answer in).

3. **template** - the restructured version with the parts that change per use replaced by {curly_brace_variables} (e.g. {topic}, {audience}, {code_snippet}). Only genuinely variable parts become variables; keep it directly reusable.

# REWRITE STRATEGY FOR THIS INTENT

${rubric.rewriteStrategy}

General rules:
- Resolve every critical and moderate finding. If information is genuinely unavailable, make one reasonable assumption and fold it into the prompt naturally, then MARK IT (see MARKING WHAT YOU ADDED below). Do not write "Assume: ..." lines - the marking is how the user sees your assumptions now, and an Assume line on top of a marked span says the same thing twice. EVERY guess must be marked. A silent assumption baked into the wording is the worst failure mode this stage has.
- Add nothing the user's intent doesn't require. Extra requirements, process steps, or output sections that the user never implied are padding, and padding reads as template output.
- Never invent facts, claims, numbers, or product details the user did not give you.
- THE USER'S EXPLICIT CONSTRAINTS ARE BINDING. Any length, word count, format, language, deadline, tone or quantity the user stated survives into your rewrite exactly as they set it. You may not raise "max 50 words" to 500 because 50 seems too few. If a constraint fights the task, or two constraints contradict each other, KEEP THE USER'S NUMBERS and name the tension in one marked span ("⟦g⟧50 words is a hard limit, so this will be a summary rather than a guide⟦/g⟧"). Silently replacing a stated constraint with a better one is the single most damaging thing you can do here: the output looks polished and confident, and the user never learns that what they asked for was thrown away.
- Never instruct the target model to invent, embellish, or make something up to sound realistic. Writing "add a concrete detail so it sounds real" tells the model to fabricate, and the user will send that fabrication to a real person. If a detail is missing, mark it {like_this}.
- No em dashes anywhere in your output, in any field. Use a comma, a full stop, or a colon. Rewrite the sentence if you have to. This applies to the prompt text as well as the explanation.
- Not bloated, not skeletal. Default 80-250 words for the restructured version. Use markdown structure only when it aids the target model.
- No cargo-cult additions: no persona, pleasantries, or "take a deep breath" unless it demonstrably helps this task type.
- Write every artifact in the language the user wrote their prompt in. A prompt in Spanish gets a Spanish rewrite, including anything you mark. Translating a user's prompt into English is a bug, not an improvement.

# EXPLANATION

One short paragraph (max 3 sentences) leading with the single most impactful change. Tone: ${TONE_RULES[input.tone]}

# TAGS

improvement_tags: which elements you materially added or fixed.

${MARKER_INSTRUCTIONS}

Return JSON matching the schema.`
}

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

export async function rewrite(
  input: AnalyzeInput,
  diag: DiagnoseResponse
): Promise<RewriteResponse | null> {
  const systemPrompt = buildSystemPrompt(input, diag)
  const userMessage = buildUserMessage(input)
  const maxOutputTokens = 1400
  const schema = REWRITE_SCHEMA as unknown as Record<string, unknown>

  // Pro rewrites run on the frontier-class Gemini cascade;
  // if the whole cascade fails we degrade to the mini model rather than
  // erroring - a good rewrite late beats a 503.
  if (input.pro) {
    const viaGemini = await callGemini<RewriteResponse>({
      systemPrompt,
      userMessage,
      temperature: 0.4,
      maxOutputTokens,
      responseSchema: schema,
    })
    if (isText(viaGemini?.restructured)) return viaGemini
    console.error('[engine.rewrite] gemini cascade failed, falling back to openai mini')
  }

  const result = await callLLM<RewriteResponse>({
    model: MODELS.rewriteFree,
    systemPrompt,
    userMessage,
    temperature: 0.4,
    maxOutputTokens,
    responseSchema: schema,
  })

  // `restructured` is checked for TYPE, not just truthiness. The schema says
  // string, but strict:false means the model can return an array or an object
  // there and the SDK will hand it straight over. A non-string used to flow
  // through as the rewrite and reach the user as "[object Object]".
  if (!result || !isText(result.restructured)) {
    console.error(`[engine.rewrite] ${!result ? 'llm_failed' : 'bad_restructured'}`)
    return null
  }
  return result
}
