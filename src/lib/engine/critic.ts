import { callLLM } from './openai-client'
import { callGemini } from './gemini-client'
import { MODELS } from './models'
import { CRITIC_SCHEMA } from './schemas'
import { RUBRICS } from './rubrics'
import type { IntentClass } from '@/types'

/**
 * Stage 5, Pro deep mode: a real second pass, not "silently critique
 * yourself" inside one completion. The critique itself is returned and
 * shown to the user - watching an expert tear apart an already-good
 * draft is the paid tier's visible value.
 */

export interface CriticResponse {
  critique: string
  refined_prompt: string
}

export async function critic(params: {
  originalPrompt: string
  draftRewrite: string
  intent: IntentClass
}): Promise<CriticResponse | null> {
  const rubric = RUBRICS[params.intent] ?? RUBRICS.general

  const systemPrompt = `You are a hostile senior reviewer of prompts for ${rubric.label.toLowerCase()} tasks. Another expert rewrote a user's prompt; your job is to attack the rewrite, then produce the version that survives your own attack.

Attack angles - use the ones that actually apply:
- Where is it still generic? Which sentence could appear in any prompt on this topic?
- What will the target model most plausibly get WRONG when given it? (${rubric.failureModes.join('; ')})
- Which stated constraint is uncheckable or contradicts another?
- Is anything filler? Does anything restate the obvious to a modern model?
- What did the original prompt contain that the rewrite dropped?

Then write refined_prompt: the draft with every real critique resolved. Keep what already works - this is a refinement, not a second rewrite. Do not exceed the draft's length by more than ~30%.

critique: 2-4 pointed sentences, written for the user to read. Name the weaknesses you found concretely ("the acceptance criterion couldn't actually be checked - 'clean code' isn't testable") - not review-speak. If the draft is genuinely strong, say so and make only surgical improvements.

Never invent facts or requirements the user didn't give. Return JSON matching the schema.`

  const userMessage = [
    '<user_original_prompt>',
    params.originalPrompt.trim(),
    '</user_original_prompt>',
    '',
    '<draft_rewrite>',
    params.draftRewrite.trim(),
    '</draft_rewrite>',
  ].join('\n')

  const schema = CRITIC_SCHEMA as unknown as Record<string, unknown>

  const viaGemini = await callGemini<CriticResponse>({
    systemPrompt,
    userMessage,
    temperature: 0.4,
    maxOutputTokens: 1600,
    responseSchema: schema,
  })
  if (viaGemini?.refined_prompt) return viaGemini

  console.error('[engine.critic] gemini cascade failed, falling back to openai mini')
  const result = await callLLM<CriticResponse>({
    model: MODELS.rewriteFree,
    systemPrompt,
    userMessage,
    temperature: 0.4,
    maxOutputTokens: 1600,
    responseSchema: schema,
  })
  if (!result?.refined_prompt) {
    console.error('[engine.critic] fallback failed too')
    return null
  }
  return result
}
