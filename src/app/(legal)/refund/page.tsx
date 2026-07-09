import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description:
    'Deepclario Pro comes with a 30-day money-back guarantee. Here is how refunds and cancellations work.',
  alternates: { canonical: 'https://deepclario.com/refund' },
}

export default function RefundPage() {
  return (
    <article className="space-y-6 leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
      <header>
        <p className="eyebrow mb-3">Legal</p>
        <h1 className="display text-3xl md:text-4xl tracking-tight mb-2" style={{ color: 'var(--color-paper)' }}>
          Refund Policy
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>Last updated: April 2026</p>
      </header>

      {/* Highlighted guarantee card */}
      <div
        className="rounded-2xl p-5 flex items-start gap-4"
        style={{ border: '1px solid rgba(74, 176, 118, 0.28)', background: 'rgba(74, 176, 118, 0.06)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(74, 176, 118, 0.15)', border: '1px solid rgba(74, 176, 118, 0.28)' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L11 6L16 6.5L12.5 10L13.5 15L9 12.5L4.5 15L5.5 10L2 6.5L7 6L9 1Z" stroke="#5FBE8C" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--color-paper)' }}>30-day money-back guarantee</h2>
          <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
            If Deepclario Pro isn&apos;t for you, email us within 30 days of purchase and we&apos;ll
            refund you in full. No forms, no questions.
          </p>
        </div>
      </div>

      <Section title="How to request a refund">
        <p>
          Email{' '}
          <MailLink />{' '}
          with the subject line <Strong>&ldquo;Refund Request&rdquo;</Strong> and the email address tied to your account.
        </p>
        <p className="mt-3">We&apos;ll process the refund within 5 business days.</p>
      </Section>

      <Section title="Subscription cancellations">
        <p>
          You can cancel your Pro subscription at any time from your account settings. Cancellation stops
          future charges immediately, and you keep Pro access until the end of your current billing period.
        </p>
        <p className="mt-3">
          Partial months are not refunded outside of the 30-day guarantee window.
        </p>
      </Section>

      <Section title="Exceptions">
        <p>
          Refunds are not available for accounts found to be in violation of our{' '}
          <Link
            href="/terms"
            className="underline underline-offset-4 transition-opacity hover:opacity-80"
            style={{ color: 'var(--color-paper)' }}
          >
            Terms of Service
          </Link>
          {' '}- for example, abuse, fraud, or automated misuse of the platform.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about this policy:{' '}
          <MailLink />
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mt-6 mb-2" style={{ color: 'var(--color-paper)' }}>{title}</h2>
      <div className="text-sm">{children}</div>
    </section>
  )
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: 'var(--color-paper)' }}>{children}</strong>
}

function MailLink() {
  return (
    <a
      href="mailto:contact@deepclario.com"
      className="underline underline-offset-4 transition-opacity hover:opacity-80"
      style={{ color: 'var(--color-paper)' }}
    >
      contact@deepclario.com
    </a>
  )
}
