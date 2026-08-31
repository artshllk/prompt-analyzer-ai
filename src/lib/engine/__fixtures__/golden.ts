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
 * WHY THIS SET GREW FROM 16 TO 42
 *
 * At 16 cases the already-good check had three, so it scored in thirds: one
 * case flipping moved the number 33 points and a run at 67% was
 * indistinguishable from a run at 100% with one unlucky call. Several runs
 * were compared against each other on exactly that noise.
 *
 * Already-good is also the hardest judgement in the engine and the one with
 * the worst failure mode. Rewriting a prompt that was already fine is the
 * behaviour that makes a tool feel like it is padding for the sake of it, and
 * saying "this is fine" wrongly costs a user a rewrite they wanted. It now
 * has 15 positive cases and 14 graded negatives, so a single flip moves the number
 * by 3 points instead of 33, and a model that called everything already-good
 * would score 50% rather than 100%.
 *
 * The strong cases are deliberately varied in SHAPE, not just quality: short
 * and complete, long and complete, a strong prompt with a deliberate typo, a
 * strong prompt in a second language, one with a code payload, one that is
 * blunt and unpolished but leaves nothing open. A checker that only passes
 * long, tidy, English prompts has learned the wrong rule.
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
    expectAlreadyGood: false,
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
    expectAlreadyGood: false,
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
    expectAlreadyGood: false,
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
    expectAlreadyGood: false,
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

  // ================= added coverage =================
  // The set was 16 cases with 3 already-good, so that metric scored in
  // thirds. These bring it to 42 cases, 15 positives and 14 graded negatives.

  // ---- already-good: strong prompts, deliberately varied in shape ----
  {
    id: 'good-short-and-complete',
    prompt:
      'Rewrite the paragraph below so it reads at a UK GCSE level. Keep every number exactly as written, keep it to one paragraph, and do not add any new claims. Paragraph: "Net revenue retention fell to 96% in Q3, driven by three enterprise downgrades."',
    expectIntent: 'writing',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'Short does not mean weak. Task, level, hard constraints and payload all present.',
  },
  {
    id: 'good-blunt-tone',
    prompt:
      'Act as a hiring manager. Read the CV below and give me exactly 5 bullet points: 3 reasons to interview, 2 reasons not to. One sentence each. No preamble, no summary at the end. CV: 8 years backend Python, 2 years managing 3 people, no cloud certs, left last role after 7 months.',
    expectIntent: 'general',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'Unpolished and slightly blunt, but nothing is left open. Tone is not quality.',
  },
  {
    id: 'good-with-typos',
    prompt:
      'Write a 200 word annoucement post for our slack telling the eng team that deploys are frozen from friday 5pm to monday 9am becuase of the black friday traffic. calm tone, say who to contact for emergencies (on-call rota in pagerduty), no jokes.',
    expectIntent: 'writing',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'Typos are not gaps. A checker that fails this has learned to grade spelling.',
  },
  {
    id: 'good-non-english',
    prompt:
      'Schreibe eine E-Mail auf Deutsch an unseren Vermieter. Wir sind seit dem 3. August ohne Warmwasser. Fordere eine Reparatur innerhalb von 7 Tagen und erwaehne die Mietminderung. Hoeflich aber bestimmt, maximal 150 Woerter.',
    expectIntent: 'writing',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'Strong prompts are not only written in English.',
  },
  {
    id: 'good-code-payload',
    prompt:
      'Review this function for correctness only, not style. Point out any input that would make it throw or return a wrong value, one bullet per issue, and say nothing if there are none.\n\nfunction avg(xs) { return xs.reduce((a, b) => a + b) / xs.length }',
    expectIntent: 'coding',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'Code attached, scope narrowed explicitly, and a defined empty result.',
  },
  {
    id: 'good-system-prompt',
    prompt:
      'You are the support assistant for a UK bike insurance company. Answer only from the policy text provided in the conversation. If the answer is not in it, say "I do not have that in the policy" and offer to pass it to a human. Never quote a price, never guess an excess, never advise on a claim outcome. Two sentences maximum per reply, plain English, no jargon.',
    expectIntent: 'system-prompt',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'A finished system prompt. Refusals and edge cases are already written.',
  },
  {
    id: 'good-data-question',
    prompt:
      'I have a CSV with columns date, channel, spend, signups covering Jan to Jun. Tell me which channel had the best cost per signup each month, show it as a markdown table with one row per month, and flag any month where spend moved more than 30% against the month before.',
    expectIntent: 'data-analysis',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'Schema, question, output shape and a threshold. Nothing to guess.',
  },
  {
    id: 'good-research-scoped',
    prompt:
      'Summarise the current evidence on whether standing desks reduce lower back pain in office workers. Only randomised trials from 2015 onward. Separate what is well supported from what is contested, name the biggest limitation of this literature, and say plainly where the evidence is too thin to call. Under 400 words.',
    expectIntent: 'research',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'Answerable question, evidence bar, and an explicit uncertainty instruction.',
  },
  {
    id: 'good-image-detailed',
    prompt:
      'A flat vector illustration of a lighthouse on a rocky headland at dusk. Two colours only, deep navy and warm cream. No gradients, no texture, no text. Square, centred, generous margin so it works as an app icon at 64px.',
    expectIntent: 'image-generation',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'Subject, style, palette, exclusions and the end use are all fixed.',
  },
  {
    id: 'good-education-scoped',
    prompt:
      'Explain how a database index works to a junior developer who understands arrays and hash maps but has never used SQL. Use one analogy, then one concrete example with a table of 1 million rows. End by naming one situation where adding an index makes things worse. Under 300 words.',
    expectIntent: 'education',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'Named prior knowledge, which is the thing most teaching prompts leave out.',
  },

  // ---- ambiguous: should ask ----
  {
    id: 'ask-write-something',
    prompt: 'Write something about our new pricing.',
    expectIntent: 'writing',
    expectAsk: 'yes',
    expectAlreadyGood: false,
    notes: 'Announcement, justification and internal brief are different documents.',
  },
  {
    id: 'ask-make-it-better',
    prompt: 'Make this better.',
    expectIntent: 'general',
    expectAsk: 'yes',
    expectAlreadyGood: false,
    notes: 'Better at what. No payload and no direction.',
  },
  {
    id: 'ask-help-with-api',
    prompt: 'Help me with my API.',
    expectIntent: 'coding',
    expectAsk: 'yes',
    expectAlreadyGood: false,
    notes: 'Design, debug, document and test are four different jobs.',
  },
  {
    id: 'ask-social-post',
    prompt: 'Write a post about our funding round.',
    expectIntent: 'marketing',
    expectAsk: 'yes',
    expectAlreadyGood: false,
    notes: 'LinkedIn, X and a press release diverge on length, tone and audience.',
  },
  {
    id: 'ask-teach-me-python',
    prompt: 'Teach me Python.',
    expectIntent: 'education',
    expectAsk: 'yes',
    expectAlreadyGood: false,
    notes: 'Scope is unbounded. A syllabus and a first lesson are different asks.',
  },
  {
    id: 'ask-analyse-churn',
    prompt: 'Analyse our churn.',
    expectIntent: 'data-analysis',
    expectAsk: 'yes',
    expectAlreadyGood: false,
    notes: 'Measure it, explain it, or predict it. Three different outputs.',
  },

  // ---- clear enough to rewrite, but not already good ----
  {
    id: 'improve-meeting-notes',
    prompt: 'Turn my messy meeting notes into action items for the team. Notes are below.',
    expectIntent: 'writing',
    expectAsk: 'either',
    expectAlreadyGood: false,
    notes: 'Task is clear, output shape and owner fields are missing. Rewrite, do not ask.',
  },
  {
    id: 'improve-bug-report',
    prompt:
      'Write a bug report. The checkout page hangs for about ten seconds after you click pay, then works. Started this week, only on mobile Safari.',
    expectIntent: 'coding',
    expectAsk: 'either',
    expectAlreadyGood: false,
    notes: 'Real detail, but no repro steps or expected behaviour section.',
  },
  {
    id: 'improve-linkedin-about',
    prompt:
      'Rewrite my LinkedIn about section. I am a product designer, 6 years, mostly fintech, moving into design systems work.',
    expectIntent: 'marketing',
    expectAsk: 'either',
    expectAlreadyGood: false,
    notes: 'Enough to write from. Length and first vs third person are open.',
  },
  {
    id: 'improve-sql-query',
    prompt:
      'Write a SQL query to find customers who bought in January but not February, from tables customers and orders.',
    expectIntent: 'coding',
    expectAsk: 'either',
    expectAlreadyGood: false,
    notes: 'Clear question, no dialect and no column names.',
  },

  // ---- not a prompt at all ----
  {
    id: 'no-task-thanks',
    prompt: 'thanks that was perfect',
    expectIntent: 'general',
    expectAsk: 'no',
    notes: 'Improving this produces a prompt for replying to yourself. Should say there is nothing here.',
  },
  {
    id: 'no-task-greeting',
    prompt: 'hey',
    expectIntent: 'general',
    expectAsk: 'no',
    notes: 'Same. The honest answer is that there is no prompt yet.',
  },

  // ---- adversarial: must not lose the user's own constraints ----
  {
    id: 'keep-tiny-word-count',
    prompt: 'Write a product launch email. Max 50 words. I know that is short, I want it short.',
    expectIntent: 'marketing',
    expectAsk: 'either',
    notes: 'The rewrite must keep 50 and not quietly raise it to something more comfortable.',
  },
  {
    id: 'keep-payload-verbatim',
    prompt:
      'Proofread this and change nothing except real spelling errors: "Their going to the conferance on tuesday, and there bringing the new prototype with them."',
    expectIntent: 'writing',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'The payload must survive character for character. Also a fine prompt as written.',
  },
  {
    id: 'keep-interview-me',
    prompt:
      'Interview me about my startup idea. Ask one question at a time and wait for my answer before the next one.',
    expectIntent: 'general',
    expectAsk: 'no',
    expectAlreadyGood: true,
    notes: 'Back-and-forth IS the deliverable. A rewrite that removes it breaks the ask.',
  },
  {
    id: 'keep-language-german',
    prompt: 'Schreibe mir eine kurze Absage an einen Bewerber. Freundlich, keine Begruendung.',
    expectIntent: 'writing',
    expectAsk: 'either',
    notes: 'A German prompt gets a German rewrite. Translating it is a bug.',
  },
]

/** Intent labels close enough that we don't fail the case over taxonomy taste. */
export const INTENT_ALIASES: Partial<Record<string, IntentClass[]>> = {
  'general-negotiation': ['general', 'writing'],
  'system-support-bot': ['system-prompt', 'coding'],
  // A founder newsletter about pricing straddles writing and marketing.
  'writing-specified-newsletter': ['writing', 'marketing'],
  // A CV screen is a judgement task; "general" and "writing" both defensible.
  'good-blunt-tone': ['general', 'writing'],
  // Interviewing someone is a conversation design as much as a chat.
  'keep-interview-me': ['general', 'system-prompt', 'education'],
  // A LinkedIn bio is self-marketing written as prose.
  'improve-linkedin-about': ['marketing', 'writing'],
  // A Slack deploy-freeze notice is internal comms, not a campaign.
  'good-with-typos': ['writing', 'marketing'],
  // Proofreading is writing work; some taxonomies call it general.
  'keep-payload-verbatim': ['writing', 'general'],
  // A rejection note is HR comms.
  'keep-language-german': ['writing', 'general'],
  // "Analyse our churn" is data work that reads as research to some raters.
  'ask-analyse-churn': ['data-analysis', 'research'],
}
