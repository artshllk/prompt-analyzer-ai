import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { EarlyDays } from "@/components/marketing/EarlyDays";
import { CannotCheck } from "@/components/factcheck/CannotCheck";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { CheckClient } from "@/components/factcheck/CheckClient";
import { WorkedExample } from "@/components/factcheck/WorkedExample";
import { EditorialPricing } from "@/components/marketing/EditorialPricing";
import { PaddleProvider } from "@/components/PaddleProvider";
import { SectionFrame } from "@/components/marketing/SectionFrame";
import { Reveal } from "@/components/ui/Reveal";
import { defaultOGImage } from "@/lib/og-image";
import { ANON_FACTCHECK_MONTH } from "@/lib/rate-limit";
import { foundingSeatsLeft } from "@/lib/paddle";

export const metadata: Metadata = {
  title: "Check the sources in your article",
  description: `Paste your article. We open every link and check that the page really says it. Free, ${ANON_FACTCHECK_MONTH.capacity} a month.`,
  alternates: { canonical: "https://deepclario.com" },
  openGraph: {
    title: "Does your source really say that?",
    description: "Paste your article. We open every link and check.",
    url: "https://deepclario.com",
    type: "website",
    images: defaultOGImage("Does your source really say that?"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Does your source really say that?",
    description: "Paste your article. We open every link and check.",
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
 * PRICING IS BACK ON THIS PAGE, and that changes the render mode.
 *
 * The founding-seat count decides the PRICE on screen, so it has to come from
 * the server (see /pricing for the reasoning). That means this page can no
 * longer be fully static; it regenerates on the same five minute timer the
 * pricing page uses. Everything else on the page is still free of server
 * reads: CheckClient fetches its allowance after paint.
 *
 * One component renders both tables, so the two pages cannot disagree.
 */
export const revalidate = 300;

const TOTAL = 5;

export default async function LandingPage() {
  const foundingLeft = await foundingSeatsLeft();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="editorial parchment grain min-h-screen relative" style={{ color: "var(--ink)" }}>
        <MarketingNav current="home" />

        {/* §01 THE HERO IS THE CONSOLE. Headline left-set in the measure with
            the gutter note beside it; the console sits under it as one piece
            of equipment. */}
        <div className="pt-[68px]">
          <SectionFrame
            id="try"
            index={1}
            total={TOTAL}
            head="Deepclario · Check the sources in your article"
            note="Paste, then read what the page says. That is the whole tool."
          >
            <Reveal>
              <h1
                className="font-serif text-balance text-[38px] leading-[1.1] tracking-[-0.015em] md:text-[64px] md:leading-[1.04] md:tracking-[-0.02em] max-w-[820px]"
                style={{ color: "var(--ink)" }}
              >
                Does your source{" "}
                <em style={{ color: "var(--brand)", fontStyle: "italic", fontWeight: 400 }}>
                  really
                </em>{" "}
                say that?
              </h1>
              <p
                className="mt-4 md:mt-5 text-base md:text-lg leading-relaxed max-w-[560px]"
                style={{ color: "var(--ink-soft)", textWrap: "pretty" }}
              >
                Paste your article. We open every link and check that the page
                really says it.
              </p>
            </Reveal>
            <Reveal index={1}>
              <div className="mt-8 md:mt-11">
                <CheckClient />
              </div>
            </Reveal>
          </SectionFrame>
        </div>

        {/* §02 THE REAL EXAMPLE. The side by side comparison is the most
            important thing on the page. */}
        <SectionFrame
          index={2}
          total={TOTAL}
          head="A real example"
          note="Both quotes are verbatim. Neither site is named."
          tier="inset"
        >
          <WorkedExample />
        </SectionFrame>

        {/* §03 WHEN WE CANNOT CHECK. */}
        <SectionFrame
          index={3}
          total={TOTAL}
          head="When we cannot check"
          note="Every count is from the audit. No cell is invented."
        >
          <CannotCheck />
        </SectionFrame>

        {/* §04 PRIVACY AND THE FOUNDER'S NOTE. */}
        <SectionFrame
          index={4}
          total={TOTAL}
          head="You own your data"
          note="Every line here matches the privacy policy word for word."
          tier="inset"
        >
          <EarlyDays />
        </SectionFrame>

        {/* §05 PRICING. Same component as /pricing, same server count. */}
        <SectionFrame
          index={5}
          total={TOTAL}
          head="Pricing"
          note="Every number is the one the server enforces."
        >
          <PaddleProvider>
            <EditorialPricing headingLevel="h2" foundingLeft={foundingLeft} />
          </PaddleProvider>
        </SectionFrame>

        <footer
          className="px-4 sm:px-6 md:px-[50px] pt-14 pb-10"
          style={{
            background: "var(--surface-inset)",
            borderTop: "1px solid var(--rule-ground)",
          }}
        >
          <div className="max-w-[1180px] mx-auto grid md:grid-cols-12 gap-8 md:gap-12">
            <div className="md:col-span-5">
              <div className="flex items-center gap-2 mb-3.5">
                <Image src="/logo.png" alt="Deepclario" width={22} height={22} className="rounded" />
                <span className="text-sm" style={{ color: "var(--ink)", fontWeight: 500 }}>
                  Deepclario
                </span>
              </div>
              <p
                className="text-sm leading-[1.7] max-w-sm"
                style={{ color: "var(--ink-soft)", textWrap: "pretty" }}
              >
                Deepclario opens the links in your writing and checks that the
                page really says the number you put next to it.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                { href: "/", label: "Check your sources" },
                { href: "/how-it-works", label: "How we check a link" },
                { href: "/detector", label: "AI text detector" },
                { href: "/prompt-improver", label: "Prompt improver" },
                { href: "/extension", label: "Extension" },
                { href: "/prompts", label: "Prompt library" },
                { href: "/pricing", label: "Pricing" },
              ]}
            />
            <FooterCol
              title="Reading"
              links={[
                { href: "/blog/why-ai-makes-mistakes", label: "Why AI makes things up" },
                { href: "/blog/are-ai-detectors-accurate", label: "Are AI detectors accurate" },
                { href: "/blog/human-text-vs-ai-text", label: "Human text vs AI text" },
                { href: "/blog/prompt-engineering-examples", label: "Examples" },
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
            className="max-w-[1180px] mx-auto mt-14 pt-5 flex justify-between text-[11px]"
            style={{
              borderTop: "1px solid var(--rule)",
              color: "var(--ink-soft)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span>© 2026 Deepclario</span>
            <span>End of page</span>
          </div>
        </footer>
      </div>
    </>
  );
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
              className="text-sm transition-colors hover:text-[var(--brand)]"
              style={{ color: "var(--ink)" }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
