import { callLLM } from './openai-client'
import { callGemini } from './gemini-client'
import { MODELS } from './models'
import { CONTRAST_SCHEMA } from './schemas'
import type { VerifyResult } from '@/types'

/**
 * Stage 6: proof. Run the original and improved prompts against a real
 * model and return both outputs side by side, plus a one-line contrast.
 * This converts "trust us, it's better" into something the user can see.
 *
 * Outputs are capped short - the point is the visible difference in
 * behavior (structure, specificity, format), not a full deliverable.
 */

const RUN_SYSTEM_PROMPT =
  'You are the AI assistant the user will paste this prompt into. Respond to the prompt directly, exactly as you would in a normal chat. Keep the response under about 300 words; if the task demands more, produce the beginning plus a bracketed outline of the rest.'

const RUN_MAX_TOKENS = 600

/** Target models the verify endpoint accepts (provider inferred by prefix). */
export const VERIFY_TARGETS = ['gpt-5.4-mini', 'gemini-3.5-flash'] as const

async function runPrompt(prompt: string, model: string): Promise<string | null> {
  if (model.startsWith('gemini')) {
    const res = await callGemini<{ response: string }>({
      systemPrompt: RUN_SYSTEM_PROMPT,
      userMessage: prompt,
      temperature: 0.5,
      maxOutputTokens: RUN_MAX_TOKENS,
      models: [model],
      responseSchema: {
        type: 'object',
        properties: { response: { type: 'string' } },
        required: ['response'],
      },
    })
    return res?.response ?? null
  }

  const res = await callLLM<{ response: string }>({
    model,
    systemPrompt: RUN_SYSTEM_PROMPT + ' Return JSON: {"response": "..."}',
    userMessage: prompt,
    temperature: 0.5,
    maxOutputTokens: RUN_MAX_TOKENS,
    responseSchema: {
      type: 'object',
      properties: { response: { type: 'string' } },
      required: ['response'],
    },
  })
  return res?.response ?? null
}

export async function verifyPrompts(params: {
  original: string
  improved: string
  targetModel?: string
}): Promise<VerifyResult | null> {
  const model =
    params.targetModel && (VERIFY_TARGETS as readonly string[]).includes(params.targetModel)
      ? params.targetModel
      : MODELS.verifyDefault

  const [originalOutput, improvedOutput] = await Promise.all([
    runPrompt(params.original, model),
    runPrompt(params.improved, model),
  ])

  if (!originalOutput || !improvedOutput) {
    console.error(
      `[engine.verify] run failed (original=${!!originalOutput} improved=${!!improvedOutput})`
    )
    return null
  }

  const contrastRes = await callLLM<{ contrast: string }>({
    model: MODELS.contrast,
    systemPrompt:
      'Two AI outputs follow: one from a rough prompt, one from an improved version of the same prompt. In 1-2 plain-English sentences, name the most important BEHAVIORAL difference a non-technical reader would care about (structure, specificity, following instructions, staying on task). No hedging, no praise-speak. Return JSON matching the schema.',
    userMessage: [
      '<output_from_original_prompt>',
      originalOutput,
      '</output_from_original_prompt>',
      '',
      '<output_from_improved_prompt>',
      improvedOutput,
      '</output_from_improved_prompt>',
    ].join('\n'),
    temperature: 0.3,
    maxOutputTokens: 200,
    responseSchema: CONTRAST_SCHEMA as unknown as Record<string, unknown>,
  })

  return {
    originalOutput,
    improvedOutput,
    contrast: contrastRes?.contrast ?? '',
    model,
  }
}
