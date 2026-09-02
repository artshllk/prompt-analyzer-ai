import type { Metadata } from 'next'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { defaultOGImage } from '@/lib/og-image'

/**
 * The one explainer, and it earns its place by carrying data nobody else has.
 *
 * Generic documentation is not read and not searched for. This page does two
 * jobs instead: it tells someone arriving cold from a shared link what the
 * three answers mean, and it publishes the measurement behind the product.
 * 114 numbers across 11 real articles is original data, and in a category this
 * saturated original data is the only thing that ranks.
 *
 * NO PUBLISHER IS NAMED. The coverage counts are clean and were gathered the
 * same way for every article. The per-publisher flag data is not clean, and
 * only one of them has been contacted, so naming anyone here would publish a
 * number we would not stand behind.
 *
 * Every figure below is from docs/citation-audit/coverage.md and adds up:
 * 34 readable + 20 paywalled + 3 dead + 2 live = 59 linked, plus 55 with no
 * source = 114. The 80 that lead nowhere is 55 + 25.
 */

export const metadata: Metadata = {
  title: 'How we check a link',
  description:
    'We open every link in your article and read the page. Here is what the three answers mean, and what we found in 114 numbers across 11 real articles.',
  alternates: { canonical: 'https://deepclario.com/how-it-works' },
  openGraph: {
    title: 'How we check a link',
    description:
      'What the three answers mean, and what we found in 114 numbers across 11 real articles.',
    url: 'https://deepclario.com/how-it-works',
    type: 'article',
    images: defaultOGImage('How we check a link'),
  },
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="display text-2xl md:text-3xl leading-tight mt-14 mb-4"
      style={{ color: 'var(--ink)' }}
    >
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base md:text-[17px] leading-[1.75] mb-4" style={{ color: 'var(--ink)' }}>
      {children}
    </p>
  )
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="mb-3 pl-4" style={{ borderLeft: '2px solid var(--rule)' }}>
      <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{label}</span>{' '}
      <span style={{ color: 'var(--ink-soft)' }}>{children}</span>
    </li>
  )
}

export default function HowItWorksPage() {
  return (
    <div className="editorial min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      <MarketingNav />

      <main className="pt-28 md:pt-36 pb-24 px-6 md:px-10">
        <article className="max-w-2xl mx-auto">
          <h1
            className="display text-4xl md:text-[3rem] leading-[1.08] tracking-tight"
            style={{ color: 'var(--ink)' }}
          >
            How we check a link
          </h1>
          <p className="mt-5 text-lg md:text-xl leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>
            Paste an article. We open each link and read the page. Then we tell
            you what it says.
          </p>

          <H2>The three answers</H2>
          <P>Every number gets one of three answers.</P>
          <ul className="mb-4">
            <Item label="The page says this.">
              We found your number on the page you linked. We show you the sentence.
            </Item>
            <Item label="The page does not say this.">
              We read the page and your number is not on it. We show you the
              closest thing that is.
            </Item>
            <Item label="We could not check.">
              We could not read the page. We say why.
            </Item>
          </ul>
          <P>
            We never say a number is false. That is a different question and we
            do not answer it.
          </P>

          <H2>A real example</H2>
          <P>A big SEO site wrote this. It is still up today.</P>
          <blockquote
            className="my-5 p-5 rounded-2xl text-[17px] leading-[1.7]"
            style={{ background: 'var(--card)', border: '1px solid var(--rule)', color: 'var(--ink)' }}
          >
            61.5% of{' '}
            <span
              style={{
                background: 'var(--contradicted-bg)',
                color: 'var(--contradicted)',
                borderRadius: '4px',
                padding: '1px 5px',
              }}
            >
              desktop
            </span>{' '}
            searches and 34.4% of{' '}
            <span
              style={{
                background: 'var(--contradicted-bg)',
                color: 'var(--contradicted)',
                borderRadius: '4px',
                padding: '1px 5px',
              }}
            >
              mobile
            </span>{' '}
            searches end without a click.
          </blockquote>
          <P>
            The page they link to says the opposite. 61.5% is mobile. 34.3% is
            desktop.
          </P>
          <P>Same numbers, two words swapped. Nobody caught it for years.</P>
          <P>
            The writer was not careless. They read a real study and typed it up.
            One slip, and the link no longer backs the sentence.
          </P>

          <H2>Why we could not check is a finding</H2>
          <P>
            Often we open a link and cannot read it. That is not a failure. Your
            reader hits the same wall.
          </P>
          <ul className="mb-4">
            <Item label="Behind a paywall.">Your reader needs an account to see it too.</Item>
            <Item label="Dead link.">It is gone. Your reader lands on nothing.</Item>
            <Item label="Live dashboard.">
              The page only shows today. The number moves after you write.
            </Item>
            <Item label="No link at all.">There is nothing for a reader to open.</Item>
          </ul>
          <P>
            Each of these is worth knowing before you publish. The fix is short:
            link the page the number came from.
          </P>

          <H2>Sources drift, and it is nobody&rsquo;s fault</H2>
          <P>
            A page can change after you link it. Reports get moved. Studies get
            replaced by a product page.
          </P>
          <P>
            Your sentence was right the day you wrote it. Today the link does not
            show it.
          </P>
          <P>
            This is the most common problem we find. It is maintenance, not a
            mistake.
          </P>

          <H2>What we found in real articles</H2>
          <P>
            We checked 114 numbers across 11 stats-heavy articles. Here is what
            we found.
          </P>
          <p
            className="my-5 p-5 rounded-2xl text-[19px] leading-[1.5]"
            style={{ background: 'var(--card)', border: '1px solid var(--rule)', color: 'var(--ink)', fontWeight: 500 }}
          >
            48% of the numbers had no source at all.
          </p>
          <P>Of the 59 that did carry a link:</P>
          <ul className="mb-4">
            <Item label="34">pages we could read</Item>
            <Item label="20">were behind a paywall</Item>
            <Item label="3">links were dead</Item>
            <Item label="2">pointed at a live dashboard</Item>
          </ul>
          <P>
            Of all 114 numbers, 80 lead nowhere a reader can follow. That is 55
            with no source, plus 25 whose link cannot be read.
          </P>
          <P>
            We publish this because nobody else has measured it. The numbers are
            ours and you can check them yourself.
          </P>

          <H2>What we do not do</H2>
          <P>We do not save the text you paste. We keep nothing.</P>
          <P>We do not score your article. There is no grade and no percentage.</P>
          <P>
            We do not tell you a number is wrong. We show you what the page says,
            and you decide.
          </P>
        </article>
      </main>
    </div>
  )
}
