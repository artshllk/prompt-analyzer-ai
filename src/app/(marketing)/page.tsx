import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
// { /* CUT - redundant with demo + steps */ }
// import { StaticTransform } from '@/components/marketing/StaticTransform'
import { EarlyDays } from "@/components/marketing/EarlyDays";
import { CannotCheck } from "@/components/factcheck/CannotCheck";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { CheckClient } from "@/components/factcheck/CheckClient";
import { WorkedExample } from "@/components/factcheck/WorkedExample";
import { Reveal } from "@/components/ui/Reveal";
import { defaultOGImage } from "@/lib/og-image";
import { createClient } from "@/lib/supabase/server";
import { getFactcheckAllowance } from "@/lib/db/usage";
import { ANON_FACTCHECK_MONTH } from "@/lib/rate-limit";
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
  // Read from the constant. It said "2 a day", which was the anonymous limit
  // two changes ago, and this is the sentence Google shows.
  description: `Paste your article. We open every link and check that the page really says it. Free, ${ANON_FACTCHECK_MONTH.capacity} a month.`,
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
  /**
   * No viewerPlan() and no foundingSeatsLeft() any more. Both existed only to
   * feed the pricing table, and both are round trips: one to Postgres and one
   * to Paddle, on every render of the busiest page on the site. Deleting the
   * table deleted the reason for them.
   */
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

        {/*
          THE HERO IS THE CONSOLE, and the console is the tool.

          Restructured from docs/design/hero-console.html, which is the
          approved design and is checked in unmodified so what shipped can be
          held against what was signed off. Layout, spacing, the framing, the
          toolbar, the counter, the keyboard hint and the serif headline with
          its italic accent word are that file. What is NOT that file is
          anything it said about this product that was not true: the pulsing
          "v1.4" pill, an "Import URL" tab we do not offer, a headless
          chromium we do not run, and a DOM engine that does not exist. All
          four are gone rather than reworded.

          The head block is server-rendered here rather than inside the client
          console, so the H1 and the promise under it are in the HTML a
          crawler gets whether or not the bundle ever loads.
        */}
        <section
          id="try"
          className="pt-24 md:pt-32 pb-20 md:pb-28 px-4 sm:px-6"
          /* Declared, not inherited. Every section on this page names its own
             tier from the ladder in globals.css, so the rhythm is readable in
             one grep instead of being an accident of what the root happens to
             be. */
          style={{ background: "var(--surface)" }}
        >
          <div className="w-full max-w-4xl mx-auto">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-8">
                {/* display-hero from DESIGN.md: Newsreader 500, 56px, 64px
                    line, -0.02em. The accent word is a real italic cut now,
                    not a synthesised slant, which is the whole reason that
                    face was loaded. */}
                <h1
                  className="font-serif text-balance text-[36px] leading-[44px] tracking-[-0.015em] md:text-[56px] md:leading-[64px] md:tracking-[-0.02em]"
                  style={{ color: "var(--ink)" }}
                >
                  Does your source{" "}
                  <em
                    className="not-italic"
                    style={{ color: "var(--brand)", fontStyle: "italic" }}
                  >
                    really
                  </em>{" "}
                  say that?
                </h1>
                <p
                  className="mt-4 text-base sm:text-lg leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  Paste your article. We open every link and check that the page
                  really says it.
                </p>
              </div>
            </Reveal>

            {/* The count a signed-in reader signed up for, passed into the
                console so it sits in the toolbar's status slot beside the
                character counter. That slot used to say "DOM Engine Ready",
                which was furniture; this is the one status about this session
                that is both true and enforced.

                Anonymous visitors get null and the slot renders nothing,
                because their ceiling is best effort and a number we cannot
                enforce is not one we state. */}
            <Reveal index={1}>
              <CheckClient checksLeft={left} />
            </Reveal>
          </div>
        </section>

        {/*
          THE REAL EXAMPLE, ITS OWN SECTION, ON ITS OWN TIER.

          It used to sit inside a contained dark mount, which was the one dark
          block on the page. That is gone. The mount was doing the job of
          separating this section from the hero above it, and a ground of its
          own does the same job with the same ladder every other section uses,
          so the page now alternates the whole way down instead of alternating
          everywhere except here.

          surface-subtle, so it steps against the hero above and the taxonomy
          below, both of which are surface. The white comparison container
          reads harder on this than it did on white-adjacent cream.

          --inverse-surface is still a token and is now used nowhere. It stays
          in the ladder because DESIGN.md defines it and a tier that exists
          only when something needs it is not a cost.

          max-w-5xl rather than the 1180px the rest of the page uses. Two
          columns of quoted prose get harder to compare the further apart they
          sit, and this is the one section whose entire job is the comparison.
        */}
        <section
          className="px-4 sm:px-6 py-12 sm:py-16 md:py-20"
          style={{ background: "var(--surface-subtle)" }}
        >
          <div className="w-full max-w-5xl mx-auto">
            <WorkedExample />
          </div>
        </section>

        {/* CUT - redundant with demo + steps */}
        {/* <StaticTransform /> */}

        {/* CUT - redundant with demo + steps */}
        {/* <FeatureShowcase /> */}

        {/* CUT - thesis line moved to hero, essay paragraphs removed */}
        {/*
        <section id="why" className="px-6 md:px-10 py-24 md:py-32" style={{ borderTop: '1px solid var(--color-rule)' }}>
          <div className="max-w-[1180px] mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
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
          <div className="max-w-[1180px] mx-auto">
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
            frozen and lives at /prompt-improver. None of the routes are touched,
            so every link into them still resolves. */}


        {/* CUT - "A fair question" folded into FAQSection as one richer answer */}
        {/*
        <section className="px-6 md:px-10 py-24 md:py-32" style={{ borderTop: '1px solid var(--color-rule)', background: 'var(--color-ink-soft)' }}>
          <div className="max-w-[1180px] mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
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

        {/*
          WHAT HAPPENS TO YOUR TEXT, AND WHO IS ASKING FOR IT, in one section.

          These were two stacked sections with a rule between them: "You own
          your data" as three columns of plain text, and "Early days" as a
          paragraph under an eyebrow. They answer the same question from two
          sides, and neither was strong enough on its own to be the thing that
          persuades somebody to paste an unpublished draft into a box.
        */}
        <EarlyDays />

        {/* Pricing */}
        {/*
          PRICING LIVES AT /pricing AND NOWHERE ELSE.

          The whole table was here as well, which meant two plans, two prices,
          two founding counts and two feature lists rendered from one component
          in two places a visitor could reach in one click of each other. A
          second copy of a price is a second thing that can be read while the
          first is being edited, and this site has already shipped five
          copy-versus-reality gaps without help from duplication.

          Nothing linked to /#pricing, so removing the anchor breaks no link:
          the nav, the mobile menu and the footer all point at /pricing.

          What survives is one line, because a page that ends on a privacy
          section dead-ends. It states the free allowance from the constant the
          server enforces and sends anyone who wants the rest to the page that
          owns it.
        */}
        {/*
          THE CLOSE. One section, not two.

          Removing the pricing table left two one-line sections sitting on the
          same ground with nothing between them, which reads as the page
          trailing off rather than ending. They are the same thought anyway:
          here is what else there is.

          The Pro pointer gets a card because it is the only thing on this page
          asking for money and it has to look deliberate. The detector keeps
          its one quiet line: it has its own page, it is not what this site is
          for, and a second card would give it equal billing.
        */}
        <section
          className="px-6 md:px-10 py-16 md:py-24"
          style={{ background: "var(--surface)" }}
        >
          <div className="max-w-[1180px] mx-auto">
            <div
              className="rounded-lg p-6 md:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-warm)",
              }}
            >
              <div>
                <p className="text-[17px] leading-relaxed" style={{ color: "var(--ink)" }}>
                  Free to start. {ANON_FACTCHECK_MONTH.capacity} checks a month
                  without an account, more with one.
                </p>
                {/* The same identity line the Pro card uses, so the two
                    pages describe the tier the same way. Where pricing lives
                    is our problem, not the reader's, and the sentence that
                    said so has no business on the page. */}
                <p
                  className="mt-1 text-[14px] leading-relaxed"
                  style={{ color: "var(--ink-soft)" }}
                >
                  Pro is for people who publish every day.
                </p>
              </div>
              <Link
                href="/pricing"
                className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  border: "1px solid var(--border-warm)",
                  background: "var(--surface-subtle)",
                  color: "var(--ink)",
                }}
              >
                See what Pro adds
              </Link>
            </div>

            <p className="mt-6 text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
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
          style={{
            background: "var(--surface-subtle)",
            borderTop: "1px solid var(--border-warm)",
          }}
        >
          <div className="max-w-[1180px] mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
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
                // Extension, Prompt library and the improver came off the main
                // nav because they point at the frozen product. They stay here,
                // and their routes are untouched, so every existing link
                // resolves.
                //
                // The improver was reachable from ONE place, an FAQ answer that
                // has since been deleted, which left a working page with no way
                // in. It belongs here rather than in the nav: hard to find is
                // the right amount of findable for something we do not sell.
                { href: "/prompt-improver", label: "Prompt improver" },
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
            className="max-w-[1180px] mx-auto mt-16 pt-6 text-xs"
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
