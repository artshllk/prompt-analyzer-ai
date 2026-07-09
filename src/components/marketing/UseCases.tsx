import Link from 'next/link'

/**
 * Six concrete use cases pulled from the prompt library. Each card is a
 * real link to a real prompt page, so the section doubles as conversion
 * proof ("people like me use it for X") and internal SEO routing.
 *
 * Picked one per category so the spread feels representative rather than
 * lopsided toward one audience.
 */

type Case = {
  slug: string
  audience: string
  title: string
  hook: string
}

const CASES: Case[] = [
  {
    slug: 'chatgpt-cover-letter',
    audience: 'Job seekers',
    title: 'Write a cover letter that does not sound generic.',
    hook: 'Tie real achievements to the actual job requirements. No "I am writing to apply" energy.',
  },
  {
    slug: 'chatgpt-email-writing',
    audience: 'Knowledge workers',
    title: 'Send the email you mean to send.',
    hook: 'Right tone, right length, right call to action. First draft is sendable.',
  },
  {
    slug: 'chatgpt-code-review',
    audience: 'Engineers',
    title: 'Get a senior code review, not a polite restatement.',
    hook: 'Security, correctness, performance, style - in that order, with specific fixes.',
  },
  {
    slug: 'chatgpt-marketing-copy',
    audience: 'Marketers',
    title: 'Marketing copy that sounds like a person.',
    hook: 'Five variations on the angle you actually care about, not generic value-prop soup.',
  },
  {
    slug: 'chatgpt-meeting-notes',
    audience: 'Managers',
    title: 'Turn meeting notes into actual action items.',
    hook: 'Owner, task, due date. The summary you wish someone had taken.',
  },
  {
    slug: 'chatgpt-business-plan',
    audience: 'Founders',
    title: 'Pressure-test a business idea before you spend on it.',
    hook: 'A structured outline with the questions an investor will ask first.',
  },
]

export function UseCases() {
  return (
    <section
      id="use-cases"
      className="px-6 md:px-10 py-24 md:py-32 editorial-spotlight"
      style={{ borderTop: '1px solid var(--color-rule)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8 md:gap-16 mb-14 md:mb-20">
          {/* <div className="md:col-span-3">
            <p className="eyebrow">Use cases</p>
          </div> */}
          <div className="md:col-span-9">
            <h2
              className="display text-4xl md:text-6xl"
              style={{ color: 'var(--color-paper)' }}
            >
              What people fix with Deepclario.
            </h2>
            <p
              className="mt-6 text-lg leading-relaxed max-w-2xl"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              Real examples of prompts people improve
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {CASES.map(c => (
            <Link
              key={c.slug}
              href={`/prompts/${c.slug}`}
              className="card-editorial p-7 md:p-8 flex flex-col gap-4 group"
              style={{ color: 'var(--color-paper)' }}
            >
              <span
                className="text-[11px] font-medium tracking-[0.16em] uppercase"
                style={{ color: 'var(--color-accent-bright)' }}
              >
                {c.audience}
              </span>
              <h3
                className="font-serif text-2xl leading-tight"
                style={{ color: 'var(--color-paper)', fontWeight: 400 }}
              >
                {c.title}
              </h3>
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: 'var(--color-paper-mute)' }}
              >
                {c.hook}
              </p>
              <span
                className="mt-2 inline-flex items-center gap-1.5 text-sm transition-all"
                style={{ color: 'var(--color-paper)' }}
              >
                <span className="group-hover:translate-x-0.5 transition-transform">See the prompt</span>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="group-hover:translate-x-1 transition-transform">
                  <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/prompts"
            className="text-sm underline underline-offset-4 transition-opacity hover:opacity-80"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            Browse all 23 use cases →
          </Link>
        </div>
      </div>
    </section>
  )
}
