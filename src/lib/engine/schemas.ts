/**
 * Response schemas for the pipeline stages (JSON Schema subset accepted by
 * both OpenAI Structured Outputs strict:false and Gemini responseSchema).
 * Setting these forces structurally valid JSON - no parse retries needed.
 */

const INTENTS = [
  'writing',
  'coding',
  'marketing',
  'research',
  'data-analysis',
  'education',
  'image-generation',
  'system-prompt',
  'general',
]

export const DIAGNOSE_SCHEMA = {
  type: 'object',
  properties: {
    intent: { type: 'string', enum: INTENTS },
    score: {
      type: 'object',
      properties: {
        total: { type: 'integer', minimum: 0, maximum: 100 },
        confidence: { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['total', 'confidence'],
    },
    already_good: {
      type: 'boolean',
      description: 'true only when the prompt is genuinely strong as-is and a rewrite would add mostly noise',
    },
    already_good_notes: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Specific reasons the prompt is strong - name what it does right' },
        tweaks: { type: 'array', items: { type: 'string' }, description: '1-2 marginal tweaks worth considering' },
      },
      required: ['message', 'tweaks'],
    },
    no_task: {
      type: 'boolean',
      description:
        'true only when the input contains no request an AI could act on (a thank-you, a greeting, a reaction). Thin-but-real instructions are NOT no_task',
    },
    no_task_reason: {
      type: 'string',
      description: 'One short friendly sentence saying there is nothing here to improve',
    },
    forks: {
      type: 'array',
      description: '2-3 genuinely different plausible readings of the prompt, if any exist',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Short name for this reading, max ~8 words' },
          summary: { type: 'string', description: 'One sentence: what the output would look like under this reading' },
        },
        required: ['label', 'summary'],
      },
    },
    question: {
      type: 'object',
      description: 'Present ONLY when the forks diverge enough that the rewrite would be substantively different',
      properties: {
        text: { type: 'string' },
        targets_gap: { type: 'string' },
      },
      required: ['text', 'targets_gap'],
    },
    audit: {
      type: 'object',
      properties: {
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              score: { type: 'integer', minimum: 0, maximum: 100 },
            },
            required: ['name', 'score'],
          },
        },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'moderate', 'minor'] },
              evidence: {
                type: 'string',
                description: 'EXACT phrase copied from the user prompt this finding anchors to; empty string when the problem is an absence',
              },
              note: { type: 'string', description: 'Plain-English what is wrong and why it matters' },
            },
            required: ['dimension', 'severity', 'evidence', 'note'],
          },
        },
        failure_forecast: {
          type: 'array',
          items: { type: 'string' },
          description: '1-3 concrete predictions of what a model will do wrong given the prompt as-is',
        },
      },
      required: ['dimensions', 'findings', 'failure_forecast'],
    },
  },
  required: ['intent', 'score', 'already_good', 'audit'],
} as const

export const REWRITE_SCHEMA = {
  type: 'object',
  properties: {
    minimal_edit: {
      type: 'string',
      description: "The user's own wording, gaps patched with the fewest possible changes",
    },
    restructured: {
      type: 'string',
      description:
        'The full expert rewrite. Anything you decided for the user must be wrapped in the guess markers, and anything from their clarification answer in the answered markers, exactly as the system prompt describes. Text from their own prompt stays unmarked.',
    },
    template: {
      type: 'string',
      description: 'Reusable version of the restructured prompt with {curly_brace} variables for the parts that change per use. No markers in this field.',
    },
    explanation: { type: 'string' },
    improvement_tags: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['context', 'role', 'action', 'format', 'constraints', 'examples', 'specificity'],
      },
    },
  },
  required: ['minimal_edit', 'restructured', 'template', 'explanation', 'improvement_tags'],
} as const

export const CONTRAST_SCHEMA = {
  type: 'object',
  properties: {
    contrast: {
      type: 'string',
      description: '1-2 sentences naming the most important behavioral difference between the two outputs',
    },
  },
  required: ['contrast'],
} as const
