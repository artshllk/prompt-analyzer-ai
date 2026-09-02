import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
// { /* CUT - redundant with demo + steps */ }
// import { StaticTransform } from '@/components/marketing/StaticTransform'
import { EditorialPricing } from "@/components/marketing/EditorialPricing";
import { EarlyDays } from "@/components/marketing/EarlyDays";
import { CannotCheck } from "@/components/factcheck/CannotCheck";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { CheckClient } from "@/components/factcheck/CheckClient";
import {
  WorkedExample,
  NoLinkNote,
} from "@/components/factcheck/WorkedExample";
import { Reveal } from "@/components/ui/Reveal";
import { defaultOGImage } from "@/lib/og-image";
import { createClient } from "@/lib/supabase/server";
import { getFactcheckAllowance } from "@/lib/db/usage";
import { viewerPlan } from "@/lib/db/viewer-plan";
// { /* CUT - redundant with demo + steps */ }
// import { FeatureShowcase } from '@/components/marketing/FeatureShowcase'

export const metadata: Metadata = {
  // The layout template appends "| Deepclario", so the brand stays out of
  // this string. Leads on what someone actually searches for when they have
  // this problem, which is a broken or missing source, not a product category
  // nobody types.
  // Searchable variant. It must not contradict the H1, which is the sentence
  // a person sees on the page and on the share card.
  title: "Check the sources in your article",
  description:
    "Paste your article. We open every link and check that the page really says it. Free, 2 a day.",
  alternates: { canonical: "https://deepclario.com" },
  openGraph: {
    title: "Does your source really say that?",
    description:
      "Paste your article. We open every link and check.",
    url: "https://deepclario.com",
    type: "website",
    // This page defines its own openGraph object, which replaces (does not
    // merge with) the root layout's openGraph - including its image. See
    // defaultOGImage() for the full explanation.
    images: defaultOGImage("Does your source really say that?"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Does your source really say that?",
    description:
      "Paste your article. We open every link and check.",
    images: ["/opengraph-image"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Deepclario",
      applicationCategory: "UtilityApplication",
      operatingSystem: "Web",
      url: "https://deepclario.com",
      description:
        "Paste a blog post or report. Deepclario opens every link in it and checks whether that page really contains the number it is cited for, and lists the numbers that carry no source at all.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free to use with no account",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How do you check a link?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We open the page your text links to and look for the number you put next to it. If the page says it, we say so. If the page does not say it, we show you the closest sentence that is actually there, so you can see the difference yourself.",
          },
        },
        {
          "@type": "Question",
          name: "Does it tell me if a number is false?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No, and that is on purpose. We only tell you what the page you linked to says. A number can be completely true and still sit behind a link that does not show it, which is the most common problem we find.",
          },
        },
        {
          "@type": "Question",
          name: "What about numbers with no link?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We list them. Across eleven real statistics posts we measured, about half the numbers had no source of any kind, which is usually the largest group in a document.",
          },
        },
        {
          "@type": "Question",
          name: "Is it free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can paste a post and check it without an account.",
          },
        },
      ],
    },
  ],
};

/**
 * The checker is also where a signed-in user lands, so the count they signed up
 * for is shown here rather than on a page of its own. That is what let the
 * dashboard be deleted instead of rewritten: a page whose only job was showing
 * this number had no job once the number lived next to the tool.
 *
 * Anonymous visitors see nothing. Their limit is 2 a day, best effort, and a
 * number we cannot enforce is not one we state. See CLAUDE.md.
 */
async function checksLeft(): Promise<{ remaining: number; limit: number } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single();
    const a = await getFactcheckAllowance(user.id, profile?.tier ?? "free");
    if (a.limit === null) return null;
    return { remaining: a.remaining, limit: a.limit };
  } catch {
    // Never let a counter stop the page rendering. The tool is the point.
    return null;
  }
}

export default async function LandingPage() {
  const left = await checksLeft();
  const { plan, renewsOn } = await viewerPlan();
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
          className="pt-24 md:pt-32 pb-20 md:pb-28 px-5 sm:px-6 md:px-10 relative"
        >
          <div className="max-w-5xl mx-auto">
            {/* Entrance choreography: eyebrow -> headline -> subhead -> tool,
                staggered so the hero assembles in under a second. The page
                paints and stays interactive throughout - this is a reveal,
                never a gate. Only the headline gets the resolve. */}
            {/*
              THE TOOL IS THE HERO, and it is the FACT CHECKER now.

              The prompt improver used to be here. It is frozen and lives at
              /playground, where 48 links across 42 files still point at it,
              including one inside an email already sitting in inboxes.

              Same lesson as the extension install wall and as the scripted
              demo this replaced: someone arriving from a Reddit thread should
              be able to paste something without clicking anything first. A
              description with a button is one click too many, and the click is
              where they leave.

              The worked example sits ABOVE the box on purpose. Someone who has
              never heard of this needs to see what it catches before they will
              paste their own writing into it.
            */}
            {/*
              15 WORDS BEFORE THE BOX. One headline, one line, then the tool.
              Everything else that used to sit here was reassurance stacking or
              a description of our internals, and both are ways of talking
              instead of letting someone try it.

              The worked example moved BELOW the box. It used to sit above,
              because the old copy did not explain itself and the example had
              to do that job. The copy explains itself now, so the example's
              job changed from explaining to proving, and proof goes after the
              ask.
            */}
            <Reveal>
              <h1
                className="display text-[2.6rem] sm:text-5xl md:text-[4.5rem] leading-[1.05] tracking-tight"
                style={{ color: "var(--ink)" }}
              >
                Does your source{" "}
                <span style={{ color: "var(--brand)" }}>really say that?</span>
              </h1>
            </Reveal>
            <Reveal index={1}>
              <p
                className="mt-4 md:mt-5 text-lg md:text-xl leading-relaxed max-w-2xl"
                style={{ color: "var(--ink-soft)" }}
              >
                Paste your article. We open every link and check.
              </p>
            </Reveal>

            {left && (
              <Reveal index={2}>
                <p
                  className="mt-6 text-[14px]"
                  style={{ color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}
                >
                  {left.remaining} of {left.limit} checks left this month
                </p>
              </Reveal>
            )}

            <Reveal index={3}>
              <div className="mt-8 md:mt-10">
                <CheckClient />
              </div>
            </Reveal>

            {/* Said before the machine does it, not after. Somebody pasting an
                internal draft deserves to know we will open what is in it. */}
            <Reveal index={3}>
              <p
                className="mt-3 text-[13px] leading-relaxed"
                style={{ color: "var(--ink-soft)" }}
              >
                We open every link in your text. Do not paste private links.
              </p>
            </Reveal>

            <Reveal index={5}>
              <p
                className="mt-6 text-[15px] leading-relaxed"
                style={{ color: "var(--ink)" }}
              >
                We never say a number is wrong. We show you what the page says.
              </p>
            </Reveal>

          </div>
        </section>

        {/*
          THE ONE DARK SECTION ON THE PAGE, AND IT STAYS THE ONLY ONE.

          A page that flips light and dark repeatedly stops reading as
          editorial and starts reading as a template, so this is spent once, on
          the part that has to land: the proof that the tool finds something
          real.

          Dark ground with the white document card on it is also the right
          picture for what this is. It makes the marked-up page look like a
          page on a desk, which is what a proof reader sees.

          IT IS A CONTAINED BLOCK, NOT A FULL-BLEED BAND, and that is the
          difference between the two readings. Full bleed, the dark ran edge to
          edge while the card stayed capped at max-w-5xl, so on a wide screen
          there was about 490px of black down each side and 112px above and
          below. The card was roughly a third of the dark area and read as
          something lost in a void.

          Contained, the black becomes a mount around the document. A mount is
          narrow by definition: the moment it is wider than the thing it holds,
          it stops framing and starts swallowing.
        */}
        <section className="px-5 sm:px-6 md:px-10 pb-20 md:pb-28">
          <div
            className="max-w-5xl mx-auto rounded-3xl px-5 sm:px-8 md:px-10 py-12 md:py-14"
            style={{ background: "var(--ink)" }}
          >
            <p
              className="text-[12px] uppercase tracking-[0.14em] mb-5"
              style={{ color: "var(--mute-on-ink)" }}
            >
              A real example
            </p>
            <WorkedExample onDark />
            <div className="mt-5">
              <NoLinkNote onDark />
            </div>
          </div>
        </section>

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

        {/* REMOVED: the extension promo, the use cases, and the prompt
            engineering FAQ. All three sold the prompt improver, which is
            frozen and lives at /playground. None of the routes are touched,
            so every link into them still resolves. */}


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
        <CannotCheck />

        {/* Same ground as the section above it, so it takes a rule. The rule
            convention on this page: a border only where the ground does not
            change, never on top of a surface change. */}
        <section
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ borderTop: "1px solid var(--rule)" }}
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
                Your writing stays yours.
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
        {/* Honest proof, in place of the invented kind. It says plainly that
            Deepclario is new and that there are no made-up reviews here,
            which is worth more at launch than three fabricated quotes. */}
        <EarlyDays />

        {/* Pricing */}
        <section
          id="pricing"
          className="px-6 md:px-10 py-20 md:py-28"
          style={{ borderTop: "1px solid var(--color-rule)" }}
        >
          <div className="max-w-6xl mx-auto">
            <EditorialPricing plan={plan} renewsOn={renewsOn} />
          </div>
        </section>

        {/* Footer */}
          {/* The detector gets ONE line, not a section. It has its own page and
            it is not what this site is for. The prompt improver gets nothing
            here at all: footer link only. */}
        <section className="px-6 md:px-10 pb-20 md:pb-28">
          <div className="max-w-6xl mx-auto">
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              We also have a{" "}
              <Link
                href="/detector"
                className="underline underline-offset-4"
                style={{ color: "var(--brand-text)" }}
              >
                free AI text detector
              </Link>
              .
            </p>
          </div>
        </section>

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
                Deepclario opens the links in your writing and checks that the
                page really says the number you put next to it.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                { href: "/", label: "Check your sources" },
                { href: "/detector", label: "AI text detector" },
                // Extension and Prompt library came off the main nav because
                // they point at the frozen prompt improver. They stay here, and
                // their routes are untouched, so every existing link resolves.
                { href: "/extension", label: "Extension" },
                { href: "/prompts", label: "Prompt library" },
                { href: "/pricing", label: "Pricing" },
              ]}
            />
            <FooterCol
              title="Reading"
              links={[
                // Swapped from three prompt-engineering posts. Those are still
                // published and still linked from /blog; they just no longer
                // sit in the footer of a page about checking sources.
                {
                  href: "/blog/why-ai-makes-mistakes",
                  label: "Why AI makes things up",
                },
                {
                  href: "/blog/are-ai-detectors-accurate",
                  label: "Are AI detectors accurate",
                },
                {
                  href: "/blog/human-text-vs-ai-text",
                  label: "Human text vs AI text",
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
    title: "Never used to train AI",
    body: "Your text is only used to run the check you asked for. We never use it to train models or sell it.",
  },
  {
    title: "Delete everything anytime",
    body: "Remove your account and all your data from Settings. Everything is gone within 24 hours.",
  },
  {
    title: "Payments by Paddle",
    body: "Card details never touch our servers. VAT and sales tax are handled automatically.",
  },
];



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
        {links.map((l, index) => (
          <li key={index}>
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
