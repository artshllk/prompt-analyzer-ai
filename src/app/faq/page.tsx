import type { Metadata } from 'next'
import Link from 'next/link'
import { FAQSection } from '@/components/marketing/FAQSection'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { defaultOGImage } from '@/lib/og-image'

export const metadata: Metadata = {
  title: 'FAQ - Common Questions',
  description:
    'What the source checker does, what it will not say, what it costs, and who sees the text you paste.',
  alternates: { canonical: 'https://deepclario.com/faq' },
  openGraph: {
    title: 'FAQ - Deepclario',
    description:
      'What the source checker does, what it costs, and who sees the text you paste.',
    url: 'https://deepclario.com/faq',
    type: 'website',
    // Pages with their own openGraph object need an explicit image - see
    // defaultOGImage() for why the file-convention fallback doesn't apply.
    images: defaultOGImage('FAQ - Deepclario'),
  },
}

export default function FAQPage() {
  return (
    <div
      className="editorial grain min-h-screen relative"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      <MarketingNav current="faq" />

      <main className="pt-28 md:pt-36 pb-24 md:pb-32 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-6">Questions</p>
          <h1
            className="display text-4xl md:text-[3.75rem] leading-[1.05] tracking-tight mb-10 md:mb-14"
            style={{ color: 'var(--color-paper)' }}
          >
            Questions people ask.
          </h1>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: 'var(--ink-soft)' }}
          >
            Short answers. Ask us anything we missed.
          </p>
          <FAQSection />

          {/* Closing CTA so the page does not dead-end. */}
          <div
            className="mt-20 md:mt-24 pt-12 md:pt-16 text-center"
            style={{ borderTop: '1px solid var(--color-rule)' }}
          >
            <h2
              className="display text-3xl md:text-5xl mb-8"
              style={{ color: 'var(--color-paper)' }}
            >
              Check a document.
            </h2>
            {/* Was /playground, the frozen prompt improver. Ten answers about
                checking sources ended by offering a different product. The
                improver is still reachable from the footer and from the
                prompt-engineering posts, which is where somebody looking for
                it actually is. */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[15px] transition-all hover:gap-3 btn-paper"
              style={{
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                fontWeight: 500,
              }}
            >
              Check your sources
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
      </main>

      <footer
        className="px-6 md:px-10 py-10"
        style={{ borderTop: '1px solid var(--color-rule)' }}
      >
        <div
          className="max-w-3xl mx-auto text-xs flex flex-wrap gap-x-4 gap-y-2"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          <span>© 2026 Deepclario</span>
          <Link
            href="/"
            className="underline underline-offset-4"
            style={{ color: 'var(--color-paper)' }}
          >
            deepclario.com
          </Link>
          <Link
            href="/privacy"
            className="underline underline-offset-4"
            style={{ color: 'var(--color-paper)' }}
          >
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  )
}
