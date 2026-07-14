import Link from 'next/link'

/**
 * Honest early-days proof section. Replaces the placeholder testimonials:
 * instead of quotes we cannot attribute, we show one real before/after
 * rewrite and a short founder note. Swap this for real, attributable
 * testimonials once users give them (keep sourceUrl for verification).
 */

const EXAMPLE = {
  before: 'write a cover letter for a marketing job',
  question: 'Which achievement do you most want the hiring manager to remember?',
  answer: 'I grew our newsletter from 2k to 30k subscribers in a year.',
  after:
    'Write a cover letter for a Marketing Manager role at a mid-size SaaS company. Lead with this achievement: I grew our newsletter from 2,000 to 30,000 subscribers in one year. Tie it to the job requirements, keep it under 250 words, use a confident but plain tone, and skip generic openers like "I am writing to apply."',
}

export function EarlyDays() {
  return (
    <section
      className="px-6 md:px-10 py-24 md:py-32"
      style={{ borderTop: '1px solid var(--color-rule)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8 md:gap-16 mb-14 md:mb-20">
          <div className="md:col-span-3">
            <p className="eyebrow">See it work</p>
          </div>
          <div className="md:col-span-9">
            <h2
              className="display text-4xl md:text-5xl"
              style={{ color: 'var(--color-paper)' }}
            >
              The first time it asks you a clarifying question, you stop blaming the model.
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          <div className="card-editorial p-7 md:p-8 flex flex-col gap-5">
            <p className="eyebrow">A prompt as people type it</p>
            <blockquote
              className="text-[17px] leading-[1.55] font-serif italic"
              style={{ color: 'var(--color-paper)' }}
            >
              &ldquo;{EXAMPLE.before}&rdquo;
            </blockquote>
            <div
              className="pt-4 text-sm leading-[1.6]"
              style={{ borderTop: '1px solid var(--color-rule)', color: 'var(--color-paper-mute)' }}
            >
              <p style={{ color: 'var(--color-accent-bright)' }}>
                Deepclario asks: &ldquo;{EXAMPLE.question}&rdquo;
              </p>
              <p className="mt-2">You answer: &ldquo;{EXAMPLE.answer}&rdquo;</p>
            </div>
          </div>

          <div className="card-editorial p-7 md:p-8 flex flex-col gap-5">
            <p className="eyebrow">The rewrite you send instead</p>
            <p
              className="text-[15px] leading-[1.6] flex-1"
              style={{ color: 'var(--color-paper)' }}
            >
              {EXAMPLE.after}
            </p>
          </div>
        </div>

        <div className="card-editorial p-7 md:p-8 mt-5 md:mt-6">
          <div className="grid md:grid-cols-12 gap-6 md:gap-16 items-center">
            <div className="md:col-span-9">
              <p
                className="text-[15px] leading-[1.7]"
                style={{ color: 'var(--color-paper-mute)' }}
              >
                <span style={{ color: 'var(--color-paper)' }}>
                  Deepclario is new, so you will not find made-up reviews here.
                </span>{' '}
                The example above is a real rewrite. Try it with
                your own prompt and judge the result yourself. If anything feels off,
                reply to any of our emails. I read every one.
              </p>
              <p className="mt-3 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
                Art, founder of Deepclario
              </p>
            </div>
            <div className="md:col-span-3">
              <Link
                href="/extension"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] transition-all btn-paper"
                style={{
                  background: 'var(--color-paper)',
                  color: 'var(--color-ink)',
                  fontWeight: 500,
                }}
              >
                Try it yourself
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 7H12M12 7L7 2M12 7L7 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
