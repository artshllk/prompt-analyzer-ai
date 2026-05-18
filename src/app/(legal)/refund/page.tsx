import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy - Deepclario',
  alternates: { canonical: 'https://deepclario.com/refund' },
}

export default function RefundPage() {
  return (
    <article className="text-[#cdd5ee] space-y-6 leading-relaxed">
      <header>
        <h1 className="text-3xl font-bold text-[#f0f4ff] mb-2">Refund Policy</h1>
        <p className="text-sm text-[#8b9cc8]">Last updated: April 2026</p>
      </header>

      {/* Highlighted guarantee card */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L11 6L16 6.5L12.5 10L13.5 15L9 12.5L4.5 15L5.5 10L2 6.5L7 6L9 1Z" stroke="#34d399" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-[#f0f4ff] mb-1">30-day money-back guarantee</h2>
          <p className="text-sm text-[#8b9cc8]">
            If Deepclario Pro isn&apos;t for you, email us within 30 days of purchase and we&apos;ll
            refund you in full. No forms, no questions.
          </p>
        </div>
      </div>

      <Section title="How to request a refund">
        <p>
          Email{' '}
          <a href="mailto:hello@deepclario.com" className="text-violet-400 hover:text-violet-300 transition-colors">
            hello@deepclario.com
          </a>{' '}
          with the subject line <strong className="text-[#f0f4ff]">&ldquo;Refund Request&rdquo;</strong> and the email address tied to your account.
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
          <Link href="/terms" className="text-violet-400 hover:text-violet-300 transition-colors">
            Terms of Service
          </Link>
          {' '}- for example, abuse, fraud, or automated misuse of the platform.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about this policy:{' '}
          <a href="mailto:hello@deepclario.com" className="text-violet-400 hover:text-violet-300 transition-colors">
            hello@deepclario.com
          </a>
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[#f0f4ff] mt-6 mb-2">{title}</h2>
      <div className="text-sm">{children}</div>
    </section>
  )
}
