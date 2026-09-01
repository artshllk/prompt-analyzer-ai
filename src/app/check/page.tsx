import type { Metadata } from 'next'
import { CheckClient } from './check-client'
import { MarketingNav } from '@/components/marketing/MarketingNav'

/**
 * The fact checker, extraction only.
 *
 * NOT IN THE NAV YET, AND NOT INDEXED YET. Both are deliberate. This is a
 * validation surface that finds claims and verifies nothing, so putting it
 * in the nav would promise a product that does not exist, and letting Google
 * index it would spend the domain's credibility on a page that cannot yet
 * keep its own promise. `robots: noindex` comes off the day verification
 * lands, not before.
 */

export const metadata: Metadata = {
  title: 'Find the checkable claims in your document',
  description:
    'Paste a document and see every claim in it a reader could look up and challenge you on.',
  robots: { index: false, follow: false },
}

export default function CheckPage() {
  return (
    <div className="editorial min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      <MarketingNav />

      <main className="pt-28 md:pt-36 pb-20 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-6">Fact checker</p>
          <h1
            className="display text-4xl md:text-[3.25rem] leading-[1.06] tracking-tight"
            style={{ color: 'var(--ink)' }}
          >
            Check your sources <span className="accent">before someone else does.</span>
          </h1>
          <p className="mt-5 text-base md:text-lg leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>
            Paste a stats-heavy post. We find every number, citation, quote and
            ranking a reader could look up, and tell you how many of them your
            document actually links. Right now we find them. Checking whether
            each link shows what you say it shows comes next.
          </p>

          <div className="mt-10 md:mt-12">
            <CheckClient />
          </div>

          <p
            className="mt-14 pt-5 text-xs leading-relaxed"
            style={{ borderTop: '1px solid var(--rule)', color: 'var(--ink-soft)' }}
          >
            Nothing on this page is a verdict. Every claim is marked not
            checked, which is the honest state for a document nobody has
            checked against a source. A claim being listed is not a suggestion
            it is wrong.
          </p>
        </div>
      </main>
    </div>
  )
}
