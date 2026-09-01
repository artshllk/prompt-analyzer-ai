import type { Metadata } from 'next'
import { CheckClient } from './check-client'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { WorkedExample, NoLinkNote } from '@/components/factcheck/WorkedExample'

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
  title: 'Check that your links say what you think they say',
  description:
    'Paste your post. We open every link and check that the page really says the number you put next to it.',
  robots: { index: false, follow: false },
}

export default function CheckPage() {
  return (
    <div className="editorial min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      <MarketingNav current="check" />

      <main className="pt-28 md:pt-36 pb-20 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-6">Fact checker</p>
          <h1
            className="display text-4xl md:text-[3.25rem] leading-[1.06] tracking-tight"
            style={{ color: 'var(--ink)' }}
          >
            Does your link <span className="accent">say what you think it says?</span>
          </h1>
          <p className="mt-5 text-base md:text-lg leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>
            Paste your post. We open every link and check that the page really
            says the number you put next to it.
          </p>

          {/* The example comes BEFORE the box. Someone who has never heard of
              this needs to see what it catches before they will paste
              anything into it, and a description of the mechanism does not do
              that job. Static, so it is there on first paint. */}
          <div className="mt-8 md:mt-10">
            <WorkedExample />
          </div>

          <div className="mt-5">
            <NoLinkNote />
          </div>

          <div className="mt-10 md:mt-12">
            <CheckClient />
          </div>

          <p
            className="mt-14 pt-5 text-[13px] leading-relaxed"
            style={{ borderTop: '1px solid var(--rule)', color: 'var(--ink-soft)' }}
          >
            We never say a number is wrong. We say what the page you linked to
            actually says, and show you the words. You decide.
          </p>
        </div>
      </main>
    </div>
  )
}
