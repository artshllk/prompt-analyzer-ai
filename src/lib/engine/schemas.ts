/**
 * Gemini responseSchema definitions (OpenAPI 3.0 subset).
 * Setting these forces structurally valid JSON - no parse retries needed.
 */

export const STEP_SCHEMA = {
  type: 'object',
  properties: {
    decision: {
      type: 'string',
      enum: ['ask', 'improve'],
      description: 'ask = need more info from user; improve = ready to rewrite',
    },
    score: {
      type: 'object',
      properties: {
        total: { type: 'integer', minimum: 0, maximum: 100 },
        confidence: { type: 'integer', minimum: 0, maximum: 100 },
        gaps: {
          type: 'array',
          items: { type: 'string' },
          description: '1-3 short noun phrases naming what is missing',
        },
        domain: {
          type: 'string',
          description: 'short label for the domain inferred (e.g. "landing page copy", "react component", "data analysis")',
        },
      },
      required: ['total', 'confidence', 'gaps', 'domain'],
    },
    question: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The single most important clarifying question' },
        targets_gap: { type: 'string', description: 'Which gap this question addresses' },
        why_it_matters: { type: 'string', description: 'One sentence on why answering this changes the outcome' },
      },
      required: ['text', 'targets_gap', 'why_it_matters'],
    },
    improvement: {
      type: 'object',
      properties: {
        improved_prompt: { type: 'string' },
        explanation: { type: 'string' },
        improvement_tags: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['context', 'role', 'action', 'format', 'constraints', 'examples', 'specificity'],
          },
        },
        clarity_score_after: { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['improved_prompt', 'explanation', 'improvement_tags', 'clarity_score_after'],
    },
  },
  required: ['decision', 'score'],
} as const
