/**
 * Prompt library — the data behind /prompts and /prompts/[slug].
 *
 * Each entry becomes one SEO landing page targeting a real Google search
 * ("chatgpt prompt for X"). Adding a new page = adding one object here.
 * No new files, no new routes.
 *
 * Quality bar for every entry:
 * - `prompt` must be genuinely good — something a prompt engineer would
 *   actually use. The free value has to be real, or the page is spam.
 * - `searchTerm` is the phrase the page is built to rank for.
 * - `placeholders` use [SQUARE BRACKETS] so the reader knows what to swap.
 */

export interface PromptEntry {
  /** URL slug: /prompts/<slug> */
  slug: string
  /** Short label for cards and nav. */
  title: string
  /** The Google search this page targets. */
  searchTerm: string
  /** <title> tag — keep under ~60 chars. */
  metaTitle: string
  /** <meta description> — keep under ~155 chars. */
  metaDescription: string
  /** H1 on the page. */
  heading: string
  /** One-paragraph intro under the H1. */
  intro: string
  /** The category for grouping on the index page. */
  category: 'Writing' | 'Work' | 'Coding' | 'Learning' | 'Business'
  /** The ready-to-copy prompt. */
  prompt: string
  /** 2-4 short bullets: why this prompt works / what makes it good. */
  whyItWorks: string[]
  /** 2-3 quick tips for adapting it. */
  tips: string[]
}

export const PROMPT_LIBRARY: PromptEntry[] = [
  {
    slug: 'chatgpt-cover-letter',
    title: 'Cover letter',
    searchTerm: 'chatgpt prompt for cover letter',
    metaTitle: 'ChatGPT Prompt for Cover Letters (Free, Copy-Paste)',
    metaDescription:
      'A free, ready-to-use ChatGPT prompt that writes a tailored cover letter from a job description and your background. Copy, paste, fill in the blanks.',
    heading: 'ChatGPT prompt for writing a cover letter',
    intro:
      'Most cover letters written by ChatGPT sound generic because the prompt is generic. This one forces the model to tie your real experience to the specific job, in a human voice — not the usual "I am writing to express my interest" template.',
    category: 'Work',
    prompt: `You are an experienced career coach who has reviewed thousands of cover letters and knows what hiring managers actually read.

Write a cover letter for the role below.

JOB TITLE: [PASTE JOB TITLE]
COMPANY: [PASTE COMPANY NAME]
JOB DESCRIPTION: [PASTE THE KEY REQUIREMENTS FROM THE JOB POST]

MY BACKGROUND:
- Current role: [YOUR CURRENT OR MOST RECENT ROLE]
- Most relevant experience: [1-2 ACHIEVEMENTS THAT MATCH THIS JOB, WITH NUMBERS IF POSSIBLE]
- Why I want this specific job: [ONE HONEST REASON]

Rules:
- Maximum 250 words, 3 short paragraphs.
- Open with a specific hook, not "I am writing to apply for".
- Connect ONE concrete achievement to ONE requirement from the job description.
- Sound like a real person — confident, warm, no corporate clichés ("synergy", "passionate", "results-driven").
- End with a clear, low-pressure call to action.

Return only the cover letter, ready to send.`,
    whyItWorks: [
      'It assigns a role ("experienced career coach") so the model writes from expertise, not from a template.',
      'It demands a concrete achievement tied to a real job requirement — this is what stops the output sounding generic.',
      'The hard rules (word count, banned clichés, no "I am writing to apply") cut the exact phrases that make AI cover letters obvious.',
    ],
    tips: [
      'Paste only the 3-4 most important lines from the job post, not the whole thing — the model focuses better.',
      'Use real numbers in your achievement ("cut response time 40%") — vague claims produce vague letters.',
      'If the first draft is too formal, add one line: "Make it slightly warmer and less stiff."',
    ],
  },
  {
    slug: 'chatgpt-summarize-article',
    title: 'Summarize an article',
    searchTerm: 'chatgpt prompt to summarize an article',
    metaTitle: 'ChatGPT Prompt to Summarize Any Article (Free)',
    metaDescription:
      'A free ChatGPT prompt that summarizes long articles into a clear, structured brief — key points, takeaways, and what to do next. Copy and paste.',
    heading: 'ChatGPT prompt to summarize an article',
    intro:
      'Asking ChatGPT to "summarize this" gives you a vague blob. This prompt produces a structured brief you can actually act on — the core argument, the key points, and what it means for you — at whatever length you need.',
    category: 'Learning',
    prompt: `You are a sharp research assistant who is excellent at separating signal from noise.

Summarize the article below.

ARTICLE:
[PASTE THE FULL ARTICLE TEXT HERE]

Produce the summary in this exact structure:

**In one sentence:** the single main point of the article.

**Key points:** 3-5 bullet points, each one a distinct idea (not a rephrasing of the sentence above).

**Why it matters:** 1-2 sentences on the practical takeaway — what a reader should think or do differently.

Rules:
- Be faithful to the article. Do not add facts, opinions, or examples that are not in the text.
- Plain language. No jargon unless the article's whole point depends on it.
- If the article is biased or makes a weak claim, note it briefly under "Why it matters".

Return only the structured summary.`,
    whyItWorks: [
      'The fixed structure (one sentence → key points → why it matters) gives you a consistent, scannable result every time instead of a shapeless paragraph.',
      '"Do not add facts not in the text" is an explicit guard against the model inventing detail — the most common failure when summarizing.',
      'Asking for the practical takeaway turns a passive summary into something you can act on.',
    ],
    tips: [
      'For very long articles, paste in sections and ask it to summarize each, then summarize the summaries.',
      'Swap "3-5 bullet points" for "8-10" if you need a detailed brief instead of a quick one.',
      'Add "Write at a level a 12-year-old could follow" if the topic is dense.',
    ],
  },
  {
    slug: 'chatgpt-email-writing',
    title: 'Write an email',
    searchTerm: 'chatgpt prompt for writing emails',
    metaTitle: 'ChatGPT Prompt for Writing Professional Emails (Free)',
    metaDescription:
      'A free, copy-paste ChatGPT prompt for writing clear, professional emails that get a reply. Set the goal, tone, and context — get a ready-to-send draft.',
    heading: 'ChatGPT prompt for writing a professional email',
    intro:
      'A good email has one job and a clear ask. This prompt makes ChatGPT write emails that are short, get to the point, and make it easy for the other person to say yes — instead of the long, over-polite drafts AI usually produces.',
    category: 'Work',
    prompt: `You are a clear, concise communicator who writes emails people actually reply to.

Write an email based on the details below.

WHO IT IS TO: [WHO RECEIVES THIS — e.g. "my manager", "a client", "a stranger I want a favor from"]
WHAT I WANT: [THE ONE THING THIS EMAIL SHOULD ACHIEVE]
CONTEXT THEY NEED: [ANY BACKGROUND THE READER NEEDS TO UNDERSTAND THE ASK]
TONE: [e.g. friendly, formal, apologetic, firm but polite]

Rules:
- Maximum 120 words. Shorter is better.
- A subject line that says exactly what the email is about.
- Get to the ask within the first 2 sentences.
- One clear, specific call to action ("Can you confirm by Thursday?" not "Let me know your thoughts").
- No filler openers ("I hope this email finds you well") and no over-apologizing.

Return the subject line and the email body, ready to send.`,
    whyItWorks: [
      'It separates "what I want" from "context they need" — so the ask is never buried under background.',
      'The 120-word cap fights the #1 weakness of AI emails: they are far too long and too polite.',
      'Demanding a specific call to action ("confirm by Thursday") is what actually gets a reply.',
    ],
    tips: [
      'Be blunt in the "WHAT I WANT" field — the model mirrors your clarity.',
      'For a hard email (saying no, chasing a late payment), set TONE to "firm but polite" and it handles it well.',
      'If the draft feels stiff, ask: "Rewrite this the way a friendly colleague would say it out loud."',
    ],
  },
  {
    slug: 'chatgpt-code-review',
    title: 'Review my code',
    searchTerm: 'chatgpt prompt for code review',
    metaTitle: 'ChatGPT Prompt for Code Review (Free, Copy-Paste)',
    metaDescription:
      'A free ChatGPT prompt that reviews your code like a senior engineer — bugs, edge cases, readability, and security — with prioritized, specific feedback.',
    heading: 'ChatGPT prompt for reviewing your code',
    intro:
      'Pasting code and asking "is this good?" gets you a vague thumbs-up. This prompt makes ChatGPT review like a senior engineer: it finds real bugs, flags edge cases, and gives you prioritized, specific feedback instead of generic praise.',
    category: 'Coding',
    prompt: `You are a senior software engineer doing a thorough but constructive code review. You care about correctness first, then readability, then performance.

Review the code below.

LANGUAGE / FRAMEWORK: [e.g. TypeScript / React, Python, Go]
WHAT THIS CODE IS SUPPOSED TO DO: [ONE OR TWO SENTENCES]

CODE:
\`\`\`
[PASTE YOUR CODE HERE]
\`\`\`

Give your review in this order:

1. **Bugs & correctness** — anything that is wrong or will break. Include edge cases the code does not handle. If there are none, say so.
2. **Readability & maintainability** — naming, structure, anything that would confuse the next developer.
3. **Performance & security** — only real issues, not theoretical ones.
4. **One thing done well** — be specific.

Rules:
- Be specific. Point to the exact line or function, and show the fix.
- Prioritize. Lead with what matters most. Do not list trivial style nits as if they were bugs.
- Do not rewrite the whole file unless asked — explain, then show the smallest change that fixes it.`,
    whyItWorks: [
      'Telling the model what the code is "supposed to do" lets it catch logic bugs — without that, it can only check syntax.',
      'The fixed review order (bugs → readability → performance) stops the model from burying a real bug under style nitpicks.',
      '"Show the fix, point to the exact line" forces actionable feedback instead of vague advice like "consider refactoring".',
    ],
    tips: [
      'Paste one function or file at a time — reviews get sharper and more specific on smaller chunks.',
      'Always fill in "what this code is supposed to do" — it is the difference between a real review and a syntax check.',
      'Follow up with "Now show me the corrected version of the highest-priority issue" to get the fix in full.',
    ],
  },
]

export function getPromptEntry(slug: string): PromptEntry | undefined {
  return PROMPT_LIBRARY.find(e => e.slug === slug)
}

export function getAllPromptSlugs(): string[] {
  return PROMPT_LIBRARY.map(e => e.slug)
}
