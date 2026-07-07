import { callLLM } from '@/lib/engine/openai-client'
import type { IdentitySuggestion, ExpertiseLevel } from './types'

/**
 * Auto-extraction for the Identity layer. Infers who the user is from the
 * prompts they've actually written, so onboarding is "confirm what we
 * noticed" rather than "fill out a form". The result is only ever a
 * SUGGESTION - the user confirms before any of it reaches a rewrite.
 */

const SUGGESTION_SCHEMA = {
  type: 'object',
  properties: {
    role: { type: ['string', 'null'] },
    company: { type: ['string', 'null'] },
    industry: { type: ['string', 'null'] },
    expertise_level: { type: ['string', 'null'], enum: ['beginner', 'intermediate', 'advanced', 'expert', null] },
    languages: { type: 'array', items: { type: 'string' } },
    tone_note: { type: ['string', 'null'] },
  },
  required: ['role', 'company', 'industry', 'expertise_level', 'languages', 'tone_note'],
  additionalProperties: false,
}

interface RawSuggestion {
  role: string | null
  company: string | null
  industry: string | null
  expertise_level: string | null
  languages: string[]
  tone_note: string | null
}

const VALID_LEVELS: ExpertiseLevel[] = ['beginner', 'intermediate', 'advanced', 'expert']

function clean(v: string | null | undefined): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (!t || t.toLowerCase() === 'unknown' || t.toLowerCase() === 'n/a') return null
  return t.slice(0, 120)
}

export async function suggestIdentity(prompts: string[]): Promise<IdentitySuggestion | null> {
  const corpus = prompts.map(p => p.trim()).filter(Boolean).slice(0, 15)
  if (corpus.length < 3) return null // too little signal to guess responsibly

  const systemPrompt = `You infer a professional profile from the prompts a person writes to an AI assistant. You are cautious: only state a field when the prompts genuinely imply it. Guessing wrong is worse than leaving a field null.

Return JSON with these fields (use null when the prompts don't clearly support a value):
- role: their job/role in a few words (e.g. "backend engineer", "founder", "marketing manager").
- company: only if explicitly named; otherwise null.
- industry: their field (e.g. "fintech", "healthcare", "e-commerce").
- expertise_level: one of beginner, intermediate, advanced, expert - inferred from sophistication, or null.
- languages: human languages they clearly work in (e.g. ["English", "Spanish"]). Default ["English"] only if evident.
- tone_note: one short phrase capturing a consistent voice preference you observe (e.g. "prefers plain, direct language"), or null.

Never invent a company. Never over-claim expertise. When unsure, use null.`

  const userMessage = `Here are recent prompts this person wrote:\n\n${corpus.map((p, i) => `${i + 1}. ${p.slice(0, 400)}`).join('\n')}`

  const raw = await callLLM<RawSuggestion>({
    systemPrompt,
    userMessage,
    temperature: 0.2,
    maxOutputTokens: 300,
    responseSchema: SUGGESTION_SCHEMA as unknown as Record<string, unknown>,
  })
  if (!raw) return null

  const level = clean(raw.expertise_level)?.toLowerCase()
  const suggestion: IdentitySuggestion = {
    role: clean(raw.role),
    company: clean(raw.company),
    industry: clean(raw.industry),
    expertiseLevel: level && VALID_LEVELS.includes(level as ExpertiseLevel) ? (level as ExpertiseLevel) : null,
    languages: Array.isArray(raw.languages)
      ? raw.languages.map(l => clean(l)).filter((l): l is string => !!l).slice(0, 5)
      : [],
    toneNote: clean(raw.tone_note),
  }

  // Nothing useful inferred → no suggestion at all.
  const hasAnything =
    suggestion.role || suggestion.company || suggestion.industry ||
    suggestion.expertiseLevel || (suggestion.languages?.length ?? 0) > 0 || suggestion.toneNote
  return hasAnything ? suggestion : null
}
