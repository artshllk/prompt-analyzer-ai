import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy — Deepclario',
  alternates: { canonical: 'https://deepclario.com/refund' },
}

export default function RefundPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1>Refund Policy</h1>
      <p className="text-[#4a5a80] text-sm">Last updated: April 2026</p>

      <h2>30-Day Money-Back Guarantee</h2>
      <p>
        If you are not satisfied with Deepclario Pro for any reason, contact us within 30 days of
        your initial purchase and we will issue a full refund — no questions asked.
      </p>

      <h2>How to Request a Refund</h2>
      <p>
        Email <a href="mailto:hello@deepclario.com" className="text-violet-400">hello@deepclario.com</a> with
        the subject line "Refund Request" and your account email address. We will process your refund
        within 5 business days.
      </p>

      <h2>Subscription Cancellations</h2>
      <p>
        You may cancel your Pro subscription at any time from your account settings. Cancellation stops
        future charges immediately. You retain Pro access until the end of your current billing period.
        Partial months are not refunded unless requested within the 30-day guarantee window.
      </p>

      <h2>Exceptions</h2>
      <p>
        Refunds are not available for accounts found to be in violation of our{' '}
        <Link href="/terms" className="text-violet-400">Terms of Service</Link> (e.g. abuse, fraud, or
        automated misuse of the platform).
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy:{' '}
        <a href="mailto:hello@deepclario.com" className="text-violet-400">hello@deepclario.com</a>
      </p>
    </article>
  )
}
