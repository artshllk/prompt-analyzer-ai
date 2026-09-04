import Link from 'next/link'

/**
 * Two things a person weighs before pasting their own writing into a box, in
 * one section because they are the same decision.
 *
 * LEFT: what happens to the text. Three cards, each one a promise that is
 * kept somewhere in code, and every claim here must match /privacy word for
 * word or the shorter one becomes the lie.
 *
 * RIGHT: who is behind it. This used to be a paragraph under an eyebrow, and
 * a paragraph is what the internet is made of. It is the only place on the
 * page where a person is speaking, so it gets a card, a mark and a name.
 *
 * The section it replaces used to be two: "Early days" and "You own your
 * data", stacked, with a rule between them. They were answering the same
 * question from two sides and neither was strong enough alone.
 */

const TRUST_POINTS: { title: string; body: string; icon: () => React.ReactElement }[] = [
  {
    title: 'Never used to train AI',
    body: 'Your text is only used to run the check you asked for. We never use it to train models or sell it.',
    icon: ShieldIcon,
  },
  {
    title: 'Delete everything anytime',
    body: 'Remove your account and all your data from Settings. Everything is gone within 24 hours.',
    icon: TrashIcon,
  },
  {
    title: 'Payments by Paddle',
    body: 'Card details never touch our servers. VAT and sales tax are handled automatically.',
    icon: CardIcon,
  },
]

export function EarlyDays() {
  return (
    <section
      className="px-6 md:px-10 py-20 md:py-28"
      /* surface-subtle. The inset band that gives the page its rhythm: the
         taxonomy above and the pricing below both sit on surface, so this
         one step down is what stops three sections reading as one. */
      style={{ background: 'var(--surface-subtle)' }}
    >
      <div className="max-w-[1180px] mx-auto">
        <div className="max-w-2xl mb-10 md:mb-12">
          <p className="eyebrow mb-4">You own your data</p>
          <h2
            className="display text-3xl md:text-4xl leading-[1.1]"
            style={{ color: 'var(--ink)' }}
          >
            Your writing stays yours.
          </h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-4 md:gap-5 items-start">
          {/* Three cards, one per promise. */}
          <div className="lg:col-span-7 grid sm:grid-cols-3 lg:grid-cols-1 gap-4 md:gap-5">
            {TRUST_POINTS.map(t => {
              const Icon = t.icon
              return (
                <div
                  key={t.title}
                  className="rounded-lg p-5 flex items-start gap-4"
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-warm)',
                  }}
                >
                  <span
                    className="shrink-0 mt-0.5 inline-flex items-center justify-center w-9 h-9 rounded-xl"
                    style={{ background: 'var(--machine-bg)', color: 'var(--machine)' }}
                    aria-hidden="true"
                  >
                    <Icon />
                  </span>
                  <div>
                    <h3
                      className="text-[15px] leading-snug"
                      style={{ color: 'var(--ink)', fontWeight: 600 }}
                    >
                      {t.title}
                    </h3>
                    <p
                      className="mt-1.5 text-[14px] leading-[1.6]"
                      style={{ color: 'var(--ink-soft)' }}
                    >
                      {t.body}
                    </p>
                  </div>
                </div>
              )
            })}
            <div className="sm:col-span-3 lg:col-span-1">
              <Link
                href="/privacy"
                className="inline-block text-sm underline underline-offset-4"
                style={{ color: 'var(--brand-text)' }}
              >
                Read the full privacy policy
              </Link>
            </div>
          </div>

          {/* The founder's note. A card, because it is a person talking. */}
          <div
            className="lg:col-span-5 rounded-lg p-6 md:p-7"
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-warm)',
            }}
          >
            <span
              className="inline-flex items-center text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full"
              style={{
                background: 'var(--guess-bg)',
                color: 'var(--guess)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Early days
            </span>

            <p
              className="font-serif italic mt-5 text-[22px] md:text-[25px] leading-[1.35]"
              style={{ color: 'var(--ink)' }}
            >
              Deepclario is new, so you will not find made-up reviews here.
            </p>

            <p
              className="mt-4 text-[15px] leading-[1.7]"
              style={{ color: 'var(--ink-soft)' }}
            >
              The example above is real, and still published. Run your own article
              and judge it yourself. If something looks wrong, email me at
              support@deepclario.com. I read every one.
            </p>

            <div
              className="mt-6 pt-5 flex items-center gap-3"
              style={{ borderTop: '1px solid var(--border-warm)' }}
            >
              {/*
                A monogram, not a photograph. There is no founder photo in this
                repo, and a stock face on a page arguing that we do not invent
                things would be the worst possible place to put one.
              */}
              <span
                className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-[15px]"
                style={{ background: 'var(--ink)', color: 'var(--paper)', fontWeight: 600 }}
                aria-hidden="true"
              >
                A
              </span>
              <div>
                <p className="text-[14px]" style={{ color: 'var(--ink)', fontWeight: 600 }}>
                  Art Shllaku
                </p>
                <p
                  className="text-[12px]"
                  style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}
                >
                  Founder, Deepclario
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ShieldIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  )
}
