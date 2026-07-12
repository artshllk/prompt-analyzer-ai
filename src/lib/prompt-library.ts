/**
 * Prompt library - the data behind /prompts and /prompts/[slug].
 *
 * Each entry becomes one SEO landing page targeting a real Google search
 * ("ai prompt for X" - model-agnostic, not tied to one chatbot brand).
 * Adding a new page = adding one object here. No new files, no new routes.
 *
 * Quality bar for every entry:
 * - `prompt` must be genuinely good - something a prompt engineer would
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
  /** <title> tag - keep under ~60 chars. */
  metaTitle: string
  /** <meta description> - keep under ~155 chars. */
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
    searchTerm: 'ai prompt for a cover letter',
    metaTitle: 'AI Prompt for a Cover Letter (Free, Copy-Paste)',
    metaDescription:
      'A free, ready-to-use AI prompt that writes a tailored cover letter from a job description and your background. Works in ChatGPT, Claude, and Gemini.',
    heading: 'AI prompt for writing a cover letter',
    intro:
      'Most AI-written cover letters sound generic because the prompt is generic. This one forces the model to tie your real experience to the specific job, in a human voice, instead of the usual "I am writing to express my interest" template.',
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
- Sound like a real person: confident, warm, no corporate clichés ("synergy", "passionate", "results-driven").
- End with a clear, low-pressure call to action.

Return only the cover letter, ready to send.`,
    whyItWorks: [
      'It assigns a role ("experienced career coach") so the model writes from expertise, not from a template.',
      'It demands a concrete achievement tied to a real job requirement. That link is what stops the output sounding generic.',
      'The hard rules (word count, banned clichés, no "I am writing to apply") cut the exact phrases that make AI cover letters obvious.',
    ],
    tips: [
      'Paste only the 3-4 most important lines from the job post, not the whole thing. The model focuses better that way.',
      'Use real numbers in your achievement, like "cut response time 40%". Vague claims produce vague letters.',
      'If the first draft is too formal, add one line: "Make it slightly warmer and less stiff."',
    ],
  },
  {
    slug: 'chatgpt-summarize-article',
    title: 'Summarize an article',
    searchTerm: 'ai prompt to summarize an article',
    metaTitle: 'AI Prompt to Summarize Any Article (Free)',
    metaDescription:
      'A free AI prompt that summarizes long articles into a clear, structured brief: key points, takeaways, and what to do next. Works with ChatGPT, Claude, and Gemini.',
    heading: 'AI prompt to summarize an article',
    intro:
      'Asking an AI to "summarize this" gives you a vague blob. This prompt produces a structured brief you can actually act on: the core argument, the key points, and what it means for you, at whatever length you need.',
    category: 'Learning',
    prompt: `You are a sharp research assistant who is excellent at separating signal from noise.

Summarize the article below.

ARTICLE:
[PASTE THE FULL ARTICLE TEXT HERE]

Produce the summary in this exact structure:

**In one sentence:** the single main point of the article.

**Key points:** 3-5 bullet points, each one a distinct idea (not a rephrasing of the sentence above).

**Why it matters:** 1-2 sentences on the practical takeaway. What should a reader think or do differently?

Rules:
- Be faithful to the article. Do not add facts, opinions, or examples that are not in the text.
- Plain language. No jargon unless the article's whole point depends on it.
- If the article is biased or makes a weak claim, note it briefly under "Why it matters".

Return only the structured summary.`,
    whyItWorks: [
      'The fixed structure (one sentence → key points → why it matters) gives you a consistent, scannable result every time instead of a shapeless paragraph.',
      '"Do not add facts not in the text" is an explicit guard against the model inventing detail, the most common failure when summarizing.',
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
    searchTerm: 'ai prompt for writing emails',
    metaTitle: 'AI Prompt for Professional Emails (Free)',
    metaDescription:
      'A free, copy-paste AI prompt for writing clear, professional emails that get a reply. Set the goal, tone, and context, then get a ready-to-send draft.',
    heading: 'AI prompt for writing a professional email',
    intro:
      'A good email has one job and a clear ask. This prompt writes emails that are short, get to the point, and make it easy for the other person to say yes, instead of the long, over-polite drafts AI usually produces.',
    category: 'Work',
    prompt: `You are a clear, concise communicator who writes emails people actually reply to.

Write an email based on the details below.

WHO IT IS TO: [WHO RECEIVES THIS, e.g. "my manager", "a client", "a stranger I want a favor from"]
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
      'It separates "what I want" from "context they need", so the ask is never buried under background.',
      'The 120-word cap fights the #1 weakness of AI emails: they are far too long and too polite.',
      'Demanding a specific call to action ("confirm by Thursday") is what actually gets a reply.',
    ],
    tips: [
      'Be blunt in the "WHAT I WANT" field. The model mirrors your clarity.',
      'For a hard email (saying no, chasing a late payment), set TONE to "firm but polite" and it handles it well.',
      'If the draft feels stiff, ask: "Rewrite this the way a friendly colleague would say it out loud."',
    ],
  },
  {
    slug: 'chatgpt-code-review',
    title: 'Review my code',
    searchTerm: 'ai prompt for code review',
    metaTitle: 'AI Prompt for Code Review (Free, Copy-Paste)',
    metaDescription:
      'A free AI prompt that reviews your code like a senior engineer: bugs, edge cases, readability, and security, with prioritized, specific feedback. ChatGPT, Claude, or Gemini.',
    heading: 'AI prompt for reviewing your code',
    intro:
      'Pasting code and asking "is this good?" gets you a vague thumbs-up. This prompt makes the model review like a senior engineer: it finds real bugs, flags edge cases, and gives you prioritized, specific feedback instead of generic praise.',
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

1. **Bugs & correctness:** anything that is wrong or will break. Include edge cases the code does not handle. If there are none, say so.
2. **Readability & maintainability:** naming, structure, anything that would confuse the next developer.
3. **Performance & security:** only real issues, not theoretical ones.
4. **One thing done well:** be specific.

Rules:
- Be specific. Point to the exact line or function, and show the fix.
- Prioritize. Lead with what matters most. Do not list trivial style nits as if they were bugs.
- Do not rewrite the whole file unless asked. Explain first, then show the smallest change that fixes it.`,
    whyItWorks: [
      'Telling the model what the code is "supposed to do" lets it catch logic bugs. Without that, it can only check syntax.',
      'The fixed review order (bugs → readability → performance) stops the model from burying a real bug under style nitpicks.',
      '"Show the fix, point to the exact line" forces actionable feedback instead of vague advice like "consider refactoring".',
    ],
    tips: [
      'Paste one function or file at a time. Reviews get sharper and more specific on smaller chunks.',
      'Always fill in "what this code is supposed to do". It is the difference between a real review and a syntax check.',
      'Follow up with "Now show me the corrected version of the highest-priority issue" to get the fix in full.',
    ],
  },

  // ===== Writing =====
  {
    slug: 'chatgpt-blog-post',
    title: 'Write a blog post',
    searchTerm: 'ai prompt for a blog post',
    metaTitle: 'AI Prompt for Writing a Blog Post (Free)',
    metaDescription:
      'A free AI prompt that writes a structured, readable blog post on any topic. Set the audience, angle, and length, then get a draft worth editing.',
    heading: 'AI prompt for writing a blog post',
    intro:
      'Asking an AI to "write a blog post about X" gives you a flat, padded article that sounds like every other AI post. This prompt makes it pick a clear angle, write for a specific reader, and cut the filler.',
    category: 'Writing',
    prompt: `You are a skilled blog writer who writes clear, useful articles that people actually finish reading.

Write a blog post on the topic below.

TOPIC: [WHAT THE POST IS ABOUT]
WHO IT IS FOR: [THE READER, e.g. "beginners new to the topic", "busy professionals"]
THE ANGLE: [THE ONE MAIN POINT OR PROMISE OF THE POST]
LENGTH: [e.g. around 800 words]

Rules:
- Open with a hook that names a real problem the reader has. No "In today's fast-paced world".
- Use short paragraphs and clear subheadings.
- Make every section earn its place. If a paragraph does not help the reader, cut it.
- Use plain, direct language. Explain any necessary jargon in one line.
- End with a short, practical takeaway, not a vague summary.

Return the post with a title and subheadings, ready to edit.`,
    whyItWorks: [
      'Forcing one clear angle stops the post from being a shapeless overview that covers everything and says nothing.',
      'Naming the exact reader changes the vocabulary, examples, and depth the model chooses.',
      'The rule against filler openers cuts the single most obvious sign of an AI-written article.',
    ],
    tips: [
      'Give it a real, narrow topic. "How to price a freelance project" beats "freelancing tips".',
      'Treat the output as a strong first draft. Add your own examples and opinions to make it yours.',
      'If a section feels thin, ask it to expand only that section with a concrete example.',
    ],
  },
  {
    slug: 'chatgpt-product-description',
    title: 'Product description',
    searchTerm: 'ai prompt for product descriptions',
    metaTitle: 'AI Prompt for Product Descriptions (Free)',
    metaDescription:
      'A free AI prompt that writes product descriptions that sell. Turn features into benefits, match your brand voice, and keep it scannable.',
    heading: 'AI prompt for writing a product description',
    intro:
      'A weak product description just lists features. This prompt turns each feature into a reason to buy, written in your brand voice and short enough to actually be read.',
    category: 'Writing',
    prompt: `You are an experienced ecommerce copywriter who knows that people buy benefits, not features.

Write a product description for the item below.

PRODUCT: [WHAT IT IS]
KEY FEATURES: [LIST THE MAIN FEATURES OR SPECS]
WHO BUYS IT: [THE TARGET CUSTOMER]
BRAND VOICE: [e.g. playful, premium, plain and honest]

Rules:
- Start with one sentence that captures why this product matters to the buyer.
- For each key feature, state the feature and then the benefit it gives the customer.
- Keep it scannable: a short intro, then bullet points for features and benefits.
- Match the brand voice exactly. Do not be generic or overly hyped.
- Around 120 words total.

Return the finished description.`,
    whyItWorks: [
      'Pairing every feature with its benefit is the core skill of product copy, and most people forget to ask for it.',
      'Naming the buyer and brand voice keeps the description specific instead of sounding like every other listing.',
      'The word limit forces the model to keep only what actually drives a purchase.',
    ],
    tips: [
      'Be honest in the features list. Overhyped copy reads as fake and hurts trust.',
      'Run it once per audience if you sell to different customer types. The benefits change.',
      'Ask for 3 variations and pick the strongest opening line.',
    ],
  },
  {
    slug: 'chatgpt-social-media-post',
    title: 'Social media post',
    searchTerm: 'ai prompt for social media posts',
    metaTitle: 'AI Prompt for Social Media Posts (Free)',
    metaDescription:
      'A free AI prompt for writing social media posts that get engagement. Set the platform, goal, and voice, then get a post that sounds human.',
    heading: 'AI prompt for writing a social media post',
    intro:
      'Generic AI social posts are easy to spot: too polished, too many hashtags, no real voice. This prompt writes a post that fits the platform and sounds like a person, not a brand robot.',
    category: 'Writing',
    prompt: `You are a social media writer who knows each platform has its own rhythm and what makes people stop scrolling.

Write a social media post based on the details below.

PLATFORM: [e.g. LinkedIn, X, Instagram]
GOAL OF THE POST: [e.g. start a discussion, share a lesson, announce something]
TOPIC: [WHAT THE POST IS ABOUT]
VOICE: [e.g. casual and personal, professional, witty]

Rules:
- Open with a strong first line that works as a standalone hook.
- Match the length and tone people expect on that platform.
- Sound like a real human. No corporate buzzwords, no forced enthusiasm.
- Use at most 3 relevant hashtags, and only if they fit the platform.
- End with something that invites a reply or a thought, not a hard sell.

Return the finished post.`,
    whyItWorks: [
      'Naming the platform changes everything: length, tone, and format are different on LinkedIn vs X.',
      'Asking for a standalone first line targets the hook, which is what decides whether the post gets read at all.',
      'The cap on hashtags and buzzwords removes the most obvious tells of an AI-written post.',
    ],
    tips: [
      'Give it a real story or opinion to work from. Posts built on something true always perform better.',
      'Ask for 3 different hooks, then keep the post but swap in your favorite opening line.',
      'Read it out loud. If it does not sound like you would say it, ask it to make it more casual.',
    ],
  },
  {
    slug: 'chatgpt-story-writing',
    title: 'Creative story',
    searchTerm: 'ai prompt for creative writing',
    metaTitle: 'AI Prompt for Creative Writing & Stories (Free)',
    metaDescription:
      'A free AI prompt for writing a short story. Set the genre, character, and conflict, then get a story with real tension instead of a flat summary.',
    heading: 'AI prompt for creative writing and short stories',
    intro:
      'Ask an AI for a story and you often get a flat, rushed summary of events. This prompt gives it the building blocks of real fiction: a character who wants something, a conflict, and a reason to keep reading.',
    category: 'Writing',
    prompt: `You are a talented fiction writer who knows that good stories come from a character wanting something and struggling to get it.

Write a short story based on the elements below.

GENRE: [e.g. mystery, science fiction, slice of life]
MAIN CHARACTER: [WHO THEY ARE AND WHAT THEY WANT]
THE CONFLICT: [WHAT STANDS IN THEIR WAY]
SETTING: [WHERE AND WHEN IT HAPPENS]
LENGTH: [e.g. around 600 words]

Rules:
- Show the character through actions and choices, not a description of their personality.
- Build real tension. The outcome should feel uncertain.
- Use specific, sensory detail instead of vague description.
- Write natural dialogue if the story needs it.
- End with a moment that lands, whether it resolves or lingers.

Return the finished story.`,
    whyItWorks: [
      'A character who wants something, plus an obstacle, is the engine of every real story. Without it the model just narrates events.',
      '"Show through actions, not description" is the difference between fiction and a plot summary.',
      'Asking for genuine uncertainty in the outcome is what keeps a reader turning the page.',
    ],
    tips: [
      'Give the character a specific, concrete want. "Wants to win back a lost friend" beats "wants happiness".',
      'If the story feels rushed, ask it to expand one scene and slow down the key moment.',
      'Use it as a co-writer. Take the parts you like and rewrite the rest in your own voice.',
    ],
  },

  // ===== Work =====
  {
    slug: 'chatgpt-meeting-notes',
    title: 'Meeting notes',
    searchTerm: 'ai prompt for meeting notes',
    metaTitle: 'AI Prompt for Meeting Notes & Summaries (Free)',
    metaDescription:
      'A free AI prompt that turns a messy meeting transcript into clean notes: decisions, action items with owners, and open questions.',
    heading: 'AI prompt for meeting notes and summaries',
    intro:
      'A raw transcript is hard to use. This prompt turns it into notes people will actually read: what was decided, who owns what, and what is still open.',
    category: 'Work',
    prompt: `You are an organized assistant who is excellent at turning messy meetings into clear, useful notes.

Turn the meeting transcript or notes below into a clean summary.

MEETING TRANSCRIPT OR ROUGH NOTES:
[PASTE THE TRANSCRIPT OR YOUR NOTES HERE]

Produce the summary in this exact structure:

**Summary:** 2-3 sentences on what the meeting was about and what came out of it.

**Decisions made:** bullet points of every clear decision.

**Action items:** bullet points, each as "Task / Owner / Deadline (if mentioned)".

**Open questions:** anything raised but not resolved.

Rules:
- Only include what is actually in the transcript. Do not invent owners or deadlines.
- If an action item has no clear owner, write "Owner: unassigned".
- Keep it short and skimmable.

Return only the structured notes.`,
    whyItWorks: [
      'Separating decisions from action items from open questions makes the notes instantly useful instead of one long paragraph.',
      'The "Task / Owner / Deadline" format is what turns a discussion into something people are accountable for.',
      '"Do not invent owners or deadlines" stops the model from filling gaps with confident guesses.',
    ],
    tips: [
      'Works with a rough bullet list, not just a full transcript. Paste whatever you have.',
      'If owners are unclear, fix the "unassigned" items yourself before sending the notes out.',
      'Add "Flag anything that sounded like a risk or blocker" if the meeting was about a project.',
    ],
  },
  {
    slug: 'chatgpt-job-description',
    title: 'Job description',
    searchTerm: 'ai prompt for a job description',
    metaTitle: 'AI Prompt for Writing a Job Description (Free)',
    metaDescription:
      'A free AI prompt that writes a clear, honest job description that attracts the right people and filters out the wrong ones.',
    heading: 'AI prompt for writing a job description',
    intro:
      'Most job descriptions are a vague wish list that attracts nobody well. This prompt writes one that is honest about the role, clear about what success looks like, and easy for the right person to say yes to.',
    category: 'Work',
    prompt: `You are an experienced hiring manager who writes job descriptions that attract strong candidates and are honest about the role.

Write a job description based on the details below.

ROLE TITLE: [THE JOB TITLE]
ABOUT THE COMPANY: [ONE OR TWO SENTENCES]
WHAT THIS PERSON WILL ACTUALLY DO: [THE REAL DAY-TO-DAY WORK]
MUST-HAVE SKILLS: [THE FEW THINGS THAT TRULY MATTER]
NICE-TO-HAVE SKILLS: [OPTIONAL]
LOCATION / SETUP: [e.g. remote, hybrid, on-site]

Rules:
- Open with a short, real description of the role and why it matters.
- List day-to-day responsibilities as concrete tasks, not vague duties.
- Keep must-have requirements short and genuine. Do not pad the list.
- Be honest and specific. Avoid clichés like "rockstar" and "fast-paced".
- Use a warm, human tone, not a legal document.

Return the finished job description with clear sections.`,
    whyItWorks: [
      'Separating must-have from nice-to-have skills stops the requirement list from scaring off good candidates who could do the job.',
      'Asking for concrete day-to-day tasks gives applicants a real picture, which improves the quality of who applies.',
      'Banning clichés like "rockstar" removes the language that makes job posts blur together.',
    ],
    tips: [
      'Be ruthless with must-have skills. Three real requirements beat a list of ten.',
      'Fill in the honest day-to-day work, including the boring parts. It filters out mismatches early.',
      'Add salary range if you can. It builds trust and saves everyone time.',
    ],
  },
  {
    slug: 'chatgpt-performance-review',
    title: 'Performance review',
    searchTerm: 'ai prompt for performance reviews',
    metaTitle: 'AI Prompt for Performance Reviews (Free)',
    metaDescription:
      'A free AI prompt that helps you write a fair, specific performance review with real examples and constructive feedback.',
    heading: 'AI prompt for writing a performance review',
    intro:
      'Performance reviews go wrong when they are vague ("great team player") or harsh without a path forward. This prompt turns your rough notes into specific, fair feedback the person can act on.',
    category: 'Work',
    prompt: `You are a thoughtful manager who writes performance reviews that are honest, specific, and genuinely helpful to the person.

Write a performance review based on my notes below.

PERSON'S ROLE: [THEIR JOB]
REVIEW PERIOD: [e.g. the last 6 months]
WHAT THEY DID WELL: [ROUGH NOTES, WITH EXAMPLES IF YOU HAVE THEM]
WHERE THEY CAN IMPROVE: [ROUGH NOTES, WITH EXAMPLES IF YOU HAVE THEM]

Write the review in this structure:

**Strengths:** specific things they did well, tied to real examples.

**Areas to grow:** honest feedback, framed as forward-looking, each with a concrete suggestion.

**Focus for next period:** 2-3 clear priorities.

Rules:
- Be specific. Replace vague praise like "good communicator" with what they actually did.
- Be honest but constructive. Growth areas should never feel like an attack.
- Base everything on the notes I provided. Do not invent achievements or problems.

Return the structured review.`,
    whyItWorks: [
      'Tying feedback to real examples is what makes a review credible and fair instead of generic.',
      'Framing growth areas as forward-looking, each with a suggestion, keeps the review honest without being demoralizing.',
      'Asking for 2-3 clear priorities gives the person a focused plan rather than a long list of complaints.',
    ],
    tips: [
      'Put real examples in your notes. The review is only as specific as what you give it.',
      'Always read and adjust the final version. The judgment and the relationship are yours, not the AI’s.',
      'Keep the focus to 2-3 priorities. More than that and nothing gets improved.',
    ],
  },
  {
    slug: 'chatgpt-resignation-letter',
    title: 'Resignation letter',
    searchTerm: 'ai prompt for a resignation letter',
    metaTitle: 'AI Prompt for a Resignation Letter (Free)',
    metaDescription:
      'A free AI prompt that writes a professional, graceful resignation letter that keeps the relationship intact. Copy, paste, fill in the blanks.',
    heading: 'AI prompt for writing a resignation letter',
    intro:
      'A resignation letter has one job: leave on good terms. This prompt writes one that is short, professional, and warm, without burning a bridge you may need later.',
    category: 'Work',
    prompt: `You are a calm, professional writer who helps people resign gracefully and keep their relationships intact.

Write a resignation letter based on the details below.

MY ROLE: [YOUR JOB TITLE]
WHO IT IS ADDRESSED TO: [MANAGER OR HR NAME]
LAST WORKING DAY: [THE DATE]
TONE I WANT: [e.g. warm and grateful, brief and neutral]
ANYTHING SPECIFIC TO MENTION: [OPTIONAL, e.g. a thank-you, offer to help with handover]

Rules:
- Keep it short: 3 short paragraphs at most.
- State clearly that you are resigning and give your last working day.
- Keep it positive and professional, even if you are leaving for hard reasons.
- Do not list complaints or explain in detail why you are leaving.
- Offer a smooth handover.

Return the finished letter, ready to send.`,
    whyItWorks: [
      'The rule against listing complaints keeps the letter professional and protects the reference you may need.',
      'Requiring a clear last working day covers the one piece of information the letter legally needs.',
      'Keeping it to three short paragraphs stops it from drifting into an emotional explanation.',
    ],
    tips: [
      'Keep it positive even if the job was hard. The letter stays in your file; venting helps no one.',
      'Tell your manager in person or on a call first. The letter just makes it official.',
      'Offer help with the handover. It is a small thing that people remember.',
    ],
  },

  // ===== Coding =====
  {
    slug: 'chatgpt-explain-code',
    title: 'Explain code',
    searchTerm: 'ai prompt to explain code',
    metaTitle: 'AI Prompt to Explain Code (Free, Copy-Paste)',
    metaDescription:
      'A free AI prompt that explains any piece of code in plain language: what it does, how it works, line by line if you need it.',
    heading: 'AI prompt to explain code',
    intro:
      'Pasting code and asking "what does this do?" often gets you a vague overview. This prompt explains it clearly, at the level of detail you choose, so you actually understand it.',
    category: 'Coding',
    prompt: `You are a patient senior developer who is great at explaining code to others.

Explain the code below.

LANGUAGE: [e.g. JavaScript, Python, SQL]
MY LEVEL: [e.g. beginner, knows the basics, experienced in another language]

CODE:
\`\`\`
[PASTE YOUR CODE HERE]
\`\`\`

Explain it in this order:

1. **In one sentence:** what this code does overall.
2. **Step by step:** walk through what each main part does, in plain language.
3. **Key concepts:** briefly explain any concept a reader at my level might not know.
4. **Watch out for:** anything surprising, fragile, or easy to misuse.

Rules:
- Match the explanation to my stated level. Do not over-explain or under-explain.
- Use plain language. Define jargon the first time you use it.
- Be accurate. If part of the code is unclear or could behave unexpectedly, say so.`,
    whyItWorks: [
      'Stating your level makes the model calibrate the depth, so a beginner is not lost and an expert is not bored.',
      'The "watch out for" section surfaces fragile or surprising behavior that a plain summary would skip.',
      'Going one sentence first, then step by step, gives you the big picture before the detail.',
    ],
    tips: [
      'Paste a focused chunk, not a whole project. Explanations are clearer on smaller pieces.',
      'If a step is still unclear, ask it to explain just that line with a small example.',
      'Set your level honestly. "Beginner" and "experienced" produce very different explanations.',
    ],
  },
  {
    slug: 'chatgpt-debug-error',
    title: 'Debug an error',
    searchTerm: 'ai prompt to fix a code error',
    metaTitle: 'AI Prompt to Debug & Fix Code Errors (Free)',
    metaDescription:
      'A free AI prompt that helps you debug an error: explains the cause in plain language and shows the smallest fix that works.',
    heading: 'AI prompt to debug and fix a code error',
    intro:
      'Pasting just an error message gets you a guess. This prompt gives the model what it actually needs to debug well: the error, the code, and what you expected, so you get a real diagnosis and a clean fix.',
    category: 'Coding',
    prompt: `You are an experienced developer who is calm and methodical at debugging.

Help me fix the error below.

LANGUAGE / FRAMEWORK: [e.g. Python, React]
WHAT I EXPECTED TO HAPPEN: [THE INTENDED BEHAVIOR]
WHAT ACTUALLY HAPPENS: [THE ACTUAL BEHAVIOR]

ERROR MESSAGE:
\`\`\`
[PASTE THE FULL ERROR AND STACK TRACE]
\`\`\`

RELEVANT CODE:
\`\`\`
[PASTE THE CODE THAT IS FAILING]
\`\`\`

Respond in this order:

1. **The cause:** explain in plain language what is actually going wrong and why.
2. **The fix:** show the smallest change that fixes it. Point to the exact line.
3. **How to confirm:** how I can verify it is fixed.
4. **Prevent it:** one tip to avoid this kind of bug in future.

Rules:
- If you are not sure of the cause, say what is most likely and what else to check.
- Do not rewrite everything. Show the minimal fix.`,
    whyItWorks: [
      'Asking for what you expected vs what happened gives the model the gap it needs to find a logic bug, not just a syntax error.',
      '"Smallest change, exact line" produces a fix you can apply with confidence instead of a full rewrite.',
      'The "how to confirm" step makes sure you can actually verify the fix rather than hoping.',
    ],
    tips: [
      'Paste the full error and stack trace, not just the last line. The trace usually points to the real cause.',
      'Include the code around the failure, not only the failing line. Context matters.',
      'If the first fix does not work, tell it what changed and what new error you see.',
    ],
  },
  {
    slug: 'chatgpt-write-tests',
    title: 'Write tests',
    searchTerm: 'ai prompt to write unit tests',
    metaTitle: 'AI Prompt to Write Unit Tests (Free, Copy-Paste)',
    metaDescription:
      'A free AI prompt that writes unit tests for your code, covering the normal case, edge cases, and failure cases.',
    heading: 'AI prompt to write unit tests',
    intro:
      'Ask an AI for tests and you often get one test for the happy path. This prompt makes it cover what actually matters: edge cases, invalid input, and the failures that break things in production.',
    category: 'Coding',
    prompt: `You are a developer who writes thorough, readable unit tests and thinks hard about edge cases.

Write unit tests for the code below.

LANGUAGE: [e.g. TypeScript, Python]
TEST FRAMEWORK: [e.g. Jest, Vitest, pytest]
WHAT THIS CODE SHOULD DO: [ONE OR TWO SENTENCES]

CODE TO TEST:
\`\`\`
[PASTE YOUR CODE HERE]
\`\`\`

Cover these cases:
- The normal, expected case.
- Edge cases: empty input, zero, very large values, boundaries.
- Invalid input and error handling.
- Any tricky behavior specific to this code.

Rules:
- Give each test a clear name that says what it checks.
- Keep tests simple and independent of each other.
- Do not test the framework or the language itself, only this code.
- If the code has a bug that makes a sensible test fail, point it out.

Return the test file, ready to run.`,
    whyItWorks: [
      'Listing edge cases explicitly is what gets the model past the single happy-path test it defaults to.',
      'Telling it what the code "should do" lets it write tests for intended behavior, not just current behavior.',
      'Asking it to flag bugs that break sensible tests turns test-writing into a free code review.',
    ],
    tips: [
      'Name your test framework. Test syntax differs a lot between Jest, pytest, and others.',
      'Test one function at a time for clear, focused test files.',
      'If it writes a test that fails, check whether the test is wrong or the code is. Sometimes it found a real bug.',
    ],
  },
  {
    slug: 'chatgpt-regex',
    title: 'Write a regex',
    searchTerm: 'ai prompt to write regex',
    metaTitle: 'AI Prompt to Write Regex (Free, Copy-Paste)',
    metaDescription:
      'A free AI prompt that writes a regular expression for you and explains it clearly, with examples of what it matches and what it does not.',
    heading: 'AI prompt to write a regular expression',
    intro:
      'Regex is easy to get slightly wrong and hard to read. This prompt writes the pattern, explains every part, and shows you exactly what it matches, so you can trust it.',
    category: 'Coding',
    prompt: `You are an expert at regular expressions who can also explain them clearly.

Write a regular expression for the task below.

WHAT IT SHOULD MATCH: [DESCRIBE EXACTLY WHAT YOU WANT TO MATCH]
EXAMPLES THAT SHOULD MATCH: [PASTE A FEW EXAMPLES]
EXAMPLES THAT SHOULD NOT MATCH: [PASTE A FEW EXAMPLES]
LANGUAGE / FLAVOR: [e.g. JavaScript, Python, PCRE]

Respond with:

1. **The regex:** the pattern itself, in a code block.
2. **Explanation:** break the pattern into parts and explain what each part does.
3. **Test results:** show, for each of my examples, whether it matches and confirm that is correct.
4. **Limitations:** anything the pattern does not handle or could match by mistake.

Rules:
- Use the regex flavor I specified. Syntax differs between languages.
- Prefer a readable pattern over an overly clever one.`,
    whyItWorks: [
      'Giving both matching and non-matching examples lets the model build a precise pattern and check itself against real cases.',
      'The explanation broken into parts means you can actually maintain the regex later instead of fearing it.',
      'Asking for limitations surfaces the cases the pattern misses, which is where regex bugs usually hide.',
    ],
    tips: [
      'Always give examples that should NOT match. They stop the pattern from being too greedy.',
      'Name the language. Regex syntax and features differ between JavaScript, Python, and others.',
      'Test the pattern on your real data before trusting it. Examples never cover everything.',
    ],
  },

  // ===== Learning =====
  {
    slug: 'chatgpt-explain-concept-simply',
    title: 'Explain a concept simply',
    searchTerm: 'ai prompt to explain something simply',
    metaTitle: 'AI Prompt to Explain Anything Simply (Free)',
    metaDescription:
      'A free AI prompt that explains any concept in plain, simple terms, with an analogy and a check that you understood it.',
    heading: 'AI prompt to explain a concept simply',
    intro:
      'Ask an AI to explain something and it often answers with the same jargon that confused you. This prompt makes it explain in plain words, use an analogy, and check that it actually landed.',
    category: 'Learning',
    prompt: `You are a brilliant teacher who can make any topic simple without making it wrong.

Explain the concept below.

CONCEPT: [WHAT YOU WANT EXPLAINED]
MY CURRENT LEVEL: [e.g. complete beginner, know a little, want a deeper understanding]

Explain it in this order:

1. **The simple version:** explain it as if to a smart person who has never heard of it. No jargon.
2. **An analogy:** compare it to something from everyday life.
3. **A bit more depth:** add the important detail the simple version left out.
4. **Check my understanding:** ask me one question to see if it clicked.

Rules:
- Use plain language. If you must use a technical term, define it right away.
- Be accurate. Simple is good, but do not make it wrong to make it simple.
- Match the depth to my stated level.`,
    whyItWorks: [
      'Asking for the simple version first forces the model to drop the jargon that usually causes the confusion.',
      'A good analogy is the fastest way to make an abstract idea click, and most people forget to ask for one.',
      'The understanding-check question turns passive reading into active learning.',
    ],
    tips: [
      'Be honest about your level. "Complete beginner" gets a very different answer than "know a little".',
      'If the analogy does not work for you, ask for a different one. Analogies are personal.',
      'Answer the check question. It is the fastest way to find the gap in your understanding.',
    ],
  },
  {
    slug: 'chatgpt-study-plan',
    title: 'Make a study plan',
    searchTerm: 'ai prompt for a study plan',
    metaTitle: 'AI Prompt to Make a Study Plan (Free)',
    metaDescription:
      'A free AI prompt that builds a realistic study plan for any subject, based on your goal, deadline, and the time you actually have.',
    heading: 'AI prompt to make a study plan',
    intro:
      'A vague "help me study" gives you a generic list. This prompt builds a realistic plan around your real goal, deadline, and the hours you actually have each week.',
    category: 'Learning',
    prompt: `You are an experienced tutor who builds realistic study plans that people can actually stick to.

Build a study plan based on the details below.

WHAT I WANT TO LEARN: [THE SUBJECT OR SKILL]
MY GOAL: [WHAT YOU WANT TO BE ABLE TO DO BY THE END]
MY DEADLINE: [WHEN YOU NEED TO BE READY]
TIME I HAVE: [HOURS PER WEEK YOU CAN REALISTICALLY STUDY]
MY STARTING LEVEL: [e.g. total beginner, some experience]

Build the plan with:

- **Milestones:** the main stages, in order, from where I am to my goal.
- **Weekly breakdown:** what to focus on each week, fitting the time I have.
- **How to practice:** active practice for each stage, not just reading or watching.
- **How to check progress:** a simple way to know if a stage is done.

Rules:
- Be realistic about what fits in my available time. Do not overload the plan.
- Prioritize. If time is short, focus on what matters most for my goal.
- Favor active practice over passive consumption.`,
    whyItWorks: [
      'Building the plan around your real weekly hours keeps it realistic, which is the difference between a plan you follow and one you abandon.',
      'Tying everything to a concrete goal lets the model prioritize instead of listing everything about the subject.',
      'Asking for active practice and progress checks turns a reading list into actual learning.',
    ],
    tips: [
      'Be honest about your weekly time. An overloaded plan gets dropped in week two.',
      'Make your goal concrete. "Pass the exam" or "build a small app" beats "get good at it".',
      'Revisit the plan after two weeks and ask it to adjust based on how far you actually got.',
    ],
  },
  {
    slug: 'chatgpt-language-practice',
    title: 'Practice a language',
    searchTerm: 'ai prompt to practice a language',
    metaTitle: 'AI Prompt to Practice a Language (Free)',
    metaDescription:
      'A free AI prompt that turns any AI chatbot into a language practice partner, with conversation at your level and gentle correction.',
    heading: 'AI prompt to practice a new language',
    intro:
      'An AI chatbot is a patient language partner if you set it up right. This prompt makes it hold a real conversation at your level and correct your mistakes without breaking the flow.',
    category: 'Learning',
    prompt: `You are a friendly, patient language tutor and conversation partner.

Help me practice a language with these settings.

LANGUAGE I AM LEARNING: [THE LANGUAGE]
MY LEVEL: [e.g. beginner, intermediate]
TOPIC FOR THE CONVERSATION: [e.g. ordering food, a job interview, daily life]

How to run the practice:
- Have a natural back-and-forth conversation with me in the language, on the topic above.
- Keep your vocabulary and sentence length at my level.
- After each of my messages, gently correct any mistakes: show the corrected version and explain the fix in one short line, in English.
- Then continue the conversation with a question to keep it going.
- If I seem stuck, offer a hint or a simpler way to say it.

Start by greeting me and asking the first question. Stay in this role until I say stop.`,
    whyItWorks: [
      'Setting your level keeps the conversation in a range you can follow, instead of overwhelming or boring you.',
      'Correcting after each message, then continuing, keeps the practice flowing instead of turning into a grammar lecture.',
      'A fixed topic gives the conversation direction and teaches the vocabulary you actually need.',
    ],
    tips: [
      'Pick topics close to real situations you will face. The practice transfers better.',
      'Push yourself to reply in the language even when it is hard. The struggle is the learning.',
      'Ask it to switch to "correction only at the end" once you want to focus on fluency over accuracy.',
    ],
  },

  // ===== Business =====
  {
    slug: 'chatgpt-business-plan',
    title: 'Business plan',
    searchTerm: 'ai prompt for a business plan',
    metaTitle: 'AI Prompt for a Business Plan (Free, Copy-Paste)',
    metaDescription:
      'A free AI prompt that drafts a clear, practical one-page business plan from your idea, target customer, and how you will make money.',
    heading: 'AI prompt for writing a business plan',
    intro:
      'A 30-page business plan helps no one in the early days. This prompt drafts a sharp one-page plan that forces you to be clear about the customer, the problem, and how the money works.',
    category: 'Business',
    prompt: `You are a practical startup advisor who helps founders think clearly, not write long documents.

Draft a one-page business plan based on the details below.

THE IDEA: [WHAT THE BUSINESS DOES]
THE CUSTOMER: [WHO IT IS FOR]
THE PROBLEM: [THE PROBLEM IT SOLVES FOR THEM]
HOW IT MAKES MONEY: [THE PRICING OR REVENUE MODEL]

Write the plan with these short sections:

- **What we do:** one or two clear sentences.
- **The customer and their problem:** who they are and why this matters to them.
- **The solution:** how the product solves the problem.
- **How we make money:** the revenue model, in plain terms.
- **Why now / why us:** what makes this a good idea to do now.
- **First steps:** the 3 most important things to do in the next 90 days.
- **Biggest risk:** the one thing most likely to kill this, stated honestly.

Rules:
- Be concrete and realistic. No hype, no buzzwords.
- If part of the idea is weak or unclear, say so plainly.

Return the one-page plan.`,
    whyItWorks: [
      'A one-page limit forces clarity. If the idea cannot fit on a page, it is not clear enough yet.',
      'Asking for the biggest risk honestly is the most useful section, and the one most plans avoid.',
      'The "first steps in 90 days" section turns a plan into action instead of a document that sits in a drawer.',
    ],
    tips: [
      'Be specific about the customer. "Freelance designers" beats "small businesses".',
      'Take the "biggest risk" answer seriously. It is often the real work you have been avoiding.',
      'Use it to pressure-test the idea. If the AI struggles to make it concrete, that is a signal.',
    ],
  },
  {
    slug: 'chatgpt-marketing-copy',
    title: 'Marketing copy',
    searchTerm: 'ai prompt for marketing copy',
    metaTitle: 'AI Prompt for Marketing Copy (Free, Copy-Paste)',
    metaDescription:
      'A free AI prompt that writes marketing copy that focuses on the customer, leads with the benefit, and has one clear call to action.',
    heading: 'AI prompt for writing marketing copy',
    intro:
      'Most AI marketing copy is hype with no substance. This prompt writes copy that speaks to a real customer, leads with what they get, and asks them to do one clear thing.',
    category: 'Business',
    prompt: `You are a sharp marketing copywriter who writes copy that speaks to the customer, not about the company.

Write marketing copy for the details below.

WHAT I AM PROMOTING: [THE PRODUCT, SERVICE, OR OFFER]
WHERE IT WILL BE USED: [e.g. landing page hero, ad, email]
THE CUSTOMER: [WHO IT IS FOR AND WHAT THEY CARE ABOUT]
THE MAIN BENEFIT: [THE ONE BIGGEST REASON TO CARE]
THE CALL TO ACTION: [WHAT YOU WANT THE READER TO DO]

Rules:
- Lead with the benefit to the customer, not a feature or a company fact.
- Speak directly to the reader using "you".
- Be specific and believable. No empty hype like "revolutionary" or "game-changing".
- Match the length and format to where it will be used.
- End with one clear call to action.

Give me 3 versions with different angles, so I can pick the strongest.`,
    whyItWorks: [
      'Leading with the customer benefit, not a feature, is the core rule of good marketing copy and the one most people break.',
      'Banning empty hype words forces the copy to be specific, which is what makes it believable.',
      'Asking for 3 angles lets you compare approaches instead of betting everything on the first idea.',
    ],
    tips: [
      'Know your one main benefit before you start. Copy that tries to say everything says nothing.',
      'Pick the strongest of the 3 versions, then ask it to refine just that one.',
      'Test the copy on a real person from your audience. Their reaction beats any opinion.',
    ],
  },
  {
    slug: 'chatgpt-swot-analysis',
    title: 'SWOT analysis',
    searchTerm: 'ai prompt for a SWOT analysis',
    metaTitle: 'AI Prompt for a SWOT Analysis (Free)',
    metaDescription:
      'A free AI prompt that runs a clear, honest SWOT analysis for your business, project, or career, with practical takeaways.',
    heading: 'AI prompt for a SWOT analysis',
    intro:
      'A SWOT analysis is only useful if it is honest and specific. This prompt produces one with real, concrete points and, more importantly, what to actually do about them.',
    category: 'Business',
    prompt: `You are a clear-eyed business analyst who runs honest, practical SWOT analyses.

Run a SWOT analysis for the subject below.

WHAT WE ARE ANALYZING: [A BUSINESS, PRODUCT, PROJECT, OR CAREER]
CONTEXT: [KEY FACTS: what it is, its situation, its market or field]
THE GOAL: [WHAT SUCCESS LOOKS LIKE]

Produce the analysis in this structure:

**Strengths:** internal advantages. Be specific, not generic.
**Weaknesses:** internal disadvantages. Be honest, not flattering.
**Opportunities:** external factors that could be used to an advantage.
**Threats:** external risks that could cause harm.

Then add:

**What to do about it:** 3 practical actions that use the strengths and opportunities or reduce the weaknesses and threats.

Rules:
- Be specific to the context I gave. Avoid generic points that could apply to anything.
- Be honest about weaknesses and threats. A flattering SWOT is useless.`,
    whyItWorks: [
      'Forcing specific points stops the SWOT from filling up with generic items that apply to any business.',
      'The "what to do about it" section is what most SWOT analyses miss, and it is the only part that creates change.',
      'Asking for honesty on weaknesses and threats is what makes the exercise worth doing at all.',
    ],
    tips: [
      'Give it real context. A SWOT with thin input produces thin, obvious results.',
      'Push back if a point feels generic. Ask "make this specific to my situation".',
      'Focus your energy on the 3 actions. The four lists are just the setup for them.',
    ],
  },
  {
    slug: 'chatgpt-rewrite-text',
    title: 'Rewrite text',
    searchTerm: 'ai prompt to rewrite text',
    metaTitle: 'AI Prompt to Rewrite Any Text (Free, Copy-Paste)',
    metaDescription:
      'A free AI prompt that rewrites your text to be clearer and better without changing your meaning or voice. Works in ChatGPT, Claude, and Gemini.',
    heading: 'AI prompt for rewriting text',
    intro:
      'Most rewrite prompts hand you back something that says the same thing in a blander, more "AI" way. This one keeps your meaning and your voice, and only fixes what is actually weak: clunky sentences, repetition, and padding.',
    category: 'Writing',
    prompt: `You are a sharp editor who improves writing without flattening the author's voice.

Rewrite the text below.

TEXT:
[PASTE YOUR TEXT]

GOAL: [e.g. make it clearer / shorter / more confident / less formal]

Rules:
- Keep my meaning and my voice. Do not make it sound like generic AI writing.
- Cut padding, repetition, and filler words.
- Fix awkward or run-on sentences, but keep any phrasing that is working.
- Do not add new claims or facts I did not write.
- Match the length I asked for. If I did not say, keep it about the same length.

Return only the rewritten text. Then, in one line, tell me the single biggest change you made.`,
    whyItWorks: [
      'It tells the model to preserve your voice, which is the exact thing most rewrite prompts destroy.',
      'A clear goal ("shorter", "more confident") gives the edit a direction instead of a vague "improve this".',
      'Banning new facts stops the model from quietly inventing claims you never made.',
    ],
    tips: [
      'Be specific in the GOAL line. "More confident" produces a very different result than "friendlier".',
      'If it changed too much, add: "Stay closer to my original wording."',
      'Run it twice with different goals to compare, then take the best lines from each.',
    ],
  },
  {
    slug: 'chatgpt-proofread',
    title: 'Proofread and edit',
    searchTerm: 'ai prompt to proofread',
    metaTitle: 'AI Prompt to Proofread Your Writing (Free)',
    metaDescription:
      'A free AI prompt that proofreads text for grammar, spelling, and clarity, and shows you what it changed. Works in ChatGPT, Claude, and Gemini.',
    heading: 'AI prompt for proofreading',
    intro:
      'A plain "proofread this" often rewrites your whole style along the way. This prompt fixes real errors, flags anything unclear, and shows you exactly what it changed, so you stay in control of your own words.',
    category: 'Writing',
    prompt: `You are a careful proofreader. You fix errors without rewriting the author's style.

Proofread the text below.

TEXT:
[PASTE YOUR TEXT]

Do this:
1. Fix spelling, grammar, and punctuation errors.
2. Fix anything that is genuinely unclear or ambiguous.
3. Leave my style, tone, and word choices alone otherwise.

Then give me:
- The corrected text.
- A short list of the changes you made and why (one line each).
- Anything you were unsure about, phrased as a question.

Do not rephrase sentences that are already correct.`,
    whyItWorks: [
      'It separates real errors from style, so you get a fix, not a full rewrite.',
      'The change list means you learn from the edits instead of blindly accepting them.',
      'Asking the model to flag what it was unsure about surfaces judgment calls you should make, not it.',
    ],
    tips: [
      'For formal work, add: "Use British English" or "Use US English" so it stays consistent.',
      'Read the change list before accepting. The model is occasionally wrong about grammar rules.',
      'For a long document, paste it in sections so nothing gets skipped.',
    ],
  },
  {
    slug: 'chatgpt-presentation-outline',
    title: 'Presentation outline',
    searchTerm: 'ai prompt for a presentation outline',
    metaTitle: 'AI Prompt for a Presentation Outline (Free)',
    metaDescription:
      'A free AI prompt that turns your topic into a clear slide-by-slide presentation outline with a strong narrative. Works in ChatGPT, Claude, and Gemini.',
    heading: 'AI prompt for a presentation outline',
    intro:
      'The hardest part of a presentation is the structure, not the slides. This prompt builds a slide-by-slide outline with an actual argument running through it, so your talk goes somewhere instead of being a pile of bullet points.',
    category: 'Work',
    prompt: `You are a presentation coach who builds talks that hold an audience.

Create a slide-by-slide outline for the presentation below.

TOPIC: [WHAT THE TALK IS ABOUT]
AUDIENCE: [WHO THEY ARE AND WHAT THEY CARE ABOUT]
GOAL: [WHAT I WANT THEM TO THINK, FEEL, OR DO BY THE END]
LENGTH: [e.g. 10 minutes, roughly 10-12 slides]

For each slide give me:
- A short slide title.
- The one key point it makes (a full sentence, not a fragment).
- 1-2 supporting bullets if needed.

Rules:
- Build a clear narrative: hook, then the problem, then the payoff, then a close.
- One idea per slide. If a slide has two ideas, split it.
- End with a specific ask or takeaway that matches my goal.

Do not write speaker notes yet. Just the outline.`,
    whyItWorks: [
      'It anchors on audience and goal first, so the structure serves a point instead of just listing facts.',
      'Forcing one idea per slide is what stops the usual wall-of-bullets deck.',
      'The narrative arc (hook, problem, payoff, close) gives the talk momentum most outlines lack.',
    ],
    tips: [
      'Be honest in the GOAL line. "Get budget approved" builds a very different deck than "explain our progress".',
      'Once the outline is right, ask for speaker notes on one slide at a time.',
      'If it feels flat, add: "Make slide 1 a stronger hook, something surprising."',
    ],
  },
  {
    slug: 'chatgpt-reply-difficult-email',
    title: 'Reply to a hard email',
    searchTerm: 'ai prompt to reply to a difficult email',
    metaTitle: 'AI Prompt to Reply to a Difficult Email (Free)',
    metaDescription:
      'A free AI prompt that helps you write a calm, professional reply to a difficult or emotional email. Works in ChatGPT, Claude, and Gemini.',
    heading: 'AI prompt for replying to a difficult email',
    intro:
      'When an email makes your blood pressure rise, the reply you want to send is rarely the one you should. This prompt helps you answer difficult messages calmly and professionally, holding your position without escalating.',
    category: 'Work',
    prompt: `You are a calm, experienced communicator who de-escalates tense situations in writing.

Help me reply to the email below.

THE EMAIL I RECEIVED:
[PASTE THE EMAIL]

WHAT I WANT TO ACHIEVE: [e.g. push back, apologize, set a boundary, buy time]
MY SIDE OF THE STORY: [THE FACTS FROM MY POINT OF VIEW]
TONE I WANT: [e.g. firm but polite / warm / strictly professional]

Rules:
- Stay calm and professional. Never sarcastic, defensive, or passive-aggressive.
- Acknowledge their point before making mine.
- Be clear about my position without over-explaining or over-apologizing.
- Keep it short. Long replies escalate.

Return the reply, ready to send. Then note anything I should double-check before sending.`,
    whyItWorks: [
      'It asks for your goal and your facts first, so the reply argues your case instead of just sounding nice.',
      '"Acknowledge before you respond" is the single move that de-escalates most tense email threads.',
      'The "keep it short" rule matters: long, defensive replies almost always make things worse.',
    ],
    tips: [
      'Write your honest, angry version first somewhere else. Then paste the facts here and let this cool it down.',
      'Always read the result once more before sending. You know the relationship; the model does not.',
      'If it is too soft, add: "Be firmer about the deadline being non-negotiable."',
    ],
  },
  {
    slug: 'chatgpt-write-sql',
    title: 'Write a SQL query',
    searchTerm: 'ai prompt to write sql',
    metaTitle: 'AI Prompt to Write a SQL Query (Free, Copy-Paste)',
    metaDescription:
      'A free AI prompt that writes a correct, readable SQL query from a plain-English description of what you need. Works in ChatGPT, Claude, and Gemini.',
    heading: 'AI prompt for writing SQL',
    intro:
      'Describing what you want in plain English is easy; getting the joins and grouping right is not. This prompt turns a plain description into a correct, readable SQL query, and explains it so you can trust and adapt it.',
    category: 'Coding',
    prompt: `You are an expert SQL developer who writes clear, correct queries.

Write a SQL query for the request below.

DATABASE: [e.g. PostgreSQL, MySQL, SQLite, BigQuery]

TABLES AND COLUMNS:
[LIST EACH TABLE AND ITS RELEVANT COLUMNS, e.g. orders(id, user_id, total, created_at)]

WHAT I NEED:
[DESCRIBE THE RESULT IN PLAIN ENGLISH, e.g. "total revenue per customer for the last 30 days, highest first"]

Rules:
- Use the exact table and column names I gave you.
- Write it for the specific database I named.
- Format it to be readable, with the query on multiple lines.
- Do not invent columns. If something is missing, ask me instead of guessing.

Return the query, then explain in 2-3 lines what it does and any assumptions you made.`,
    whyItWorks: [
      'Giving it your real schema is what makes the difference between a query that runs and one that guesses column names.',
      'Naming the database matters: date functions and syntax differ between Postgres, MySQL, and BigQuery.',
      'Telling it to ask rather than guess prevents silent, invented columns that fail when you run them.',
    ],
    tips: [
      'Paste your actual CREATE TABLE statements if you have them. That removes all ambiguity.',
      'Always run the query on a small sample first. Verify the numbers before trusting them.',
      'If it is slow, follow up with: "How would you make this query faster?"',
    ],
  },
  {
    slug: 'chatgpt-document-code',
    title: 'Document code',
    searchTerm: 'ai prompt to document code',
    metaTitle: 'AI Prompt to Document Your Code (Free, Copy-Paste)',
    metaDescription:
      'A free AI prompt that writes clear comments and documentation for a function or file, explaining the why, not just the what. Works in ChatGPT, Claude, and Gemini.',
    heading: 'AI prompt for documenting code',
    intro:
      'Bad code comments just restate the code. Good ones explain why it exists and what to watch out for. This prompt documents your code the useful way, capturing intent and edge cases, not just the obvious.',
    category: 'Coding',
    prompt: `You are a senior engineer who writes documentation other developers actually thank you for.

Document the code below.

CODE:
[PASTE YOUR CODE]

LANGUAGE / STYLE: [e.g. Python docstrings, JSDoc, plain comments]

Do this:
- Add a summary that explains what this does and, more importantly, why it exists.
- Document parameters, return values, and anything that can throw or fail.
- Add short inline comments only where the logic is non-obvious. Do not comment the obvious.
- Note any edge cases, assumptions, or gotchas a future reader should know.

Rules:
- Do not restate the code in words ("increment i by 1"). Explain intent.
- Do not change the code itself. Only add documentation.

Return the fully documented code.`,
    whyItWorks: [
      'It targets the "why", which is the part that actually saves the next developer time.',
      'Telling it not to comment the obvious avoids the noise that makes people ignore comments entirely.',
      '"Do not change the code" keeps it a documentation task, so nothing breaks silently.',
    ],
    tips: [
      'Name your doc style (JSDoc, docstrings) so the output drops straight into your codebase.',
      'Check the "gotchas" it lists. Sometimes it spots a real edge case you had not considered.',
      'For a whole file, do the trickiest function first. That is where good docs matter most.',
    ],
  },
  {
    slug: 'chatgpt-flashcards',
    title: 'Make flashcards',
    searchTerm: 'ai prompt to make flashcards',
    metaTitle: 'AI Prompt to Make Flashcards (Free, Copy-Paste)',
    metaDescription:
      'A free AI prompt that turns your notes or a topic into effective question-and-answer flashcards for studying. Works in ChatGPT, Claude, and Gemini.',
    heading: 'AI prompt for making flashcards',
    intro:
      'Good flashcards test one idea at a time and make you recall, not just recognize. This prompt turns your notes or a topic into cards built that way, so studying them actually moves things into memory.',
    category: 'Learning',
    prompt: `You are a learning expert who designs flashcards for effective recall.

Make flashcards from the material below.

MATERIAL:
[PASTE YOUR NOTES, OR NAME THE TOPIC]

LEVEL: [e.g. complete beginner, exam revision, professional]
HOW MANY: [e.g. 15 cards]

Rules:
- One idea per card. Split anything that needs two answers.
- Write the front as a clear question that forces recall, not a yes/no.
- Keep the back short: the answer, plus one line of context only if needed.
- Cover the most important points first, not trivia.
- Avoid questions that give away the answer in the wording.

Format each card as:
Q: [question]
A: [answer]`,
    whyItWorks: [
      'One idea per card is the rule that separates cards that work from cards you just reread.',
      'Forcing recall questions ("what causes X?") beats recognition prompts ("is X true?") for memory.',
      'Prioritizing key points over trivia means your study time goes to what actually matters.',
    ],
    tips: [
      'Paste your own notes rather than naming a topic. The cards will match what you actually need to learn.',
      'The Q:/A: format pastes straight into Anki or Quizlet.',
      'If cards feel too easy, add: "Make the questions harder and more application-based."',
    ],
  },
  {
    slug: 'chatgpt-summarize-book',
    title: 'Summarize a book',
    searchTerm: 'ai prompt to summarize a book',
    metaTitle: 'AI Prompt to Summarize a Book (Free, Copy-Paste)',
    metaDescription:
      'A free AI prompt that summarizes a book into its core ideas, key takeaways, and what to actually do with them. Works in ChatGPT, Claude, and Gemini.',
    heading: 'AI prompt for summarizing a book',
    intro:
      'A book summary that just lists chapters is useless. This prompt pulls out the core argument, the ideas worth keeping, and what to actually do with them, so you get the value without the fluff.',
    category: 'Learning',
    prompt: `You are a sharp reader who explains books in a way that sticks.

Summarize the book below.

BOOK: [TITLE AND AUTHOR]

Give me:
1. The core argument in 2-3 sentences. What is this book really saying?
2. The 5-7 key ideas worth remembering, one line each.
3. The most useful practical takeaways: things I could actually apply.
4. One honest note on who this book is for and who can skip it.

Rules:
- Focus on ideas, not a chapter-by-chapter recap.
- Be concrete. Avoid vague self-help phrasing like "unlock your potential".
- If the book is well known enough that you know it, say so. If you are unsure of details, say that instead of inventing them.`,
    whyItWorks: [
      'Asking for the core argument first forces the summary to have a spine, not just a list.',
      'The "who can skip it" line is honest signal you rarely get from a summary, and it saves you time.',
      'Telling the model to admit uncertainty reduces the risk of confidently invented details.',
    ],
    tips: [
      'For a lesser-known book, paste the table of contents or a few key passages so it has real material.',
      'Follow up on any idea with "explain number 3 with an example" to go deeper.',
      'Treat it as a decision tool: read the summary, then decide if the full book is worth your time.',
    ],
  },
  {
    slug: 'chatgpt-customer-survey',
    title: 'Customer survey',
    searchTerm: 'ai prompt to create a customer survey',
    metaTitle: 'AI Prompt to Create a Customer Survey (Free)',
    metaDescription:
      'A free AI prompt that writes clear, unbiased customer survey questions that get you honest, useful answers. Works in ChatGPT, Claude, and Gemini.',
    heading: 'AI prompt for a customer survey',
    intro:
      'Most surveys ask leading questions and get flattering, useless answers. This prompt writes clear, unbiased questions tied to a real goal, so you learn something you can act on instead of just confirming what you hoped.',
    category: 'Business',
    prompt: `You are a research expert who designs surveys that produce honest, useful data.

Write a customer survey based on the details below.

WHAT I SELL / DO: [YOUR PRODUCT OR SERVICE]
WHAT I WANT TO LEARN: [THE ONE MAIN QUESTION, e.g. "why do people cancel?"]
WHO I AM ASKING: [e.g. new customers, churned users, free users]
LENGTH: [e.g. 6-8 questions, under 3 minutes]

Rules:
- Every question must serve the main thing I want to learn. Cut anything that does not.
- Write neutral, unbiased questions. No leading wording ("How great was...").
- Mix a few rating-scale questions with 1-2 open-ended ones.
- Put easy questions first, sensitive ones last.
- Keep it short. Long surveys get abandoned.

Return the survey, and for each question note in brackets what it is meant to reveal.`,
    whyItWorks: [
      'Tying every question to one goal is what stops surveys from ballooning into useless data.',
      'Neutral wording is the whole game: leading questions produce answers that feel good and teach nothing.',
      'Noting what each question reveals forces the survey to earn its length, question by question.',
    ],
    tips: [
      'Be ruthless in the goal line. One clear question produces a far better survey than five vague ones.',
      'Keep the open-ended questions to one or two. People skip surveys full of typing.',
      'Test it on one real customer before sending. If a question confuses them, fix it.',
    ],
  },
  {
    slug: 'chatgpt-competitor-analysis',
    title: 'Competitor analysis',
    searchTerm: 'ai prompt for competitor analysis',
    metaTitle: 'AI Prompt for Competitor Analysis (Free, Copy-Paste)',
    metaDescription:
      'A free AI prompt that structures a clear, honest competitor analysis and shows you where you can actually win. Works in ChatGPT, Claude, and Gemini.',
    heading: 'AI prompt for competitor analysis',
    intro:
      'A competitor analysis is only useful if it ends in a decision. This prompt structures the comparison and then pushes to the part that matters: where you can realistically win, and where you should not bother competing.',
    category: 'Business',
    prompt: `You are a strategist who turns competitor research into clear decisions.

Help me analyze my competitors using the details below.

MY BUSINESS: [WHAT YOU DO, AND YOUR MAIN CUSTOMER]
COMPETITORS: [LIST 2-4, WITH ANYTHING YOU KNOW ABOUT EACH]
WHAT I ALREADY KNOW: [PRICING, POSITIONING, STRENGTHS, WHATEVER YOU HAVE]

Give me:
1. A short comparison of each competitor: their apparent strength, weakness, and who they target.
2. The gaps: what customers seem to want that no one is doing well.
3. Where I can realistically win, given who I am.
4. Where I should not try to compete, and why.

Rules:
- Be honest, not flattering. If a competitor is genuinely stronger, say so.
- Base this on what I told you. If you are guessing or filling gaps, mark it clearly as a guess.
- End with the single most important move you would make.`,
    whyItWorks: [
      'It ends in a decision ("where you can win", "the one move"), not just a table nobody acts on.',
      'Asking it to mark guesses keeps you from mistaking the assumptions it makes for real market data.',
      'The "where not to compete" section is the discipline most analyses skip, and it saves the most money.',
    ],
    tips: [
      'Feed it real detail: pricing pages, their taglines, review complaints. The output is only as good as the input.',
      'Treat guessed points as questions to go research, not as facts.',
      'Push on the final move: "What would it take to actually do that in the next 90 days?"',
    ],
  },
]

export function getPromptEntry(slug: string): PromptEntry | undefined {
  return PROMPT_LIBRARY.find(e => e.slug === slug)
}

export function getAllPromptSlugs(): string[] {
  return PROMPT_LIBRARY.map(e => e.slug)
}

// -- Category hubs -----------------------------------------------------------
// Hub pages (/prompts/category/<slug>) group every prompt in a category. They
// exist to rank for mid-tier searches like "AI prompts for coding" that the
// individual prompt pages and the giant index don't target. Each needs its own
// distinct intro copy so it reads as a real page, not a thin doorway list.

type Category = PromptEntry['category']

export interface CategoryHub {
  /** URL slug: /prompts/category/<slug> */
  slug: string
  /** The category value as stored on entries. */
  category: Category
  /** H1 on the hub page. */
  heading: string
  /** <title> tag - keep under ~60 chars. */
  metaTitle: string
  /** <meta description> - keep under ~155 chars. */
  metaDescription: string
  /** One or two paragraphs of genuine, distinct intro copy. */
  intro: string[]
}

export const CATEGORY_HUBS: CategoryHub[] = [
  {
    slug: 'writing',
    category: 'Writing',
    heading: 'AI prompts for writing',
    metaTitle: 'AI Prompts for Writing (Free, Copy-Paste)',
    metaDescription:
      'Free, ready-to-use AI prompts for writing: articles, stories, rewrites, and editing. Copy, paste, and fill in the blanks. Works with ChatGPT, Claude, and Gemini.',
    intro: [
      'A blank page is the hardest part of any writing task. These prompts give you a running start. Each one sets the tone, structure, and detail an AI needs to produce a first draft you can actually build on, instead of the vague, hedged text you get from a one-line request.',
      'Copy any prompt, fill in the parts in brackets, and paste it into your AI tool. Every prompt here is free and works the same in ChatGPT, Claude, and Gemini.',
    ],
  },
  {
    slug: 'work',
    category: 'Work',
    heading: 'AI prompts for work',
    metaTitle: 'AI Prompts for Work (Free, Copy-Paste)',
    metaDescription:
      'Free AI prompts for everyday work: emails, cover letters, meeting notes, and reports. Copy, paste, and fill in the blanks. Works with ChatGPT, Claude, and Gemini.',
    intro: [
      'Most of the writing work throws at you is repetitive: the follow-up email, the status update, the cover letter that has to sound like you but better. These prompts handle the shape of those tasks so you only have to supply the facts.',
      'Pick a prompt, replace the bracketed placeholders with your own details, and run it. They are free and produce strong results in ChatGPT, Claude, and Gemini alike.',
    ],
  },
  {
    slug: 'coding',
    category: 'Coding',
    heading: 'AI prompts for coding',
    metaTitle: 'AI Prompts for Coding (Free, Copy-Paste)',
    metaDescription:
      'Free AI prompts for coding: code review, debugging, refactoring, and explaining code. Copy, paste, and fill in the blanks. Works with ChatGPT, Claude, and Gemini.',
    intro: [
      'AI is genuinely useful for code, but only when you tell it what "good" looks like. A prompt that names the language, the constraints, and the kind of answer you want turns a generic reply into a review you can act on. These prompts do that setup for you.',
      'Grab a prompt, drop in your own code or context where marked, and paste it into your AI tool. Each one is free and works in ChatGPT, Claude, and Gemini.',
    ],
  },
  {
    slug: 'learning',
    category: 'Learning',
    heading: 'AI prompts for learning',
    metaTitle: 'AI Prompts for Learning (Free, Copy-Paste)',
    metaDescription:
      'Free AI prompts for learning: explanations, study plans, quizzes, and summaries. Copy, paste, and fill in the blanks. Works with ChatGPT, Claude, and Gemini.',
    intro: [
      'An AI can be a patient tutor that never runs out of time, but the quality of the lesson depends entirely on how you ask. These prompts frame the request so the answer meets you at your level, checks your understanding, and builds from there.',
      'Choose a prompt, tell it what you are trying to learn, and run it. They are all free and work the same in ChatGPT, Claude, and Gemini.',
    ],
  },
  {
    slug: 'business',
    category: 'Business',
    heading: 'AI prompts for business',
    metaTitle: 'AI Prompts for Business (Free, Copy-Paste)',
    metaDescription:
      'Free AI prompts for business: strategy, marketing, analysis, and planning. Copy, paste, and fill in the blanks. Works with ChatGPT, Claude, and Gemini.',
    intro: [
      'Business questions are where generic AI answers hurt the most, because a vague plan looks fine until you try to act on it. These prompts force specificity: real context in, concrete and honest output back, including the parts most analyses skip.',
      'Take a prompt, give it the real details of your situation, and run it. Every prompt here is free and works in ChatGPT, Claude, and Gemini.',
    ],
  },
]

export function getCategoryHub(slug: string): CategoryHub | undefined {
  return CATEGORY_HUBS.find(h => h.slug === slug)
}

export function getPromptsInCategory(category: Category): PromptEntry[] {
  return PROMPT_LIBRARY.filter(e => e.category === category)
}
