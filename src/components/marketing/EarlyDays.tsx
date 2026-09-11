import Link from 'next/link'
import { Mark } from '@/components/marketing/SectionFrame'

/**
 * What happens to the text, and who is asking for it, in one section.
 *
 * Content only; the shell is SectionFrame in (marketing)/page.tsx.
 *
 * THE FOUNDER'S NOTE IS BACK, per the redesign brief, and so is the 7/5
 * split it was parked beside. Every claim on the left must match /privacy
 * word for word or the shorter one becomes the lie.
 *
 * A monogram, not a photograph. A stock face on a page arguing that we do
 * not invent things would be the worst possible place to put one.
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
    <div>
      <p className="eyebrow">You own your data</p>
      <h2
        className="font-serif mt-3 text-[28px] md:text-[40px] leading-[1.1] tracking-[-0.015em]"
        style={{ color: 'var(--ink)' }}
      >
        Your writing <Mark>stays yours.</Mark>
      </h2>

      <div className="grid lg:grid-cols-12 gap-5 mt-10 items-start">
        <div className="lg:col-span-7 flex flex-col gap-4">
          {TRUST_POINTS.map(t => {
            const Icon = t.icon
            return (
              <div
                key={t.title}
                className="rounded-lg p-5 flex items-start gap-4"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-warm)' }}
              >
                <span
                  className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md"
                  style={{ background: 'var(--color-accent-soft)', color: 'var(--brand)' }}
                  aria-hidden="true"
                >
                  <Icon />
                </span>
                <div>
                  <h3 className="text-[15px] leading-snug" style={{ color: 'var(--ink)', fontWeight: 600 }}>
                    {t.title}
                  </h3>
                  <p
                    className="mt-1.5 text-[14px] leading-[1.6]"
                    style={{ color: 'var(--ink-soft)', textWrap: 'pretty' }}
                  >
                    {t.body}
                  </p>
                </div>
              </div>
            )
          })}
          <Link
            href="/privacy"
            className="self-start text-sm underline underline-offset-4"
            style={{ color: 'var(--brand-text)' }}
          >
            Read the full privacy policy
          </Link>
        </div>

        <div
          className="lg:col-span-5 rounded-lg p-7"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-warm)' }}
        >
          <span
            className="inline-flex items-center text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-[3px]"
            style={{ background: 'var(--guess-bg)', color: 'var(--guess)', fontFamily: 'var(--font-mono)' }}
          >
            Early days
          </span>
          <p
            className="font-serif mt-5 text-[22px] md:text-[25px] leading-[1.35] font-normal"
            style={{ color: 'var(--ink)', fontStyle: 'italic', textWrap: 'pretty' }}
          >
            Deepclario is new, so you will not find made-up reviews here.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7]" style={{ color: 'var(--ink-soft)', textWrap: 'pretty' }}>
            The example above is real, and still published. Run your own article and judge it
            yourself. If something looks wrong, email me at{' '}
            <a
              href="mailto:support@deepclario.com"
              className="underline underline-offset-[3px]"
              style={{ color: 'var(--brand-text)' }}
            >
              support@deepclario.com
            </a>
            . I read every one.
          </p>
          <div className="mt-6 pt-5 flex items-center gap-3" style={{ borderTop: '1px solid var(--border-warm)' }}>
            <span
              className="font-serif shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-[18px]"
              style={{ background: 'var(--ink)', color: 'var(--paper)', fontWeight: 500 }}
              aria-hidden="true"
            >
              A
            </span>
            <div>
              <p className="text-[14px]" style={{ color: 'var(--ink)', fontWeight: 600 }}>
                Art Shllaku
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                Founder, Deepclario
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}
