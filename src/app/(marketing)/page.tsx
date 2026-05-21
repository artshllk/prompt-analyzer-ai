import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CinematicHero } from '@/components/marketing/CinematicHero'
import { EditorialPricing } from '@/components/marketing/EditorialPricing'
import { LivePromptDemo } from '@/components/marketing/LivePromptDemo'

export const metadata: Metadata = {
  title: 'Deepclario - Prompt analyzer for ChatGPT, Claude, and Gemini',
  description: 'Most AI failures are prompt failures. Deepclario scores your prompt across five dimensions, asks the questions a senior engineer would ask, and rewrites it until the model has no excuse to misunderstand you.',
  alternates: { canonical: 'https://deepclario.com' },
  openGraph: {
    title: 'Deepclario - Prompt analyzer for ChatGPT, Claude, and Gemini',
    description: 'Score your prompt, answer what is missing, get a rewrite that actually works.',
    url: 'https://deepclario.com',
    type: 'website',
    images: [{ url: 'https://deepclario.com/logo.png', width: 512, height: 512, alt: 'Deepclario' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deepclario - Prompt analyzer for ChatGPT, Claude, and Gemini',
    description: 'Score your prompt, answer what is missing, get a rewrite that actually works.',
    images: ['https://deepclario.com/logo.png'],
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Deepclario',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Web',
      url: 'https://deepclario.com',
      description: 'Scores your prompts across five dimensions, asks what is missing, and rewrites them for measurably better results from ChatGPT, Claude, and Gemini.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier with 25 analyses per month',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is prompt engineering?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Prompt engineering is the practice of writing inputs for AI models that are specific enough to produce useful outputs. A good prompt names the role, the audience, the format, and the constraints. A bad prompt forces the model to guess.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does Deepclario improve my prompts?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Deepclario scores your prompt across five dimensions, asks up to three targeted clarifying questions when confidence is low, then rewrites your prompt using the CRAFT framework. You see exactly what changed and why.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Deepclario free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The free plan is 25 analyses a month, with full AI improvement and scoring. Pro is $4.99 a month for unlimited use, full history, and weekly insights.',
          },
        },
      ],
    },
  ],
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="editorial grain min-h-screen relative" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
        {/* Nav - minimal, editorial */}
        <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md" style={{ background: 'rgba(14,14,16,0.72)', borderBottom: '1px solid var(--color-rule)' }}>
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Deepclario" width={28} height={28} priority />
              <span className="text-[15px] tracking-tight" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>Deepclario</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
              <Link href="#try" className="hover:opacity-100 transition-opacity opacity-80">Try it</Link>
              <Link href="/extension" className="hover:opacity-100 transition-opacity opacity-80">Extension</Link>
              <Link href="#pricing" className="hover:opacity-100 transition-opacity opacity-80">Pricing</Link>
              <Link href="/blog/what-is-prompt-engineering" className="hover:opacity-100 transition-opacity opacity-80">Reading</Link>
            </nav>
            <div className="flex items-center gap-5">
              <Link href="/login" className="text-sm hover:opacity-100 transition-opacity opacity-80" style={{ color: 'var(--color-paper)' }}>
                Sign in
              </Link>
              <Link
                href="/playground"
                className="px-4 py-2 rounded-full text-sm transition-all btn-paper"
                style={{
                  background: 'var(--color-paper)',
                  color: 'var(--color-ink)',
                  fontWeight: 500,
                }}
              >
                Try free
              </Link>
            </div>
          </div>
        </header>

        {/* Hero - copy + live demo, above the fold. Demo is pre-populated
            so the first action available is one click on Analyze. */}
        <section id="try" className="pt-28 md:pt-36 pb-20 md:pb-24 px-6 md:px-10 relative">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mb-12 md:mb-16">
              <p className="eyebrow mb-6">Prompt analyzer · ChatGPT · Claude · Gemini</p>
              <h1
                className="display text-5xl md:text-[5.5rem] leading-tight tracking-tight"
                style={{ color: 'var(--color-paper)' }}
              >
                Most AI failures{' '}
                <span style={{ color: 'var(--color-accent)' }}>are prompt failures.</span>
              </h1>
              <p
                className="mt-6 md:mt-8 text-lg md:text-xl leading-relaxed max-w-2xl"
                style={{ color: 'var(--color-paper-mute)' }}
              >
                Paste your prompt below. We score it, ask what is missing, and rewrite it so the model has no excuse to misunderstand you.
              </p>
            </div>
            <LivePromptDemo compact />
          </div>
        </section>

        {/* Cinematic - visual story of how the rewrite works, now below the demo */}
        <section style={{ borderTop: '1px solid var(--color-rule)' }}>
          <CinematicHero />
        </section>

        {/* The thesis - long-form editorial paragraph */}
        <section id="why" className="px-6 md:px-10 py-24 md:py-32" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-3">
              <p className="eyebrow">The thesis</p>
            </div>
            <div className="md:col-span-9 space-y-6">
              <p
                className="font-serif text-3xl md:text-[2.4rem] leading-tight tracking-tight"
                style={{ color: 'var(--color-paper)', fontWeight: 400 }}
              >
                A senior engineer never accepts vague requirements. They ask questions until the work is clear.
              </p>
              <p className="text-lg leading-[1.7]" style={{ color: 'var(--color-paper)' }}>
                Most people give AI prompts that are too vague. We write a quick sentence, the AI guesses what we mean, and we get frustrated when the result isn't right.
              </p>
              <p className="text-lg leading-[1.7]" style={{ color: 'var(--color-paper-mute)' }}>
                Deepclario reviews your prompt like a senior engineer reviews requirements. It identifies what's missing, asks the right questions, and rewrites it for better results. You get a stronger prompt-and learn to write better ones over time.
              </p>
            </div>
          </div>
        </section>

        {/* The five dimensions - editorial number list */}
        <section className="px-6 md:px-10 py-24 md:py-32" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-12 gap-8 md:gap-16 mb-16 md:mb-24">
              <div className="md:col-span-3">
                <p className="eyebrow">How we read a prompt</p>
              </div>
              <div className="md:col-span-9">
                <h2
                  className="display text-4xl md:text-6xl"
                  style={{ color: 'var(--color-paper)' }}
                >
                  Five dimensions.<br/>
                  <span style={{ color: 'var(--color-paper-mute)' }}>One score.</span>
                </h2>
              </div>
            </div>

            <div className="space-y-px">
              {DIMENSIONS.map((d, i) => (
                <Dimension key={d.title} index={i} {...d} />
              ))}
              <div className="rule-strong" />
            </div>
          </div>
        </section>

        {/* Why not just ask ChatGPT */}
        <section className="px-6 md:px-10 py-24 md:py-32" style={{ borderTop: '1px solid var(--color-rule)', background: 'var(--color-ink-soft)' }}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-5">
              <p className="eyebrow mb-6">A fair question</p>
              <h2
                className="display text-3xl md:text-5xl"
                style={{ color: 'var(--color-paper)' }}
              >
                &ldquo;Can&rsquo;t I just ask<br/>
                ChatGPT to do this?&rdquo;
              </h2>
            </div>
            <div className="md:col-span-7 space-y-6">
              <p className="text-lg leading-[1.7]" style={{ color: 'var(--color-paper)' }}>
                Yes, you can ask ChatGPT to rewrite your prompt. It will give you a new version, but it won't explain what's wrong with your original or how to improve it.
              </p>
              <p className="text-lg leading-[1.7]" style={{ color: 'var(--color-paper-mute)' }}>
                Deepclario analyzes your prompt across five dimensions, scores it, and shows you exactly what to fix. It tracks your progress so you get better over time.
              </p>
              <p className="text-lg leading-[1.7]" style={{ color: 'var(--color-paper-mute)' }}>
                Use ChatGPT for quick changes. Use Deepclario to learn and improve.
              </p>
            </div>
          </div>
        </section>

        {/* Browser extension CTA - visitors who liked the demo are the
            perfect extension audience. */}
        <section className="px-6 md:px-10 py-24 md:py-32" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-3">
              <p className="eyebrow">Use it everywhere</p>
            </div>
            <div className="md:col-span-9">
              <h2
                className="font-serif text-3xl md:text-5xl leading-tight tracking-tight mb-6"
                style={{ color: 'var(--color-paper)', fontWeight: 400 }}
              >
                Sharpen prompts inside ChatGPT, Claude, and Gemini.
              </h2>
              <p className="text-base md:text-lg leading-[1.6] max-w-xl mb-8" style={{ color: 'var(--color-paper-mute)' }}>
                The browser extension adds a Sharpen button right in the chat
                box - same engine, no tab switching. Free, no account.
              </p>
              <Link
                href="/extension"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] transition-all btn-paper"
                style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
              >
                Get the browser extension
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Manifesto / closing */}
        <section className="px-6 md:px-10 py-32 md:py-40" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="max-w-4xl mx-auto text-center">
            <p className="eyebrow mb-10">Principles</p>
            <p
              className="font-serif text-3xl md:text-[2.8rem] leading-tight tracking-tight"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              We don&rsquo;t want you to spend more time with AI. We want you to spend it better.
            </p>
            <p className="mt-12 text-base md:text-lg max-w-xl mx-auto leading-[1.7]" style={{ color: 'var(--color-paper-mute)' }}>
              Deepclario is for professionals who work with AI every day-engineers, writers, founders, researchers. For anyone who sees better prompting as a valuable skill for the future.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-6 md:px-10 py-24 md:py-32" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="max-w-6xl mx-auto">
            <EditorialPricing />
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 md:px-10 py-32 md:py-40 text-center" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <p className="eyebrow mb-8">Try it</p>
          <h2
            className="display text-5xl md:text-7xl mb-10"
            style={{ color: 'var(--color-paper)' }}
          >
            Bring your worst prompt.
          </h2>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-[15px] transition-all hover:gap-3 btn-paper"
            style={{
              background: 'var(--color-paper)',
              color: 'var(--color-ink)',
              fontWeight: 500,
            }}
          >
            Open the playground
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <p className="mt-6 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
            Free. No card. Twenty-five prompts a month, forever.
          </p>
        </section>

        {/* Footer */}
        <footer className="px-6 md:px-10 py-16" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-5">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo.png" alt="Deepclario" width={24} height={24} />
                <span className="text-sm" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>Deepclario</span>
              </div>
              <p className="text-sm leading-[1.7] max-w-sm" style={{ color: 'var(--color-paper-mute)' }}>
                A prompt analyzer for ChatGPT, Claude, and Gemini.
              </p>
            </div>
            <FooterCol title="Product" links={[
              { href: '/playground', label: 'Playground' },
              { href: '/extension', label: 'Browser extension' },
              { href: '/tools/prompt-improver', label: 'Prompt Improver' },
              { href: '/tools/prompt-analyzer', label: 'Prompt Analyzer' },
              { href: '#pricing', label: 'Pricing' },
            ]} />
            <FooterCol title="Reading" links={[
              { href: '/blog/what-is-prompt-engineering', label: 'What is prompt engineering' },
              { href: '/blog/how-to-write-better-prompts', label: 'How to write better prompts' },
              { href: '/blog/what-is-a-good-prompt', label: 'What makes a good prompt' },
              { href: '/blog/prompt-engineering-examples', label: 'Examples' },
            ]} />
            <FooterCol title="Legal" links={[
              { href: '/privacy', label: 'Privacy' },
              { href: '/terms', label: 'Terms' },
              { href: '/refund', label: 'Refund' },
            ]} />
          </div>
          <div className="max-w-6xl mx-auto mt-16 pt-6 text-xs" style={{ borderTop: '1px solid var(--color-rule)', color: 'var(--color-paper-mute)' }}>
            © 2026 Deepclario
          </div>
        </footer>
      </div>
    </>
  )
}

/* ===== Sub-components ===== */

const DIMENSIONS = [
  {
    title: 'Goal clarity',
    description: 'Is it obvious what success looks like? Or could the model produce ten different things, all technically correct, none useful?',
  },
  {
    title: 'Context',
    description: 'Does the model know who is reading, what came before, what constraint matters? Without this, every answer is generic.',
  },
  {
    title: 'Format',
    description: 'Length, structure, sections, tone. Asking for "a summary" is a different request from asking for "three bullet points, each under twelve words."',
  },
  {
    title: 'Constraints',
    description: 'What to avoid. What to include. The negative space of a prompt is often more important than the positive.',
  },
  {
    title: 'Examples',
    description: 'One example of what good looks like beats five adjectives every time. Show, do not describe.',
  },
]

function Dimension({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <>
      <div className="rule-strong" />
      <div className="grid grid-cols-12 gap-4 md:gap-8 py-8 md:py-10 group">
        <div className="col-span-2 md:col-span-1">
          <p className="font-serif text-2xl md:text-3xl tabular-nums" style={{ color: 'var(--color-paper-mute)' }}>
            0{index + 1}
          </p>
        </div>
        <div className="col-span-10 md:col-span-4">
          <h3
            className="font-serif text-2xl md:text-3xl"
            style={{ color: 'var(--color-paper)', fontWeight: 400 }}
          >
            {title}
          </h3>
        </div>
        <div className="col-span-12 md:col-span-7">
          <p className="text-base md:text-lg leading-[1.6]" style={{ color: 'var(--color-paper-mute)' }}>
            {description}
          </p>
        </div>
      </div>
    </>
  )
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="md:col-span-2">
      <p className="eyebrow mb-4">{title}</p>
      <ul className="space-y-2.5">
        {links.map(l => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm transition-opacity hover:opacity-100 opacity-80"
              style={{ color: 'var(--color-paper)' }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
