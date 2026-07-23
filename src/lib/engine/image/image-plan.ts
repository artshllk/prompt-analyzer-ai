import { callLLM } from '../openai-client'
import { MODELS } from '../models'
import { familyDigest, type StyleFamily } from './image-knowledge'

/**
 * The image feature's ask stage. One structured call that looks at a rough
 * image request and decides three things:
 *
 *   1. Is this actually an image request? (a client heuristic offered the
 *      action, but the heuristic is crude, so the model gets the final say)
 *   2. The ONE pivotal question to ask before rewriting - almost always the
 *      style family, because realistic vs animation vs illustration changes the
 *      entire prompt. Skipped when the request already names the look.
 *   3. Up to 2 refinement questions to offer AFTER the first result lands, for
 *      the details that improve an image but should not block the first one
 *      (subject specifics, framing, aspect).
 *
 * And it screens for requests we will not craft (real-person likeness, other
 * people's trademarked characters and logos, sexual or graphic content),
 * returning a friendly decline instead - the same shape the text engine's
 * no_task path uses.
 *
 * Modeled on quick-fork.ts: mini model, JSON schema, no quota. Pure and
 * portable - no Next/Supabase/HTTP imports.
 */

export interface ImageOption {
  label: string
  summary: string
  /** For the pivotal (style) question: the family key this option maps to, so
   *  the client can pass it straight to the rewrite. Absent on refinements. */
  value?: StyleFamily
}

export interface ImageQuestion {
  question: string
  options: ImageOption[]
}

export interface ImagePlan {
  /** False when the text is not really an image request. Caller bails politely. */
  isImage: boolean
  /** Detected family, or null when genuinely undecided (then pivotal asks it). */
  styleFamily: StyleFamily | null
  /** Ask before rewriting. Empty question means "clear enough, just rewrite". */
  pivotal: ImageQuestion
  /** Offer after the first result. 0-2 of them. */
  refinements: ImageQuestion[]
  /** Set when we will not craft this. When present, do not rewrite. */
  decline: string | null
}

const QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    question: { type: 'string', description: 'Short, natural. Empty string if none.' },
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: '2-4 plain words' },
          summary: { type: 'string', description: 'One short line: what you would get' },
          value: {
            type: 'string',
            description:
              'ONLY on the pivotal style question: the family key this option maps to. Omit on refinements.',
            enum: [
              'photoreal', 'cinematic', 'anime', '3d-render',
              'illustration', 'product', 'logo', 'concept-art', '',
            ],
          },
        },
        required: ['label', 'summary'],
      },
    },
  },
  required: ['question', 'options'],
} as const

const SCHEMA = {
  type: 'object',
  properties: {
    is_image: {
      type: 'boolean',
      description: 'true only if the user wants an image generated',
    },
    style_family: {
      type: 'string',
      description:
        'One of the family keys, or empty string when the request does not settle the look',
      enum: [
        'photoreal',
        'cinematic',
        'anime',
        '3d-render',
        'illustration',
        'product',
        'logo',
        'concept-art',
        '',
      ],
    },
    pivotal: QUESTION_SCHEMA,
    refinements: {
      type: 'array',
      description: '0-2 follow-up questions to offer after the first image prompt',
      items: QUESTION_SCHEMA,
    },
    decline: {
      type: 'string',
      description:
        'Empty unless the request must be refused. Then one short, friendly, non-preachy line.',
    },
  },
  required: ['is_image', 'style_family', 'pivotal', 'refinements', 'decline'],
} as const

const SYSTEM_PROMPT = `You plan how to improve a user's rough IMAGE-GENERATION prompt before an expert rewrites it. The finished prompt will be pasted into ChatGPT or Gemini to generate an image, so it must be natural language, never Midjourney-style parameters.

You do NOT write the image prompt. You decide what to ask.

# STYLE FAMILIES
${familyDigest()}

# 1. IS THIS AN IMAGE REQUEST?
Set is_image=false only if the text is clearly not asking for an image (it is a normal writing/coding/question prompt that got here by mistake). When false, everything else is empty. When in doubt, true.

# 2. THE PIVOTAL QUESTION (ask before rewriting)
The one choice that changes the WHOLE image is the style family: a realistic photo, an anime frame, a 3D render and an oil painting of the same subject share almost no words. So:
- If the request already names or clearly implies the look ("a photo of...", "anime style", "a flat logo"), set style_family to it and leave pivotal.question empty. Do not ask what you already know.
- Otherwise set style_family to empty and put the style choice in pivotal: a short natural question ("What look do you want?") and 2-4 options drawn from the families that actually fit THIS subject. A logo request offers logo/illustration/3D, not photoreal. Each option: a 2-4 word label and a one-line summary of the look.
Never ask anything else here. One question, and only when the look is open.

# 3. REFINEMENTS (offer after the first result)
0-2 questions for details that improve an image but must not block the first one: the subject's key detail, the setting or mood, framing or aspect, or what to keep out. Same option shape. These are OFFERED later, so bias toward zero or one unless the request is genuinely bare. Never re-ask the style family. Never ask for something the request already gives.

# 4. DECLINE (safety)
Set decline to a short friendly line, and leave the questions empty, when the request is one we will not craft:
- A photorealistic likeness of a real, named living person (a public figure by name). A generic person, a fictional character, or the user themselves described generically is fine.
- Someone else's trademarked character or brand logo reproduced (Pikachu, the Nike swoosh). The user's OWN logo or brand brief is fine - "a logo for my coffee shop" is allowed and encouraged.
- Sexual, explicit, or graphically violent content.
Decline the specific problem, not the whole idea, and never lecture. "I can improve this, but not as a likeness of a real person - want it as a generic character instead?" beats a refusal wall. If only part is a problem, you may keep is_image true, leave decline empty, and simply steer the questions away from the disallowed part - use decline only when the disallowed thing IS the request.

# LANGUAGE
Write every question, label and summary in the language the user wrote in. Plain, everyday words, no jargon, no em dashes.

Return the DATA the schema describes. Never echo the schema. Never return an object with "type" and "properties" keys.`

const FAMILY_KEYS: StyleFamily[] = [
  'photoreal',
  'cinematic',
  'anime',
  '3d-render',
  'illustration',
  'product',
  'logo',
  'concept-art',
]

interface RawPlan {
  is_image?: boolean
  style_family?: string
  pivotal?: ImageQuestion
  refinements?: ImageQuestion[]
  decline?: string
}

function cleanQuestion(q: ImageQuestion | undefined): ImageQuestion {
  if (!q || typeof q.question !== 'string' || !Array.isArray(q.options)) {
    return { question: '', options: [] }
  }
  const options: ImageOption[] = q.options
    .filter(o => o && typeof o.label === 'string' && o.label.trim())
    .map(o => {
      const value = FAMILY_KEYS.includes(o.value as StyleFamily) ? (o.value as StyleFamily) : undefined
      return { label: o.label.trim(), summary: (o.summary || '').trim(), value }
    })
    .slice(0, 4)
  // A question with fewer than two answers is not tappable - drop it.
  if (options.length < 2) return { question: '', options: [] }
  return { question: q.question.trim(), options }
}

export async function imagePlan(prompt: string): Promise<ImagePlan | null> {
  const res = await callLLM<RawPlan>({
    model: MODELS.imagePlan,
    systemPrompt: SYSTEM_PROMPT,
    userMessage: prompt.trim(),
    maxOutputTokens: 600,
    responseSchema: SCHEMA as unknown as Record<string, unknown>,
  })

  if (!res) return null

  const decline = typeof res.decline === 'string' && res.decline.trim() ? res.decline.trim() : null
  if (decline) {
    return { isImage: true, styleFamily: null, pivotal: { question: '', options: [] }, refinements: [], decline }
  }

  const family = FAMILY_KEYS.includes(res.style_family as StyleFamily)
    ? (res.style_family as StyleFamily)
    : null

  return {
    isImage: res.is_image !== false,
    styleFamily: family,
    pivotal: cleanQuestion(res.pivotal),
    refinements: (Array.isArray(res.refinements) ? res.refinements : [])
      .map(cleanQuestion)
      .filter(q => q.question)
      .slice(0, 2),
    decline: null,
  }
}
