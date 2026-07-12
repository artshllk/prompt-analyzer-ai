import type { IntentClass } from '@/types'

/**
 * Golden prompts for the engine eval. Each case pins what the diagnose
 * stage should conclude, so engine/prompt changes can be regression-
 * tested instead of eyeballed.
 *
 * expectAsk:
 *   'yes'    - genuinely ambiguous; a good engine asks (forked question)
 *   'no'     - enough context to rewrite immediately
 *   'either' - defensible both ways; only intent/quality are graded
 *
 * Grow this set whenever a real user session surprises the engine.
 */

export interface GoldenCase {
  id: string
  prompt: string
  expectIntent: IntentClass
  expectAsk: 'yes' | 'no' | 'either'
  /** Strong prompts that should trigger the honest already-good path. */
  expectAlreadyGood?: boolean
  notes?: string
}

export const GOLDEN_CASES: GoldenCase[] = [
  // ---- writing ----
  {
    id: 'writing-vague-blog',
    prompt: 'Write a blog post about AI in healthcare.',
    expectIntent: 'writing',
    expectAsk: 'yes',
    notes: 'Classic fork: SEO article vs thought-leadership vs patient explainer.',
  },
  {
    id: 'writing-specified-newsletter',
    prompt:
      'Write a 500-word section for my weekly newsletter for indie SaaS founders about why I stopped doing free trials and moved to paid pilots. Casual first-person voice, one concrete number from my own switch (trial-to-paid went from 4% to 22%), end with one question for readers to reply to.',
    expectIntent: 'writing',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'Reader, stance, shape, voice, and a done-test are all present.',
  },
  {
    id: 'writing-speech',
    prompt: 'Help me write a speech for my sister\'s wedding, I\'m the older brother. 3 minutes max, funny but ends warm. She met her husband rock climbing and I once got them lost on a hike.',
    expectIntent: 'writing',
    expectAsk: 'no',
    notes: 'Personal, specific, enough anchors to write from.',
  },

  // ---- coding ----
  {
    id: 'coding-vague-faster',
    prompt: 'Fix this function to be faster.',
    expectIntent: 'coding',
    expectAsk: 'either',
    notes: 'No code attached, no perf target. Rewrite must demand the code + target, or ask.',
  },
  {
    id: 'coding-specified-migration',
    prompt:
      'Write a Postgres migration that adds a nullable jsonb column named "metadata" to the orders table, backfills it with \'{}\' for rows created after 2025-01-01, and adds a GIN index on it. Postgres 16, plain SQL, no ORM. It must be safe to run on a table with 50M rows (no long locks).',
    expectIntent: 'coding',
    expectAsk: 'no',
    expectAlreadyGood: true,
  },
  {
    id: 'coding-regex',
    prompt: 'write a regex to validate emails in javascript',
    expectIntent: 'coding',
    expectAsk: 'either',
    notes:
      'Small task, but practical-validator vs RFC-strict is a real fork that changes the regex. Ask or assume-and-state are both fine.',
  },

  // ---- marketing ----
  {
    id: 'marketing-vague-launch',
    prompt: 'Write marketing copy for my new app.',
    expectIntent: 'marketing',
    expectAsk: 'yes',
    notes: 'No product, no reader, no channel - maximal ambiguity.',
  },
  {
    id: 'marketing-cold-email',
    prompt:
      'Write a cold email to heads of operations at mid-size logistics companies pitching our route-optimization tool. We cut fuel costs 8-12% in pilots with 3 customers. Goal: book a 20-minute demo. Under 120 words, no buzzwords.',
    expectIntent: 'marketing',
    expectAsk: 'no',
  },

  // ---- research ----
  {
    id: 'research-topic-not-question',
    prompt: 'Tell me about the impact of remote work.',
    expectIntent: 'research',
    expectAsk: 'yes',
    notes: 'Topic, not a question. Impact on what - productivity, cities, salaries, culture?',
  },
  {
    id: 'research-specified',
    prompt:
      'Summarize the strongest evidence for and against a 4-day work week for software teams specifically, using studies or company reports from 2020 onwards. Separate solid findings from weak/anecdotal ones, and end with what you could not verify. Max 600 words.',
    expectIntent: 'research',
    expectAsk: 'no',
  },

  // ---- data-analysis ----
  {
    id: 'data-vague-insights',
    prompt: 'Analyze my sales data and give me insights.',
    expectIntent: 'data-analysis',
    expectAsk: 'yes',
    notes: 'No data shape, no question, no metric.',
  },

  // ---- education ----
  {
    id: 'education-recursion',
    prompt: 'Explain recursion to me like I keep almost getting it but it slips away. I know basic Python, loops and functions.',
    expectIntent: 'education',
    expectAsk: 'no',
    notes: 'Level is stated; the struggle is described. Rewrite should add worked examples + a check.',
  },

  // ---- image-generation ----
  {
    id: 'image-vague-logo',
    prompt: 'An image of a logo for my company',
    expectIntent: 'image-generation',
    expectAsk: 'yes',
  },
  {
    id: 'image-specified',
    prompt:
      'A cozy reading nook by a rain-streaked window at dusk, warm lamp light, a sleeping cat on a wool blanket, watercolor style with soft edges, muted teal and amber palette, no people, no text, 4:5 portrait.',
    expectIntent: 'image-generation',
    expectAsk: 'no',
    expectAlreadyGood: true,
  },

  // ---- system-prompt ----
  {
    id: 'system-support-bot',
    prompt: 'Write a system prompt for a customer support chatbot for my shopify store.',
    expectIntent: 'system-prompt',
    expectAsk: 'either',
    notes: 'Missing store specifics, escalation rules, tone. Ask or assume-and-state.',
  },

  // ---- general ----
  {
    id: 'general-negotiation',
    prompt:
      'I got a job offer for $145k but I think I can get more. Current comp is $128k. The recruiter said the band goes to $160k. Help me write what to say in the negotiation call tomorrow.',
    expectIntent: 'general',
    expectAsk: 'either',
    notes:
      'Concrete numbers and deadline, but "how hard to push" (top of band vs safer ask) is a real strategy fork - asking or assuming are both defensible. May classify as writing (see intent aliases).',
  },
]

/** Intent labels close enough that we don't fail the case over taxonomy taste. */
export const INTENT_ALIASES: Partial<Record<string, IntentClass[]>> = {
  'general-negotiation': ['general', 'writing'],
  'system-support-bot': ['system-prompt', 'coding'],
  // A founder newsletter about pricing straddles writing and marketing.
  'writing-specified-newsletter': ['writing', 'marketing'],
}
