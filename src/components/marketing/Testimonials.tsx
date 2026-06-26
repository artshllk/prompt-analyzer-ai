/**
 * Testimonials section.
 *
 * IMPORTANT (founder note): the quotes below are PLACEHOLDERS modeled on
 * real reactions Deepclario has received on Reddit and X. They are
 * directionally true but NOT verbatim attributable quotes. Before any
 * real launch / Product Hunt push:
 *
 *   1. Replace each quote with a verbatim, attributable testimonial
 *      collected from a paying or active user.
 *   2. Keep `name`, `role`, and optionally a real social handle for
 *      proof. Real names beat fake initials every time.
 *   3. If a quote is from a public post (X / Reddit), include the
 *      `sourceUrl` so visitors can verify it.
 *
 * Until verbatim quotes exist, this component renders but is gated by
 * the marketing page below the testimonials threshold.
 */

type Quote = {
  body: string
  name: string
  role: string
  sourceUrl?: string
}

const QUOTES: Quote[] = [
  {
    body: 'The biggest change for me was just noticing how much context I was leaving out without realizing. Same model, completely different output.',
    name: 'Mira Lindqvist',
    role: 'Product designer · paying user',
  },
  {
    body: 'I used to blame the model. Turns out 90% of my bad answers were my fault. This catches it before I hit send.',
    name: 'Devansh Khatri',
    role: 'Software engineer · Chrome extension user',
  },
  {
    body: 'I write a lot of cold emails. The clarifying question it asked me actually made the email better than what I was about to send.',
    name: 'Mateus Ribeiro',
    role: 'Founder · paying user',
  },
]

export function Testimonials() {
  return (
    <section
      className="px-6 md:px-10 py-24 md:py-32"
      style={{ borderTop: '1px solid var(--color-rule)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8 md:gap-16 mb-14 md:mb-20">
          <div className="md:col-span-3">
            <p className="eyebrow">What people say</p>
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

        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {QUOTES.map((q, i) => (
            <figure
              key={i}
              className="card-editorial p-7 md:p-8 flex flex-col gap-6 h-full"
            >
              <Quote />
              <blockquote
                className="text-[17px] leading-[1.55] flex-1"
                style={{ color: 'var(--color-paper)' }}
              >
                {q.body}
              </blockquote>
              <figcaption className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--color-rule)' }}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent-bright)' }}
                >
                  {initials(q.name)}
                </div>
                <div className="text-sm leading-tight">
                  <div style={{ color: 'var(--color-paper)' }}>{q.name}</div>
                  <div style={{ color: 'var(--color-paper-mute)' }}>{q.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '-'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function Quote() {
  return (
    <svg
      width="22"
      height="18"
      viewBox="0 0 22 18"
      fill="none"
      aria-hidden="true"
      style={{ color: 'var(--color-accent)' }}
    >
      <path
        d="M8.5 0H1.5L0 6V18H9V6H3.5L4.5 0H8.5ZM21.5 0H14.5L13 6V18H22V6H16.5L17.5 0H21.5Z"
        fill="currentColor"
        fillOpacity="0.6"
      />
    </svg>
  )
}
