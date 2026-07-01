// Thin client over the Deepclario analyze API. Mirrors the contract of
// POST /api/anon/analyze in the web app (see
// src/app/api/anon/analyze/route.ts). The endpoint is stateless and
// public; an optional `dc_` bearer token lifts anonymous IP limits to the
// user's plan (free 25/mo or Pro unlimited).

export type Tone =
  | 'professional'
  | 'friendly'
  | 'persuasive'
  | 'concise'
  | 'creative'

export interface QAPair {
  question: string
  answer: string
  turn: number
}

export interface ClarifyingResult {
  type: 'clarifying'
  question: string
  targetsGap: string
  confidenceSoFar: number
  scoreBeforeImprovement: number
  tier: 'anon' | 'free' | 'pro'
}

export interface ImprovedResult {
  type: 'improved'
  improvedPrompt: string
  explanation: string
  improvementTags: string[]
  clarityScoreAfter: number
  scoreBeforeImprovement: number
  tier: 'anon' | 'free' | 'pro'
}

export type AnalyzeResult = ClarifyingResult | ImprovedResult

export type AnalyzeError =
  | 'rate_limited'
  | 'monthly_limit'
  | 'prompt_required'
  | 'prompt_too_long'
  | 'ai_unavailable'
  | 'network'
  | 'server_error'

export class DeepclarioApiError extends Error {
  constructor(public readonly code: AnalyzeError, message?: string) {
    super(message ?? code)
  }
}

interface AnalyzeArgs {
  baseUrl: string
  prompt: string
  tone: Tone
  priorAnswers?: QAPair[]
  token?: string | null
}

/**
 * Analyze (and improve) a prompt. Throws DeepclarioApiError with a stable
 * code the caller can map to a message. Uses the global fetch shipped with
 * Node 18+ (VS Code's runtime), so no extra dependency.
 */
export async function analyze({
  baseUrl,
  prompt,
  tone,
  priorAnswers = [],
  token,
}: AnalyzeArgs): Promise<AnalyzeResult> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/anon/analyze`

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, tone, priorAnswers, source: 'vscode' }),
    })
  } catch {
    throw new DeepclarioApiError('network')
  }

  if (res.status === 429) throw new DeepclarioApiError('rate_limited')
  if (res.status === 402) throw new DeepclarioApiError('monthly_limit')

  if (!res.ok) {
    // Try to surface a specific server error code, else generic.
    let code: AnalyzeError = 'server_error'
    try {
      const data = (await res.json()) as { error?: string }
      if (data.error === 'prompt_required') code = 'prompt_required'
      else if (data.error === 'prompt_too_long') code = 'prompt_too_long'
      else if (data.error === 'ai_unavailable') code = 'ai_unavailable'
    } catch {
      /* ignore parse failure, keep server_error */
    }
    throw new DeepclarioApiError(code)
  }

  return (await res.json()) as AnalyzeResult
}

export function errorMessage(code: AnalyzeError): string {
  switch (code) {
    case 'rate_limited':
      return 'Rate limit reached. Connect your Deepclario account for higher limits, or wait a minute.'
    case 'monthly_limit':
      return "You've used all 25 free prompts this month. Upgrade to Pro at deepclario.com for unlimited use."
    case 'prompt_required':
      return 'Select some text to improve first.'
    case 'prompt_too_long':
      return 'That selection is too long (max 4000 characters).'
    case 'ai_unavailable':
      return 'The AI service is briefly unavailable. Try again in a moment.'
    case 'network':
      return 'Could not reach Deepclario. Check your connection.'
    default:
      return 'Something went wrong. Try again.'
  }
}
