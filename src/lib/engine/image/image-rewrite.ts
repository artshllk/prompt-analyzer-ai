import { streamLLM } from '../openai-client'
import { MODELS } from '../models'
import {
  familyBrief,
  COMPOSITION_ORDER,
  ASPECT_GUIDANCE,
  DEFAULT_EXCLUSIONS,
  type StyleFamily,
} from './image-knowledge'

/**
 * The image feature's rewrite stage. Streams a finished, natural-language image
 * prompt the user can paste straight into ChatGPT or Gemini to generate an
 * image.
 *
 * Modeled on sharpen.ts: one streaming call, text-only, tier-aware model. The
 * difference is the knowledge - it writes in the vocabulary of the chosen style
 * family (see image-knowledge.ts) and lays the prompt out in the order an expert
 * uses, so a realistic request gets lens-and-lighting language and an anime
 * request gets linework-and-cel language, never the same generic soup.
 *
 * Output is NATURAL LANGUAGE for GPT Image and Imagen, never Midjourney
 * parameters (--ar, --style, --no). Those tools are not where this runs.
 *
 * Pure and portable - no Next/Supabase/HTTP imports.
 */

function systemPrompt(family: StyleFamily | null): string {
  return `You are an expert image-prompt writer. You turn a rough request into ONE finished prompt that a person will paste directly into ChatGPT or Gemini to generate an image.

${familyBrief(family)}

Write the prompt in this order, including only the parts that fit: ${COMPOSITION_ORDER}.

RULES
- Natural language only. Plain descriptive sentences or a dense descriptive phrase. NEVER Midjourney parameters (no --ar, --style, --no, no "::" weights). GPT Image and Imagen read words, not flags.
- Everything must be visualizable. Turn abstract nouns ("success", "innovation") into things a camera could see. If the user gives an abstract idea, choose a concrete scene that shows it and commit.
- Reach for the style vocabulary above, but choose from it - do not dump every term. A prompt that names a lens, a light and a mood beats one that lists twenty adjectives.
- Commit to sensible defaults for anything the user left open (framing, palette, time of day), stated as part of the description, not as questions or [brackets]. Aspect ratio when it matters: ${ASPECT_GUIDANCE}. Describe it in words ("a tall portrait image"), never as a flag.
- Say what to keep OUT when it helps this image: ${DEFAULT_EXCLUSIONS}. A logo does not want photographic detail; a portrait does not want extra fingers. Add only the exclusions that fit.
- Anything the user stated explicitly is fixed: their subject, their colours, their text, their aspect. Never overwrite it.
- Never invent a real brand, a real person's name, or a trademarked character that the user did not give. If they named their own brand, keep it; do not add someone else's.
- If the user asks for readable words in the image (a sign, a logo wordmark), state the exact text in quotes and say it must be spelled correctly, since generators mangle text.
- No em dashes. Use a comma, a full stop, or a colon.
- Write in the language the user wrote in.

Return ONLY the finished image prompt. No preamble, no quotes around the whole thing, no explanation, no markdown fences.`
}

/**
 * Streams the improved image prompt as text deltas. Caller concatenates.
 * Throws on hard failure (route decides fallback).
 *
 * `answers` are the refinement choices the user tapped after the first result,
 * folded in as ground truth. `pro` picks the stronger model, same split as the
 * text sharpen path.
 */
export async function* streamImagePrompt(params: {
  prompt: string
  styleFamily: StyleFamily | null
  answers?: Array<{ question: string; answer: string }>
  pro?: boolean
}): AsyncGenerator<string, void, unknown> {
  const parts = [`<request>\n${params.prompt.trim()}\n</request>`]

  if (params.answers && params.answers.length) {
    parts.push(
      '',
      'The user answered some questions. Treat these as ground truth and work every one in:',
      ...params.answers.map(a => `- ${a.question} -> ${a.answer}`)
    )
  }

  yield* streamLLM({
    model: params.pro ? MODELS.sharpenPro : MODELS.sharpen,
    systemPrompt: systemPrompt(params.styleFamily),
    userMessage: parts.join('\n'),
    maxOutputTokens: 700,
  })
}
