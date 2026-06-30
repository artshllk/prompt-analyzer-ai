import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { StaticTransform } from '@/components/marketing/StaticTransform'
import { EditorialPricing } from '@/components/marketing/EditorialPricing'
import { LivePromptDemo } from '@/components/marketing/LivePromptDemo'
import { UseCases } from '@/components/marketing/UseCases'
import { Testimonials } from '@/components/marketing/Testimonials'
import { FAQSection } from '@/components/marketing/FAQSection'
import { HeroCenterpiece } from '@/components/marketing/HeroCenterpiece'
import { FeatureShowcase } from '@/components/marketing/FeatureShowcase'

export const metadata: Metadata = {
  title: 'Deepclario - AI that actually understands what you mean',
  description: 'Stop rewriting your prompts. Deepclario fixes what is missing and asks the questions a senior teammate would ask. ChatGPT, Claude, and Gemini stop guessing. You stop editing.',
  alternates: { canonical: 'https://deepclario.com' },
  openGraph: {
    title: 'Deepclario - AI that actually understands what you mean',
    description: 'Type the rough idea. We fix what is missing. ChatGPT, Claude, and Gemini return the answer you wanted, first try.',
    url: 'https://deepclario.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deepclario - AI that actually understands what you mean',
    description: 'Type the rough idea. We fix what is missing. ChatGPT, Claude, and Gemini return the answer you wanted, first try.',
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
      description: 'Type the rough idea. Deepclario fixes what is missing in your prompt and asks the questions a senior teammate would ask, so ChatGPT, Claude, and Gemini return the answer you wanted on the first try.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free plan with 25 prompt rewrites per month',
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
            text: 'You paste a rough prompt. Deepclario spots the gaps a fresh-eyes reviewer would catch, asks one quick question if it has to, and rewrites the prompt so ChatGPT, Claude, or Gemini can return the right output on the first try.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Deepclario free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The free plan gives you 25 prompt rewrites every month. Pro is $9.99 a month and removes the limit, adds full history, persona memory, and weekly insights.',
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
            <nav className="hidden md:flex items-center gap-7 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
              <Link href="#try" className="hover:opacity-100 transition-opacity opacity-80">Try it</Link>
              <Link href="#use-cases" className="hover:opacity-100 transition-opacity opacity-80">Use cases</Link>
              <Link href="/prompts" className="hover:opacity-100 transition-opacity opacity-80">Prompts</Link>
              <Link href="/extension" className="hover:opacity-100 transition-opacity opacity-80">Extension</Link>
              <Link href="/pricing" className="hover:opacity-100 transition-opacity opacity-80">Pricing</Link>
              <Link href="#faq" className="hover:opacity-100 transition-opacity opacity-80">FAQ</Link>
              <Link href="/blog" className="hover:opacity-100 transition-opacity opacity-80">Blog</Link>
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

        {/* Hero - two-column on desktop: copy left, animated centerpiece
            right. Centerpiece is hidden under lg so mobile gets the
            text-only treatment. LivePromptDemo lives in its own
            section directly below so the page reads "promise -> proof". */}
        <section id="try" className="pt-28 md:pt-36 pb-16 md:pb-20 px-6 md:px-10 relative">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-7">
                <p className="eyebrow mb-6">Stop rewriting your prompts</p>
                <h1
                  className="display text-5xl md:text-[5.25rem] leading-[1.04] tracking-tight"
                  style={{ color: 'var(--color-paper)' }}
                >
                  AI that actually{' '}
                  <span style={{ color: 'var(--color-accent)' }}>understands what you mean.</span>
                </h1>
                <p
                  className="mt-6 md:mt-8 text-lg md:text-xl leading-relaxed max-w-2xl"
                  style={{ color: 'var(--color-paper-mute)' }}
                >
                  You type the rough idea. Deepclario fixes what is missing and asks the questions a senior teammate would ask. ChatGPT, Claude, and Gemini stop guessing. You stop editing.
                </p>
              </div>
              <div className="hidden lg:flex lg:col-span-5 items-center justify-center">
                <HeroCenterpiece />
              </div>
            </div>
          </div>
        </section>

        {/* Live demo - proof, immediately below the hero. */}
        <section className="pb-20 md:pb-24 px-6 md:px-10" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="max-w-6xl mx-auto pt-16 md:pt-20">
            <LivePromptDemo compact />
          </div>
        </section>

        {/* Three-stage transform: the same example the old scroll-pinned
            cinematic used, but laid out as three calm cards. No
            scroll-jacking, identical on mobile and desktop. */}
        <StaticTransform />

        {/* Tabbed feature showcase: four facets of the engine, each
            with a custom mini-demo. The "what does this thing actually
            do" section without resorting to a wall of feature cards. */}
        <FeatureShowcase />

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
                The model is fine. The brief was vague.
              </p>
              <p className="text-lg leading-[1.7]" style={{ color: 'var(--color-paper)' }}>
                Most &ldquo;ChatGPT gave me a bad answer&rdquo; moments are actually &ldquo;I sent a bad prompt&rdquo; moments. One-line briefs, no audience, no format, no constraints. The AI guesses. You edit. You retry.
              </p>
              <p className="text-lg leading-[1.7]" style={{ color: 'var(--color-paper-mute)' }}>
                Deepclario catches the vague brief before it costs you a generation. It reviews your prompt the way a senior teammate would, asks one quick question if it has to, and hands ChatGPT, Claude, or Gemini something they can act on. You get the output you wanted, first try.
              </p>
            </div>
          </div>
        </section>

        {/* Outcome-first three-tile value prop. Replaces the old
            "five dimensions" mechanism section. Each tile is a step
            in the user's actual experience, not a feature of our model. */}
        <section className="px-6 md:px-10 py-24 md:py-32" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-12 gap-8 md:gap-16 mb-16 md:mb-24">
              <div className="md:col-span-3">
                <p className="eyebrow">How it feels to use</p>
              </div>
              <div className="md:col-span-9">
                <h2
                  className="display text-4xl md:text-6xl"
                  style={{ color: 'var(--color-paper)' }}
                >
                  Three steps.<br/>
                  <span style={{ color: 'var(--color-paper-mute)' }}>None of them is hard.</span>
                </h2>
              </div>
            </div>

            <div className="space-y-px">
              <div className="rule-strong" />
              {STEPS.map((s, i) => (
                <Step key={s.title} index={i} {...s} />
              ))}
              <div className="rule-strong" />
            </div>
          </div>
        </section>

        {/* Use cases - 6 concrete scenarios linked to real prompt pages.
            Translates "what is this" into "what does it do for me." */}
        <UseCases />

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
                You can. But you have to know your prompt was the problem in the first place. ChatGPT will not tell you. It will just produce something generic and let you guess what went wrong.
              </p>
              <p className="text-lg leading-[1.7]" style={{ color: 'var(--color-paper-mute)' }}>
                Deepclario catches the gap before you send. It asks one quick question if it has to, then hands you the fixed prompt or runs it for you. No rewrite spiral, no second guessing, no five-prompt session to land on the answer you wanted in the first place.
              </p>
              <p className="text-lg leading-[1.7]" style={{ color: 'var(--color-paper-mute)' }}>
                One layer between you and every AI model. Same model. Better output. Less of your time.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials - placeholder quotes until real ones are collected.
            See src/components/marketing/Testimonials.tsx for swap instructions. */}
        <Testimonials />

        {/* Browser extension - the primary surface going forward.
            Position this as the main product, not the demo. */}
        <section className="px-6 md:px-10 py-24 md:py-32" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-3">
              <p className="eyebrow">Works where you already work</p>
            </div>
            <div className="md:col-span-9">
              <h2
                className="font-serif text-3xl md:text-5xl leading-tight tracking-tight mb-6"
                style={{ color: 'var(--color-paper)', fontWeight: 400 }}
              >
                One click inside ChatGPT, Claude, and Gemini.
              </h2>
              <p className="text-base md:text-lg leading-[1.6] max-w-xl mb-4" style={{ color: 'var(--color-paper-mute)' }}>
                Install the extension and an Improve button shows up in the chat box. Click it. Your prompt gets rewritten in place.
              </p>
              <p className="text-base md:text-lg leading-[1.6] max-w-xl mb-8" style={{ color: 'var(--color-paper-mute)' }}>
                No copy-paste. No new tab. No panel to dig into. Just better output, with one keystroke.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/extension"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] transition-all btn-paper"
                  style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
                >
                  Install the extension
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <span className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
                  Chrome and Brave. Free, no account.
                </span>
              </div>
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

        {/* FAQ - last-objection handler before the final CTA. */}
        <section id="faq" className="px-6 md:px-10 py-24 md:py-32" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="max-w-3xl mx-auto">
            <p className="eyebrow mb-6">Questions</p>
            <h2
              className="display text-4xl md:text-5xl mb-12"
              style={{ color: 'var(--color-paper)' }}
            >
              Asked and answered.
            </h2>
            <FAQSection />
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
                One layer between you and ChatGPT, Claude, and Gemini, so the model finally understands what you mean.
              </p>
            </div>
            <FooterCol title="Product" links={[
              { href: '/playground', label: 'Playground' },
              { href: '/prompts', label: 'Prompt library' },
              { href: '/extension', label: 'Browser extension' },
              { href: '/tools/prompt-improver', label: 'Prompt Improver' },
              { href: '/tools/prompt-analyzer', label: 'Prompt Analyzer' },
              { href: '/pricing', label: 'Pricing' },
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

const STEPS = [
  {
    title: 'Type what you mean',
    description: 'Rough notes, half-formed thoughts, one-line briefs. Same as you would send a colleague before a meeting. No prompt-engineering degree required.',
  },
  {
    title: 'We fix what is missing',
    description: 'Deepclario spots the gaps a fresh-eyes reviewer would catch and asks one quick question if it has to. Then it rewrites the prompt for clarity, in the background.',
  },
  {
    title: 'You get the answer you wanted',
    description: 'The output comes back tight, on-format, and on-voice. First try. ChatGPT, Claude, or Gemini, your pick. No copy-paste loop, no five-prompt rewrite spiral.',
  },
]

function Step({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <>
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
      <div className="rule" />
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
