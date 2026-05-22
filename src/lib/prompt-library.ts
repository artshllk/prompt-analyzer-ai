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
      'Most cover letters written by ChatGPT sound generic because the prompt is generic. This one forces the model to tie your real experience to the specific job, in a human voice, instead of the usual "I am writing to express my interest" template.',
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
    searchTerm: 'chatgpt prompt to summarize an article',
    metaTitle: 'ChatGPT Prompt to Summarize Any Article (Free)',
    metaDescription:
      'A free ChatGPT prompt that summarizes long articles into a clear, structured brief: key points, takeaways, and what to do next. Copy and paste.',
    heading: 'ChatGPT prompt to summarize an article',
    intro:
      'Asking ChatGPT to "summarize this" gives you a vague blob. This prompt produces a structured brief you can actually act on: the core argument, the key points, and what it means for you, at whatever length you need.',
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
    searchTerm: 'chatgpt prompt for writing emails',
    metaTitle: 'ChatGPT Prompt for Writing Professional Emails (Free)',
    metaDescription:
      'A free, copy-paste ChatGPT prompt for writing clear, professional emails that get a reply. Set the goal, tone, and context, then get a ready-to-send draft.',
    heading: 'ChatGPT prompt for writing a professional email',
    intro:
      'A good email has one job and a clear ask. This prompt makes ChatGPT write emails that are short, get to the point, and make it easy for the other person to say yes, instead of the long, over-polite drafts AI usually produces.',
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
    searchTerm: 'chatgpt prompt for code review',
    metaTitle: 'ChatGPT Prompt for Code Review (Free, Copy-Paste)',
    metaDescription:
      'A free ChatGPT prompt that reviews your code like a senior engineer. It covers bugs, edge cases, readability, and security, with prioritized, specific feedback.',
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
    searchTerm: 'chatgpt prompt for blog post',
    metaTitle: 'ChatGPT Prompt for Writing a Blog Post (Free)',
    metaDescription:
      'A free ChatGPT prompt that writes a structured, readable blog post on any topic. Set the audience, angle, and length, then get a draft worth editing.',
    heading: 'ChatGPT prompt for writing a blog post',
    intro:
      'Asking ChatGPT to "write a blog post about X" gives you a flat, padded article that sounds like every other AI post. This prompt makes it pick a clear angle, write for a specific reader, and cut the filler.',
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
    searchTerm: 'chatgpt prompt for product description',
    metaTitle: 'ChatGPT Prompt for Product Descriptions (Free)',
    metaDescription:
      'A free ChatGPT prompt that writes product descriptions that sell. Turn features into benefits, match your brand voice, and keep it scannable.',
    heading: 'ChatGPT prompt for writing a product description',
    intro:
      'A weak product description just lists features. This prompt makes ChatGPT turn each feature into a reason to buy, written in your brand voice and short enough to actually be read.',
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
    searchTerm: 'chatgpt prompt for social media posts',
    metaTitle: 'ChatGPT Prompt for Social Media Posts (Free)',
    metaDescription:
      'A free ChatGPT prompt for writing social media posts that get engagement. Set the platform, goal, and voice, then get a post that sounds human.',
    heading: 'ChatGPT prompt for writing a social media post',
    intro:
      'Generic AI social posts are easy to spot: too polished, too many hashtags, no real voice. This prompt makes ChatGPT write a post that fits the platform and sounds like a person, not a brand robot.',
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
    searchTerm: 'chatgpt prompt for creative writing',
    metaTitle: 'ChatGPT Prompt for Creative Writing & Stories (Free)',
    metaDescription:
      'A free ChatGPT prompt for writing a short story. Set the genre, character, and conflict, then get a story with real tension instead of a flat summary.',
    heading: 'ChatGPT prompt for creative writing and short stories',
    intro:
      'Ask ChatGPT for a story and you often get a flat, rushed summary of events. This prompt gives it the building blocks of real fiction: a character who wants something, a conflict, and a reason to keep reading.',
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
    searchTerm: 'chatgpt prompt for meeting notes',
    metaTitle: 'ChatGPT Prompt for Meeting Notes & Summaries (Free)',
    metaDescription:
      'A free ChatGPT prompt that turns a messy meeting transcript into clean notes: decisions, action items with owners, and open questions.',
    heading: 'ChatGPT prompt for meeting notes and summaries',
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
    searchTerm: 'chatgpt prompt for job description',
    metaTitle: 'ChatGPT Prompt for Writing a Job Description (Free)',
    metaDescription:
      'A free ChatGPT prompt that writes a clear, honest job description that attracts the right people and filters out the wrong ones.',
    heading: 'ChatGPT prompt for writing a job description',
    intro:
      'Most job descriptions are a vague wish list that attracts nobody well. This prompt makes ChatGPT write one that is honest about the role, clear about what success looks like, and easy for the right person to say yes to.',
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
    searchTerm: 'chatgpt prompt for performance review',
    metaTitle: 'ChatGPT Prompt for Performance Reviews (Free)',
    metaDescription:
      'A free ChatGPT prompt that helps you write a fair, specific performance review with real examples and constructive feedback.',
    heading: 'ChatGPT prompt for writing a performance review',
    intro:
      'Performance reviews go wrong when they are vague ("great team player") or harsh without a path forward. This prompt helps ChatGPT turn your rough notes into specific, fair feedback the person can act on.',
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
    searchTerm: 'chatgpt prompt for resignation letter',
    metaTitle: 'ChatGPT Prompt for a Resignation Letter (Free)',
    metaDescription:
      'A free ChatGPT prompt that writes a professional, graceful resignation letter that keeps the relationship intact. Copy, paste, fill in the blanks.',
    heading: 'ChatGPT prompt for writing a resignation letter',
    intro:
      'A resignation letter has one job: leave on good terms. This prompt makes ChatGPT write one that is short, professional, and warm, without burning a bridge you may need later.',
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
    searchTerm: 'chatgpt prompt to explain code',
    metaTitle: 'ChatGPT Prompt to Explain Code (Free, Copy-Paste)',
    metaDescription:
      'A free ChatGPT prompt that explains any piece of code in plain language: what it does, how it works, line by line if you need it.',
    heading: 'ChatGPT prompt to explain code',
    intro:
      'Pasting code and asking "what does this do?" often gets you a vague overview. This prompt makes ChatGPT explain it clearly, at the level of detail you choose, so you actually understand it.',
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
    searchTerm: 'chatgpt prompt to fix an error',
    metaTitle: 'ChatGPT Prompt to Debug & Fix Code Errors (Free)',
    metaDescription:
      'A free ChatGPT prompt that helps you debug an error: explains the cause in plain language and shows the smallest fix that works.',
    heading: 'ChatGPT prompt to debug and fix a code error',
    intro:
      'Pasting just an error message gets you a guess. This prompt gives ChatGPT what it actually needs to debug well: the error, the code, and what you expected, so you get a real diagnosis and a clean fix.',
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
    searchTerm: 'chatgpt prompt to write unit tests',
    metaTitle: 'ChatGPT Prompt to Write Unit Tests (Free, Copy-Paste)',
    metaDescription:
      'A free ChatGPT prompt that writes unit tests for your code, covering the normal case, edge cases, and failure cases.',
    heading: 'ChatGPT prompt to write unit tests',
    intro:
      'Ask ChatGPT for tests and you often get one test for the happy path. This prompt makes it cover what actually matters: edge cases, invalid input, and the failures that break things in production.',
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
    searchTerm: 'chatgpt prompt for regex',
    metaTitle: 'ChatGPT Prompt to Write Regex (Free, Copy-Paste)',
    metaDescription:
      'A free ChatGPT prompt that writes a regular expression for you and explains it clearly, with examples of what it matches and what it does not.',
    heading: 'ChatGPT prompt to write a regular expression',
    intro:
      'Regex is easy to get slightly wrong and hard to read. This prompt makes ChatGPT write the pattern, explain every part, and show you exactly what it matches, so you can trust it.',
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
    searchTerm: 'chatgpt prompt to explain something simply',
    metaTitle: 'ChatGPT Prompt to Explain Anything Simply (Free)',
    metaDescription:
      'A free ChatGPT prompt that explains any concept in plain, simple terms, with an analogy and a check that you understood it.',
    heading: 'ChatGPT prompt to explain a concept simply',
    intro:
      'Ask ChatGPT to explain something and it often answers with the same jargon that confused you. This prompt makes it explain in plain words, use an analogy, and check that it actually landed.',
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
    searchTerm: 'chatgpt prompt for a study plan',
    metaTitle: 'ChatGPT Prompt to Make a Study Plan (Free)',
    metaDescription:
      'A free ChatGPT prompt that builds a realistic study plan for any subject, based on your goal, deadline, and the time you actually have.',
    heading: 'ChatGPT prompt to make a study plan',
    intro:
      'A vague "help me study" gives you a generic list. This prompt makes ChatGPT build a realistic plan around your real goal, deadline, and the hours you actually have each week.',
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
    searchTerm: 'chatgpt prompt to practice a language',
    metaTitle: 'ChatGPT Prompt to Practice a Language (Free)',
    metaDescription:
      'A free ChatGPT prompt that turns ChatGPT into a language practice partner, with conversation at your level and gentle correction.',
    heading: 'ChatGPT prompt to practice a new language',
    intro:
      'ChatGPT is a patient language partner if you set it up right. This prompt makes it hold a real conversation at your level and correct your mistakes without breaking the flow.',
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
    searchTerm: 'chatgpt prompt for a business plan',
    metaTitle: 'ChatGPT Prompt for a Business Plan (Free, Copy-Paste)',
    metaDescription:
      'A free ChatGPT prompt that drafts a clear, practical one-page business plan from your idea, target customer, and how you will make money.',
    heading: 'ChatGPT prompt for writing a business plan',
    intro:
      'A 30-page business plan helps no one in the early days. This prompt makes ChatGPT draft a sharp one-page plan that forces you to be clear about the customer, the problem, and how the money works.',
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
    searchTerm: 'chatgpt prompt for marketing copy',
    metaTitle: 'ChatGPT Prompt for Marketing Copy (Free, Copy-Paste)',
    metaDescription:
      'A free ChatGPT prompt that writes marketing copy that focuses on the customer, leads with the benefit, and has one clear call to action.',
    heading: 'ChatGPT prompt for writing marketing copy',
    intro:
      'Most AI marketing copy is hype with no substance. This prompt makes ChatGPT write copy that speaks to a real customer, leads with what they get, and asks them to do one clear thing.',
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
    searchTerm: 'chatgpt prompt for a SWOT analysis',
    metaTitle: 'ChatGPT Prompt for a SWOT Analysis (Free)',
    metaDescription:
      'A free ChatGPT prompt that runs a clear, honest SWOT analysis for your business, project, or career, with practical takeaways.',
    heading: 'ChatGPT prompt for a SWOT analysis',
    intro:
      'A SWOT analysis is only useful if it is honest and specific. This prompt makes ChatGPT produce one with real, concrete points and, more importantly, what to actually do about them.',
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
]

export function getPromptEntry(slug: string): PromptEntry | undefined {
  return PROMPT_LIBRARY.find(e => e.slug === slug)
}

export function getAllPromptSlugs(): string[] {
  return PROMPT_LIBRARY.map(e => e.slug)
}
