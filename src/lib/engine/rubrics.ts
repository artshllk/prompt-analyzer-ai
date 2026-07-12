import type { IntentClass } from '@/types'

/**
 * Curated per-intent rubrics. This file is the product's proprietary
 * knowledge: what actually goes wrong in each task family, and what a
 * strong prompt for it must pin down. The diagnose stage grades against
 * the matching rubric and quotes evidence spans, so scores explain
 * themselves instead of being a vanity number.
 *
 * Editing guidance: dimensions are what gets scored (4-5 per intent,
 * short names). failureModes teach the model what a concrete failure
 * forecast looks like in this domain. rewriteStrategy is passed to the
 * rewrite stage - it is where "no cargo-cult role-play for code" lives.
 */

export interface Rubric {
  label: string
  dimensions: Array<{ name: string; what: string }>
  failureModes: string[]
  rewriteStrategy: string
}

export const RUBRICS: Record<IntentClass, Rubric> = {
  writing: {
    label: 'Writing & content',
    dimensions: [
      { name: 'reader', what: 'Who reads this, where it appears (venue), and what they already know' },
      { name: 'stance', what: 'The point being argued or the angle taken - not just the topic' },
      { name: 'shape', what: 'Length, structure, and format expectations' },
      { name: 'voice', what: 'Tone, register, first/third person, things to avoid' },
      { name: 'done-test', what: 'What makes the piece succeed - the test a good draft must pass' },
    ],
    failureModes: [
      'No stance → the model regresses to a balanced, forgettable listicle',
      'No venue/reader → generic register that fits nowhere',
      'No length bound → 900 rambling words when 300 sharp ones were wanted',
    ],
    rewriteStrategy:
      'Preserve the writer\'s intent and any voice visible in the original. Pin down reader, venue, stance, and length. Add one concrete detail or example the model must include. Do not add a persona unless voice imitation is the point.',
  },
  coding: {
    label: 'Coding & technical',
    dimensions: [
      { name: 'inputs-outputs', what: 'What the code receives and must produce, with types where relevant' },
      { name: 'environment', what: 'Language, framework, versions, and integration constraints' },
      { name: 'acceptance', what: 'How to tell the solution is correct - tests, examples, edge cases' },
      { name: 'boundaries', what: 'What must not change (signatures, deps, style) and error-case behavior' },
    ],
    failureModes: [
      'No acceptance criterion → plausible code that silently fails the real case',
      'No environment → answer targets the wrong language version or framework idiom',
      '"Make it faster/better" with no target → superficial micro-edits instead of the needed change',
    ],
    rewriteStrategy:
      'No role-play, no fluff - engineers spot it instantly. State the task as a spec: inputs, outputs, environment, constraints, and an acceptance test. Tell the user to attach the actual code, signature, or error text if they have not. Ask the model to state assumptions before writing code.',
  },
  marketing: {
    label: 'Marketing & copy',
    dimensions: [
      { name: 'one-reader', what: 'The single persona being convinced, and their objection' },
      { name: 'action', what: 'The one thing the reader should do after reading' },
      { name: 'funnel-stage', what: 'Cold audience, evaluating, or existing customer - changes everything' },
      { name: 'proof', what: 'Concrete claims, numbers, or differentiators available to use' },
      { name: 'channel', what: 'Where it runs (ad, email, landing page) and its format limits' },
    ],
    failureModes: [
      'No single reader → copy that addresses everyone and moves no one',
      'No call to action → pretty words with no next step',
      'No proof points → the model invents claims you cannot ship',
    ],
    rewriteStrategy:
      'Force one reader, one objection, one action. Include real proof points from the user (ask nothing invented). Specify channel and length. Ban superlative filler ("revolutionary", "seamless").',
  },
  research: {
    label: 'Research & analysis',
    dimensions: [
      { name: 'question', what: 'The precise question to answer, not just the topic area' },
      { name: 'scope', what: 'Boundaries: time range, geography, what is explicitly out of scope' },
      { name: 'sources', what: 'What counts as evidence - recency, source types, credibility bar' },
      { name: 'output-shape', what: 'Summary vs deep-dive, structure, and how to handle uncertainty' },
      { name: 'decision', what: 'What decision the research feeds - what would change the user\'s mind' },
    ],
    failureModes: [
      'Topic instead of question → an encyclopedia entry, not an answer',
      'No scope → shallow coverage of everything, depth on nothing',
      'No uncertainty handling → confident claims where the evidence is thin',
    ],
    rewriteStrategy:
      'Convert the topic into an answerable question. Set scope and evidence bar. Require the model to separate established facts, contested claims, and its own inference, and to say what it could not verify. For big asks, propose splitting into gather → synthesize → critique.',
  },
  'data-analysis': {
    label: 'Data analysis',
    dimensions: [
      { name: 'data-shape', what: 'What the data looks like: columns, types, size, quirks' },
      { name: 'question', what: 'The analytical question, with the metric that answers it' },
      { name: 'method', what: 'Constraints on approach (tooling, statistical rigor, performance)' },
      { name: 'output-shape', what: 'Table, chart spec, code, or narrative - and for whom' },
    ],
    failureModes: [
      'No data description → the model invents columns that do not exist',
      'No metric → "insights" that are restated averages',
      'No tooling constraint → pandas answer for a SQL-only environment',
    ],
    rewriteStrategy:
      'Describe the data explicitly (or tell the user to paste a schema/sample). Name the metric and the decision it informs. Fix the toolchain. Ask for the method to be stated before results.',
  },
  education: {
    label: 'Teaching & explanation',
    dimensions: [
      { name: 'learner', what: 'Current knowledge level and what they struggled with before' },
      { name: 'target', what: 'What the learner should be able to do afterwards' },
      { name: 'medium', what: 'Lesson, analogy, worked examples, quiz - and length' },
      { name: 'check', what: 'How understanding gets verified, not just delivered' },
    ],
    failureModes: [
      'No level → an explanation that is simultaneously too basic and too advanced',
      'No do-afterwards target → coverage without competence',
      'No check → the learner nods along and retains nothing',
    ],
    rewriteStrategy:
      'Anchor to the learner\'s level with one sentence of background. State the capability target. Prefer worked examples over abstract description, and end with a short check for understanding.',
  },
  'image-generation': {
    label: 'Image generation',
    dimensions: [
      { name: 'subject', what: 'The main subject and what it is doing - concrete, visual' },
      { name: 'style', what: 'Medium, artistic style, lighting, palette, era' },
      { name: 'composition', what: 'Framing, aspect ratio, camera/viewpoint, focal emphasis' },
      { name: 'exclusions', what: 'What must not appear (text, extra limbs, clutter, styles to avoid)' },
    ],
    failureModes: [
      'Abstract nouns ("success", "innovation") → generic stock-photo soup',
      'No style anchor → the generator\'s house style, whatever that is today',
      'No exclusions → text artifacts and clutter the user then has to regenerate away',
    ],
    rewriteStrategy:
      'Everything must be visualizable. Order: subject → action → setting → style → lighting → composition → exclusions. Keep it a dense comma-separated description, not prose paragraphs.',
  },
  'system-prompt': {
    label: 'System prompts & agents',
    dimensions: [
      { name: 'job', what: 'The assistant\'s job and the boundary of what it must refuse or escalate' },
      { name: 'inputs', what: 'What messages/data it will receive and in what format' },
      { name: 'behavior', what: 'Tone, verbosity, formatting rules for every response' },
      { name: 'edge-cases', what: 'What to do when the user is off-topic, hostile, or ambiguous' },
      { name: 'examples', what: 'At least one concrete exchange showing the desired behavior' },
    ],
    failureModes: [
      'No edge-case handling → the assistant improvises exactly where it must not',
      'No output rules → format drifts across conversations',
      'Instructions phrased as vibes ("be helpful and friendly") → unenforceable behavior',
    ],
    rewriteStrategy:
      'Structure with clear sections (job, rules, edge cases, examples). Every rule must be checkable. Include one worked example exchange. State refusal/escalation behavior explicitly.',
  },
  general: {
    label: 'General',
    dimensions: [
      { name: 'goal', what: 'The outcome wanted, stated as a result not an activity' },
      { name: 'context', what: 'Situation and constraints the model cannot guess' },
      { name: 'format', what: 'Shape and length of the answer' },
      { name: 'done-test', what: 'What would make the answer actually useful' },
    ],
    failureModes: [
      'Activity instead of outcome → the model does something, just not the thing needed',
      'Missing situational context → generic advice that ignores the user\'s reality',
    ],
    rewriteStrategy:
      'Sharpen the goal into an outcome, add the two or three facts of context that change the answer, and bound the format. Keep it lean - no persona unless it genuinely helps.',
  },
}

/** Compact rubric digest injected into the diagnose system prompt. */
export function rubricDigest(): string {
  return (Object.entries(RUBRICS) as Array<[IntentClass, Rubric]>)
    .map(([intent, r]) => {
      const dims = r.dimensions.map(d => `${d.name} (${d.what})`).join('; ')
      return `- ${intent} — ${r.label}. Dimensions: ${dims}. Typical failures: ${r.failureModes.join(' | ')}`
    })
    .join('\n')
}
