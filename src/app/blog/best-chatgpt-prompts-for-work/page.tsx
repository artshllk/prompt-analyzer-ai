import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Best ChatGPT Prompts for Work (2026) — Copy and Use Today',
  description: 'The best ChatGPT prompts for real work tasks: emails, reports, analysis, meeting notes, job descriptions, performance reviews, and more. All free to copy.',
  alternates: { canonical: 'https://deepclario.com/blog/best-chatgpt-prompts-for-work' },
  openGraph: {
    title: 'Best ChatGPT Prompts for Work (2026)',
    description: 'Free, ready-to-use ChatGPT prompts for the most common work tasks. Copy, fill in the blanks, get results.',
    url: 'https://deepclario.com/blog/best-chatgpt-prompts-for-work',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Best ChatGPT Prompts for Work (2026)',
  description: 'Ready-to-use ChatGPT prompts for emails, reports, analysis, and more work tasks.',
  author: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  publisher: { '@type': 'Organization', name: 'Deepclario', url: 'https://deepclario.com' },
  datePublished: '2026-05-01',
  dateModified: '2026-05-25',
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What are the best ChatGPT prompts for work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The best work prompts are specific about role, task, audience, and format. For emails: include the recipient relationship, the goal, and the tone. For reports: include the data, the audience, and the structure you want. For analysis: specify the framework and what decision the output will inform.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I use ChatGPT to write professional emails?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Give ChatGPT the context a human colleague would need: who the email is going to, what you want them to do, what tone is appropriate, and any relevant background. The more specific you are, the less editing you will need to do afterward.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can ChatGPT help with work reports and analysis?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. ChatGPT is effective at structuring reports, summarizing data, drafting executive summaries, and suggesting frameworks for analysis. The key is pasting in your raw data or notes and specifying the output format and audience.',
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://deepclario.com' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://deepclario.com/blog' },
    { '@type': 'ListItem', position: 3, name: 'Best ChatGPT Prompts for Work', item: 'https://deepclario.com/blog/best-chatgpt-prompts-for-work' },
  ],
}

const PROMPTS = [
  {
    task: 'Write a professional email',
    slug: 'chatgpt-email-writing',
    bad: 'Write an email asking for a deadline extension.',
    good: `You are a professional communicator. Write an email to my manager requesting a deadline extension for [PROJECT NAME].

Context:
- Original deadline: [DATE]
- New deadline I need: [DATE]
- Reason: [BRIEF REASON — be honest but professional]
- What I have completed so far: [STATUS]

Rules:
- Tone: professional but not stiff. This is someone I work with regularly.
- Length: under 150 words.
- Do not over-apologize. State the situation, the request, and the plan.
- End with a clear ask for confirmation.`,
    why: 'The context block gives ChatGPT everything it needs to sound like you, not like a template.',
  },
  {
    task: 'Summarize a meeting into action items',
    slug: 'chatgpt-meeting-notes',
    bad: 'Summarize this meeting.',
    good: `You are a project manager. Turn the following meeting transcript or notes into a structured summary.

MEETING NOTES:
[PASTE YOUR NOTES HERE]

Output format:
1. Meeting purpose (1 sentence)
2. Key decisions made (bullet list)
3. Action items (format: [Owner] — [Task] — [Due date if mentioned])
4. Open questions or blockers (bullet list)

Keep each item concise. If the meeting notes are unclear, note that rather than guessing.`,
    why: 'Defining the exact output format means you get a document you can send, not a wall of prose to reformat.',
  },
  {
    task: 'Write a job description',
    slug: 'chatgpt-job-description',
    bad: 'Write a job description for a marketing manager.',
    good: `You are an experienced HR professional and hiring manager. Write a job description for the role below.

ROLE: [JOB TITLE]
COMPANY TYPE: [e.g. B2B SaaS startup, 50 people]
TEAM: [WHO THEY REPORT TO / WORK WITH]
CORE RESPONSIBILITIES: [LIST 3-5 THINGS THIS PERSON WILL ACTUALLY DO]
MUST-HAVE SKILLS: [LIST 3-4]
NICE-TO-HAVE SKILLS: [LIST 2-3]
SALARY RANGE: [IF PUBLIC]

Format:
- Opening paragraph: what the role is and why it matters to the company
- Responsibilities: bullet list, action verbs, specific not generic
- Requirements: must-haves and nice-to-haves separate
- Short company blurb at the end

Tone: direct and honest. Avoid corporate filler like "fast-paced environment" and "wear many hats".`,
    why: 'Separating must-haves from nice-to-haves forces precision and produces a JD that attracts the right candidates.',
  },
  {
    task: 'Write a performance review',
    slug: 'chatgpt-performance-review',
    bad: 'Help me write a performance review for my employee.',
    good: `You are an experienced people manager writing a formal performance review.

EMPLOYEE ROLE: [TITLE]
REVIEW PERIOD: [e.g. Q1 2026]
OVERALL PERFORMANCE: [exceeds / meets / below expectations]

ACHIEVEMENTS THIS PERIOD:
[LIST 2-4 SPECIFIC ACCOMPLISHMENTS WITH CONTEXT]

AREAS FOR IMPROVEMENT:
[LIST 1-3 SPECIFIC BEHAVIORS OR GAPS, WITH EXAMPLES]

GOALS FOR NEXT PERIOD:
[LIST 2-3 MEASURABLE OBJECTIVES]

Write a professional performance review using this information. Tone: direct, specific, and constructive — not generic praise or vague criticism. Each point should reference real behavior or output, not personality traits. Length: 3-5 paragraphs.`,
    why: 'Anchoring feedback to specific behavior rather than traits produces reviews that are both fair and legally defensible.',
  },
  {
    task: 'SWOT analysis',
    slug: 'chatgpt-swot-analysis',
    bad: 'Do a SWOT analysis of my business.',
    good: `You are a business strategist. Conduct a SWOT analysis for the following:

BUSINESS/PRODUCT: [DESCRIBE IN 2-3 SENTENCES]
MARKET: [WHO ARE THE CUSTOMERS AND COMPETITORS]
GOAL OF THIS ANALYSIS: [e.g. deciding whether to expand into X market / evaluating a new product line]

Format as a 2x2 table:
| Strengths | Weaknesses |
| Opportunities | Threats |

Under each quadrant, list 3-5 specific, actionable points — not generic observations. After the table, add a 2-sentence strategic recommendation based on the most important intersection.`,
    why: 'Defining the goal of the analysis forces the output to be decision-relevant, not just a generic list.',
  },
]

export default function BestChatGPTPromptsForWorkPage() {
  return (
    <div className="editorial grain min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <header className="border-b border-[color:var(--color-rule)] px-6 md:px-10 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Deepclario" width={28} height={28} priority />
          <span className="text-[15px] tracking-tight font-medium" style={{ color: 'var(--color-paper)' }}>Deepclario</span>
        </Link>
        <Link href="/playground" className="px-4 py-2 rounded-full text-sm btn-paper font-medium transition-all" style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}>
          Improve a prompt free
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <nav className="mb-8 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
          <Link href="/blog" className="underline underline-offset-4" style={{ color: 'var(--color-paper)' }}>Blog</Link>
          <span className="mx-2">/</span>
          <span>Best ChatGPT prompts for work</span>
        </nav>

        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-paper)' }}>Guide</span>
          <span className="text-xs" style={{ color: 'var(--color-paper-mute)' }}>· 7 min read</span>
        </div>

        <h1 className="text-4xl font-bold mb-5 leading-tight" style={{ color: 'var(--color-paper)' }}>
          Best ChatGPT prompts for work
        </h1>

        <p className="text-lg leading-relaxed mb-10" style={{ color: 'var(--color-paper-mute)' }}>
          Most work prompts fail because they give ChatGPT no context to work with. These prompts are different.
          Each one includes the role, task, and format that makes the output usable without heavy editing.
          Copy the prompt, fill in the brackets, and get a first draft that actually sounds professional.
        </p>

        <div className="space-y-14">
          {PROMPTS.map((p, i) => (
            <section key={i}>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-serif text-2xl tabular-nums" style={{ color: 'var(--color-paper-mute)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-paper)' }}>{p.task}</h2>
              </div>

              <div className="mb-3 rounded-xl p-4" style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.15)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,100,100,0.7)' }}>Weak prompt</p>
                <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>{p.bad}</p>
              </div>

              <div className="mb-3 rounded-xl p-4" style={{ background: 'rgba(50,200,100,0.06)', border: '1px solid rgba(50,200,100,0.15)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(50,200,100,0.7)' }}>Strong prompt</p>
                <pre className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-paper)', fontFamily: 'ui-monospace, monospace' }}>{p.good}</pre>
              </div>

              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
                <strong style={{ color: 'var(--color-paper)' }}>Why it works:</strong> {p.why}
              </p>

              <Link
                href={`/prompts/${p.slug}`}
                className="inline-block mt-3 text-sm underline underline-offset-4 hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-paper)' }}
              >
                Get the full copy-ready version →
              </Link>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl p-7" style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}>
          <h2 className="font-serif text-2xl mb-3" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
            Have a work prompt that keeps giving mediocre output?
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-paper-mute)' }}>
            Paste it into Deepclario. It scores your prompt across five dimensions, asks one targeted question, and rewrites it. Free to try.
          </p>
          <Link href="/playground" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] btn-paper transition-all" style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}>
            Improve my prompt free
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-[color:var(--color-rule)]">
          <p className="text-xs mb-3" style={{ color: 'var(--color-paper-mute)' }}>Related reading</p>
          <div className="flex flex-col gap-2">
            <Link href="/blog/how-to-write-better-prompts" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>How to write better AI prompts — 7 proven techniques →</Link>
            <Link href="/blog/chatgpt-prompt-tips" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>10 ChatGPT prompt tips that actually work →</Link>
            <Link href="/prompts/chatgpt-email-writing" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>Free prompt: write any professional email →</Link>
            <Link href="/prompts/chatgpt-meeting-notes" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>Free prompt: turn meeting notes into action items →</Link>
            <Link href="/prompts" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-paper)' }}>Browse all 23 free prompt templates →</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
