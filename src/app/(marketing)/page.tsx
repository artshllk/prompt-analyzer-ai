import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
// { /* CUT - redundant with demo + steps */ }
// import { StaticTransform } from '@/components/marketing/StaticTransform'
import { EditorialPricing } from "@/components/marketing/EditorialPricing";
import { HeroDemoModal } from "@/components/marketing/HeroDemoModal";
import { UseCases } from "@/components/marketing/UseCases";
import { EarlyDays } from "@/components/marketing/EarlyDays";
import { FAQSection } from "@/components/marketing/FAQSection";
import { HeroRefinement } from "@/components/marketing/refinement/HeroRefinement";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Reveal } from "@/components/ui/Reveal";
import { defaultOGImage } from "@/lib/og-image";
// { /* CUT - redundant with demo + steps */ }
// import { FeatureShowcase } from '@/components/marketing/FeatureShowcase'

export const metadata: Metadata = {
  // The layout template appends "| Deepclario", so the brand stays out of
  // this string. Primary keyword ("ai prompt improver") leads the SERP title.
  title: "AI Prompt Improver for ChatGPT, Claude & Gemini",
  description:
    "Paste your prompt. Deepclario spots what is missing, asks one quick question, and rewrites it so ChatGPT, Claude, and Gemini get it right the first time.",
  alternates: { canonical: "https://deepclario.com" },
  openGraph: {
    title: "Deepclario - Turn a rough prompt into a great one",
    description:
      "Paste your prompt. Deepclario spots what is missing, asks one quick question, and rewrites it. Works with ChatGPT, Claude, and Gemini.",
    url: "https://deepclario.com",
    type: "website",
    // This page defines its own openGraph object, which replaces (does not
    // merge with) the root layout's openGraph - including its image. See
    // defaultOGImage() for the full explanation.
    images: defaultOGImage("Deepclario - Turn a rough prompt into a great one"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Deepclario - Turn a rough prompt into a great one",
    description:
      "Paste your prompt. Deepclario spots what is missing, asks one quick question, and rewrites it. Works with ChatGPT, Claude, and Gemini.",
    images: ["/opengraph-image"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Deepclario",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Web",
      url: "https://deepclario.com",
      description:
        "Paste a rough prompt. Deepclario spots what is missing, asks one quick question if it has to, and rewrites the prompt so ChatGPT, Claude, and Gemini get it right the first time.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free plan with 5 prompt rewrites every 48 hours",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is prompt engineering?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Prompt engineering is the practice of writing inputs for AI models that are specific enough to produce useful outputs. A good prompt names the role, the audience, the format, and the constraints. A bad prompt forces the model to guess.",
          },
        },
        {
          "@type": "Question",
          name: "How does Deepclario improve my prompts?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You paste a rough prompt. Deepclario spots the gaps a fresh-eyes reviewer would catch, asks one quick question if it has to, and rewrites the prompt so ChatGPT, Claude, or Gemini can return the right output on the first try.",
          },
        },
        {
          "@type": "Question",
          name: "Is Deepclario free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The free plan gives you 5 prompt rewrites every 48 hours, no card required. Pro is $4.99 a month right now (a launch discount from $9.99) and removes the limit, keeps your full history, and adds weekly insights.",
          },
        },
      ],
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div
        className="editorial grain min-h-screen relative"
        style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
      >
        <MarketingNav current="home" />

        {/* Hero - two-column on desktop: copy left, animated centerpiece
            right. Centerpiece is hidden under lg so mobile gets the
            text-only treatment. LivePromptDemo lives in its own
            section directly below so the page reads "promise -> proof". */}
        <section
          id="try"
          className="pt-28 md:pt-36 pb-16 md:pb-20 px-6 md:px-10 relative"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-8">
                {/* Entrance choreography: eyebrow -> headline -> subhead ->
                    CTA -> centerpiece, staggered so the hero assembles in
                    under a second. The page paints and stays interactive
                    throughout - this is a reveal, never a gate. Only the
                    headline gets the blur resolve; everything else is the
                    plain fade + rise. */}
                <Reveal>
                  <p className="eyebrow mb-6">For ChatGPT, Claude &amp; Gemini users</p>
                </Reveal>
                <Reveal delay={0.08} blur>
                  <h1
                    className="display text-5xl md:text-[5.25rem] leading-[1.04] tracking-tight"
                    style={{ color: "var(--color-paper)" }}
                  >
                    Turn a rough prompt{" "}
                    <span style={{ color: "var(--color-accent)" }}>
                      into a great one.
                    </span>
                  </h1>
                </Reveal>
                {/* Thesis line, lifted from the old long-form section.
                    Sits between H1 and explanatory subhead as a one-line
                    band. Italic serif so it reads as a quote / position
                    statement, not body copy. */}
                {/* <p
                  className="font-serif italic mt-5 md:mt-6 text-xl md:text-2xl leading-snug"
                  style={{ color: 'var(--color-paper)', fontWeight: 400 }}
                >
                  The model is fine. The brief was vague.
                </p> */}
                <Reveal delay={0.22}>
                  <p
                    className="mt-5 md:mt-6 text-lg md:text-xl leading-relaxed max-w-2xl"
                    style={{ color: "var(--color-paper-mute)" }}
                  >
                    Paste your prompt. Deepclario spots what is missing, asks
                    you one quick question, and rewrites it. Works with ChatGPT,
                    Claude, and Gemini.
                  </p>
                </Reveal>

                {/* Primary CTA. Opens the live demo in a modal so a cold
                    visitor goes straight from promise to "their own
                    prompt, improved" without leaving the page. */}
                <Reveal delay={0.34}>
                  <div className="mt-8 md:mt-10 flex flex-wrap items-center gap-5">
                    <HeroDemoModal />
                    <Link
                      href="/pricing"
                      className="text-sm transition-opacity hover:opacity-100 opacity-80"
                      style={{ color: "var(--color-paper)" }}
                    >
                      See pricing
                    </Link>
                  </div>
                </Reveal>
              </div>
              {/* Centerpiece is now a supporting visual, not a co-headline.
                  Reduced from col-span-5 to col-span-4 and capped at
                  ~50% of its previous footprint via max-w-[280px] so it
                  never competes with the CTA for attention. */}
              <div className="hidden lg:flex lg:col-span-4 items-center justify-center">
                <Reveal delay={0.45} className="w-full max-w-96 min-w-96">
                  <HeroRefinement />
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* CUT - the inline "Try it yourself" section moved into a modal
            launched by the hero CTA (HeroDemoModal). Restore by
            uncommenting if the modal flow underperforms the inline one. */}
        {/*
        <section
          id="demo"
          className="pb-20 md:pb-24 px-6 md:px-10 scroll-mt-24"
          style={{ borderTop: "1px solid var(--color-rule)" }}
        >
          <div className="max-w-6xl mx-auto pt-16 md:pt-20">
            <p className="eyebrow mb-6">Try it yourself</p>
            <LivePromptDemo compact />
          </div>
        </section>
        */}

        {/* CUT - redundant with demo + steps */}
        {/* <StaticTransform /> */}

        {/* CUT - redundant with demo + steps */}
        {/* <FeatureShowcase /> */}

        {/* CUT - thesis line moved to hero, essay paragraphs removed */}
        {/*
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
                Most "ChatGPT gave me a bad answer" moments are actually "I sent a bad prompt" moments. One-line briefs, no audience, no format, no constraints. The AI guesses. You edit. You retry.
              </p>
              <p className="text-lg leading-[1.7]" style={{ color: 'var(--color-paper-mute)' }}>
                Deepclario catches the vague brief before it costs you a generation. It reviews your prompt the way a senior teammate would, asks one quick question if it has to, and hands ChatGPT, Claude, or Gemini something they can act on. You get the output you wanted, first try.
              </p>
            </div>
          </div>
        </section>
        */}

        {/* How it works - the same three steps the playground shows in its
            idle state, so the promise on this page matches the product
            word for word. */}
        {/* <section
          className="px-6 md:px-10 py-24 md:py-32"
          style={{ borderTop: "1px solid var(--color-rule)" }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-12 gap-8 md:gap-16 mb-14 md:mb-20">
              <div className="md:col-span-3">
                <p className="eyebrow">How it works</p>
              </div>
              <div className="md:col-span-9">
                <h2
                  className="display text-4xl md:text-5xl"
                  style={{ color: "var(--color-paper)" }}
                >
                  Three steps. None of them is hard.
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
        </section> */}

        {/* Extension - promoted above UseCases. The inline-in-ChatGPT
            angle is the most distinctive distribution surface, so it
            earns upper-half placement now. */}
        <section
          className="px-6 md:px-10 py-24 md:py-32"
          style={{ borderTop: "1px solid var(--color-rule)" }}
        >
          <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-3">
              {/* <p className="eyebrow">Works where you already work</p> */}
            </div>
            <div className="md:col-span-9">
              <h2
                className="font-serif text-3xl md:text-5xl leading-tight tracking-tight mb-6"
                style={{ color: "var(--color-paper)", fontWeight: 400 }}
              >
                One click inside ChatGPT, Claude, and Gemini.
              </h2>
              <p
                className="text-base md:text-lg leading-[1.6] max-w-xl mb-4"
                style={{ color: "var(--color-paper-mute)" }}
              >
                Install the extension and an Improve button shows up in the chat
                box. Click it. Your prompt gets rewritten in place.
              </p>
              <p
                className="text-base md:text-lg leading-[1.6] max-w-xl mb-8"
                style={{ color: "var(--color-paper-mute)" }}
              >
                No copy-paste. No new tab. No panel to dig into. Just better
                output, with one keystroke.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/extension"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] transition-all btn-paper"
                  style={{
                    background: "var(--color-paper)",
                    color: "var(--color-ink)",
                    fontWeight: 500,
                  }}
                >
                  Install the extension
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
                {/* <span
                  className="text-sm"
                  style={{ color: "var(--color-paper-mute)" }}
                >
                  Chrome and Brave. Free, no account.
                </span> */}
              </div>
            </div>
          </div>
        </section>

        {/* Use cases - 6 concrete scenarios linked to real prompt pages.
            Translates "what is this" into "what does it do for me." */}
        <UseCases />

        {/* CUT - "A fair question" folded into FAQSection as one richer answer */}
        {/*
        <section className="px-6 md:px-10 py-24 md:py-32" style={{ borderTop: '1px solid var(--color-rule)', background: 'var(--color-ink-soft)' }}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-5">
              <p className="eyebrow mb-6">A fair question</p>
              <h2 className="display text-3xl md:text-5xl" style={{ color: 'var(--color-paper)' }}>
                "Can't I just ask ChatGPT to do this?"
              </h2>
            </div>
            <div className="md:col-span-7 space-y-6">
              <p>You can. But you have to know your prompt was the problem in the first place...</p>
            </div>
          </div>
        </section>
        */}

        {/* CUT - belongs on /about */}
        {/*
        <section className="px-6 md:px-10 py-32 md:py-40" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="max-w-4xl mx-auto text-center">
            <p className="eyebrow mb-10">Principles</p>
            <p
              className="font-serif text-3xl md:text-[2.8rem] leading-tight tracking-tight"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              We don't want you to spend more time with AI. We want you to spend it better.
            </p>
            <p className="mt-12 text-base md:text-lg max-w-xl mx-auto leading-[1.7]" style={{ color: 'var(--color-paper-mute)' }}>
              Deepclario is for professionals who work with AI every day - engineers, writers, founders, researchers. For anyone who sees better prompting as a valuable skill for the future.
            </p>
          </div>
        </section>
        */}

        {/* Trust - the product asks people to paste work emails, code, and
            business ideas, so the data-handling answer lives on the page,
            not just in the FAQ. Every claim here must match /privacy. */}
        <section
          className="px-6 md:px-10 py-24 md:py-32"
          style={{ borderTop: "1px solid var(--color-rule)" }}
        >
          <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-3">
              <p className="eyebrow">You own your data</p>
            </div>
            <div className="md:col-span-9">
              <h2
                className="font-serif text-3xl md:text-5xl leading-tight tracking-tight mb-10"
                style={{ color: "var(--color-paper)", fontWeight: 400 }}
              >
                Your prompts stay yours.
              </h2>
              <div className="grid sm:grid-cols-3 gap-8">
                {TRUST_POINTS.map((t) => (
                  <div key={t.title}>
                    <h3
                      className="text-base mb-2"
                      style={{ color: "var(--color-paper)", fontWeight: 500 }}
                    >
                      {t.title}
                    </h3>
                    <p
                      className="text-sm leading-[1.7]"
                      style={{ color: "var(--color-paper-mute)" }}
                    >
                      {t.body}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/privacy"
                className="inline-block mt-8 text-sm transition-opacity hover:opacity-100 opacity-80 underline underline-offset-4"
                style={{ color: "var(--color-paper)" }}
              >
                Read the full privacy policy
              </Link>
            </div>
          </div>
        </section>

        {/* Honest proof - one real before/after rewrite plus a founder
            note. Sits just above Pricing so proof lands at the moment
            buying-doubt peaks. Swap for real testimonials once users
            give attributable quotes. */}
        {/* <EarlyDays /> */}

        {/* Pricing */}
        <section
          id="pricing"
          className="px-6 md:px-10 py-24 md:py-32"
          style={{ borderTop: "1px solid var(--color-rule)" }}
        >
          <div className="max-w-6xl mx-auto">
            <EditorialPricing />
          </div>
        </section>


        {/* Footer */}
        <footer
          className="px-6 md:px-10 py-16"
          style={{ borderTop: "1px solid var(--color-rule)" }}
        >
          <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
            <div className="md:col-span-5">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/logo.png"
                  alt="Deepclario"
                  width={24}
                  height={24}
                />
                <span
                  className="text-sm"
                  style={{ color: "var(--color-paper)", fontWeight: 500 }}
                >
                  Deepclario
                </span>
              </div>
              <p
                className="text-sm leading-[1.7] max-w-sm"
                style={{ color: "var(--color-paper-mute)" }}
              >
                Deepclario rewrites your prompts before you send them, so
                ChatGPT, Claude, and Gemini give you better answers.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                { href: "/extension", label: "Extension" },
                { href: "/prompts", label: "Prompt library" },
                { href: "/detector", label: "AI text detector" },
                { href: "/extension", label: "Browser extension" },
                { href: "/tools/prompt-improver", label: "Prompt Improver" },
                { href: "/tools/prompt-analyzer", label: "Prompt Analyzer" },
                { href: "/pricing", label: "Pricing" },
              ]}
            />
            <FooterCol
              title="Reading"
              links={[
                {
                  href: "/blog/what-is-prompt-engineering",
                  label: "What is prompt engineering",
                },
                {
                  href: "/blog/how-to-write-better-prompts",
                  label: "How to write better prompts",
                },
                {
                  href: "/blog/what-is-a-good-prompt",
                  label: "What makes a good prompt",
                },
                {
                  href: "/blog/prompt-engineering-examples",
                  label: "Examples",
                },
                { href: "/blog", label: "All guides" },
                { href: "/faq", label: "FAQ" },
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
                { href: "/refund", label: "Refund" },
              ]}
            />
          </div>
          <div
            className="max-w-6xl mx-auto mt-16 pt-6 text-xs"
            style={{
              borderTop: "1px solid var(--color-rule)",
              color: "var(--color-paper-mute)",
            }}
          >
            © 2026 Deepclario
          </div>
        </footer>
      </div>
    </>
  );
}

/* ===== Sub-components ===== */

/* Claims here must stay in sync with /privacy. Prompts are processed by
   Google Gemini to generate the rewrite, so we say "never used to train",
   not "never leave our servers". */
const TRUST_POINTS = [
  {
    title: 'Never used to train AI',
    body: 'Your prompts are only used to generate your rewrite. We never use them to train models or sell them.',
  },
  {
    title: 'Delete everything anytime',
    body: 'Remove your account and all your data from Settings. Everything is gone within 24 hours.',
  },
  {
    title: 'Payments by Paddle',
    body: 'Card details never touch our servers. VAT and sales tax are handled automatically.',
  },
]

const STEPS = [
  { title: 'We read your prompt', description: 'Paste rough notes, a one-liner, or a request you have not finished writing. No prompt-engineering degree required.' },
  { title: 'We ask one question if something is missing', description: 'Deepclario spots the gap a careful reader would catch and asks one quick question. Answer it, and the rewrite fills in the rest.' },
  { title: 'You get a rewrite ready to send', description: 'Copy the improved prompt into your AI chat and get the answer you wanted on the first try. No five-prompt rewrite spiral.' },
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
          <h3 className="font-serif text-2xl md:text-3xl" style={{ color: 'var(--color-paper)', fontWeight: 400 }}>
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

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="md:col-span-2">
      <p className="eyebrow mb-4">{title}</p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm transition-opacity hover:opacity-100 opacity-80"
              style={{ color: "var(--color-paper)" }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
