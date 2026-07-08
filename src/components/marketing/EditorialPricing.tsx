"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Pricing - two-tier card grid (Free + Pro) with a polished
 * "Most popular" treatment on Pro. The cards use card-editorial
 * for surface depth and card-accent-edge for the Pro accent ring.
 *
 * Pro features are limited to what the product actually ships today.
 * Persona memory, multi-model compare, BYOK - all on the roadmap,
 * intentionally not listed here. Bullets lead with outcomes (Deep
 * Rewrite, insights, history) rather than raw usage limits - keep this
 * list in sync with PaywallModal's PRO_FEATURES.
 */

const FREE_FEATURES = [
  "5 prompt rewrites / 48h",
  "AI detector · 5 texts / 24h",
  "Chrome extension",
  "7-day session history",
  "Clarity score for every prompt",
  "Works with ChatGPT, Claude, Gemini",
];

const PRO_FEATURES = [
  "Deep Rewrite: drafts, critiques, and refines your prompt for the hardest tasks",
  "Unlimited prompt rewrites and AI detection",
  "Weekly insights report: see exactly where your prompts improve",
  "Full history, kept forever (Free keeps 7 days)",
  "Priority processing on every request",
  "Priority support",
];

/**
 * Launch pricing. Single source of truth for the promotional discount so
 * the strike-through anchor, the sale price, and the badge never drift.
 *
 * IMPORTANT: this is display only. The actual charge is set by the Paddle
 * price the checkout uses - to genuinely bill the launch price, update the
 * price in the Paddle dashboard too. To end the promo, set active: false.
 */
const LAUNCH = {
  active: true,
  /** Headline percent off, shown in the badge and saving chip. */
  percentOff: 50,
  /** Monthly list price -> launch price. */
  monthly: { list: "9.99", now: "4.99" },
  /** Yearly per-month list price -> launch price, plus the billed total. */
  yearly: { list: "7.99", now: "3.99", billedTotal: "47.88" },
};

export function EditorialPricing({
  headingLevel = "h2",
}: {
  /** "h1" on the standalone /pricing page (its top-level heading); "h2" when embedded as a section. */
  headingLevel?: "h1" | "h2";
}) {
  const [annual, setAnnual] = useState(false);
  const Heading = headingLevel;

  const period = annual ? LAUNCH.yearly : LAUNCH.monthly;
  const listPrice = period.list;
  const nowPrice = LAUNCH.active ? period.now : period.list;

  return (
    <div>
      {/* Section header */}
      <div className="grid md:grid-cols-12 gap-8 md:gap-16 mb-12 md:mb-16">
        <div className="md:col-span-5">
          <p className="eyebrow mb-6">Pricing</p>
          <Heading
            className="display text-4xl md:text-5xl"
            style={{ color: "var(--color-paper)" }}
          >
            Free until you outgrow it.
          </Heading>
          <p
            className="mt-5 text-base md:text-lg leading-relaxed"
            style={{ color: "var(--color-paper-mute)" }}
          >
            The free plan is the product, not a trial. Upgrade only when you
            reach for Deepclario every day.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="md:col-span-7 flex md:justify-end md:items-end">
          <div
            className="inline-flex p-1 rounded-full"
            style={{
              background: "var(--color-ink-card)",
              border: "1px solid var(--color-rule)",
            }}
            role="tablist"
            aria-label="Billing period"
          >
            <BillingToggle active={!annual} onClick={() => setAnnual(false)}>
              Monthly
            </BillingToggle>
            <BillingToggle active={annual} onClick={() => setAnnual(true)}>
              Yearly
              <span
                className="ml-2 text-[10px] tracking-wider uppercase font-semibold px-1.5 py-0.5 rounded"
                style={{
                  background: annual
                    ? "var(--color-accent-soft)"
                    : "transparent",
                  color: annual
                    ? "var(--color-accent-bright)"
                    : "var(--color-paper-mute)",
                }}
              >
                Save 20%
              </span>
            </BillingToggle>
          </div>
        </div>
      </div>

      {/* Two-tier card grid */}
      <div className="grid md:grid-cols-2 gap-5 md:gap-6">
        {/* Free */}
        <PricingCard tier="Free">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span
              className="font-serif text-6xl tabular-nums"
              style={{ color: "var(--color-paper)", fontWeight: 400 }}
            >
              $0
            </span>
          </div>
          <p
            className="text-sm mb-7"
            style={{ color: "var(--color-paper-mute)" }}
          >
            Enough to try everything.
          </p>
          <Link
            href="/playground"
            className="block w-full text-center py-3 rounded-full text-sm font-medium transition-all btn-outline"
            style={{
              border: "1px solid var(--color-rule-strong)",
              color: "var(--color-paper)",
            }}
          >
            Start free
          </Link>
          <FeatureList items={FREE_FEATURES} />
        </PricingCard>

        {/* Pro - most popular */}
        <PricingCard tier="Pro" popular>
          {/* Identity line: who Pro is for, before any number. */}
          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-paper-mute)" }}
          >
            For people who prompt every day.
          </p>
          {/* Anchor row: struck list price + saving chip, sitting above
              the big current price so the discount reads at a glance. */}
          {LAUNCH.active && (
            <div className="flex items-center gap-2.5 mb-1.5">
              <span
                className="font-serif text-xl tabular-nums line-through"
                style={{ color: "var(--color-paper-mute)", fontWeight: 400 }}
                aria-label={`Was $${listPrice} per month`}
              >
                ${listPrice}
              </span>
              <span
                className="inline-flex items-center text-[11px] tracking-[0.08em] uppercase font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(74, 176, 118, 0.12)",
                  color: "#5FBE8C",
                  border: "1px solid rgba(74, 176, 118, 0.28)",
                }}
              >
                Save {LAUNCH.percentOff}%
              </span>
            </div>
          )}
          <div className="flex items-baseline gap-1.5 mb-1">
            <span
              className="font-serif text-6xl tabular-nums"
              style={{ color: "var(--color-paper)", fontWeight: 400 }}
            >
              ${nowPrice}
            </span>
            <span
              className="text-sm"
              style={{ color: "var(--color-paper-mute)" }}
            >
              /month
            </span>
          </div>
          <p
            className="text-sm"
            style={{ color: "var(--color-paper-mute)" }}
          >
            {annual
              ? `Billed $${LAUNCH.active ? LAUNCH.yearly.billedTotal : "95.88"} yearly. Cancel anytime.`
              : "Billed monthly. Cancel anytime."}
          </p>
          {LAUNCH.active && (
            <p
              className="mt-1.5 mb-7 text-sm"
              style={{ color: "var(--color-accent-bright)" }}
            >
              Launch pricing - locked in for early adopters.
            </p>
          )}
          {!LAUNCH.active && <div className="mb-7" />}
          <Link
            href="/login"
            className="block w-full text-center py-3 rounded-full text-sm font-medium transition-all btn-paper"
            style={{
              background: "var(--color-paper)",
              color: "var(--color-ink)",
            }}
          >
            Get Pro
          </Link>
          <FeatureList items={PRO_FEATURES} accent />
          <p className="mt-6 text-xs" style={{ color: "var(--color-paper-mute)" }}>
            New to Deep Rewrite?{" "}
            <Link
              href="/blog/what-is-deep-rewrite"
              className="underline underline-offset-4 hover:opacity-80 transition-opacity"
              style={{ color: "var(--color-paper)" }}
            >
              Read how it works →
            </Link>
          </p>
        </PricingCard>
      </div>

      <p
        className="mt-8 text-xs text-center md:text-left"
        style={{ color: "var(--color-paper-mute)" }}
      >
        Payments by Paddle. VAT and sales tax handled automatically.
      </p>
    </div>
  );
}

/* ============================================================
   Card chrome
   ============================================================ */

function PricingCard({
  tier,
  popular,
  children,
}: {
  tier: string;
  popular?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`card-editorial p-8 md:p-9 relative ${popular ? "card-accent-edge" : ""}`}
    >
      <div className="flex items-center justify-between mb-7">
        <span
          className="text-sm font-medium"
          style={{
            color: popular
              ? "var(--color-accent-bright)"
              : "var(--color-paper)",
          }}
        >
          {tier}
        </span>
        {popular && (
          <span
            className="text-[10px] tracking-[0.14em] uppercase font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "var(--color-accent-soft)",
              color: "var(--color-accent-bright)",
              border: "1px solid rgba(91, 143, 237, 0.25)",
            }}
          >
            Most popular
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function BillingToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-4 md:px-5 py-2 rounded-full text-sm font-medium transition-colors"
      style={{
        background: active ? "var(--color-paper)" : "transparent",
        color: active ? "var(--color-ink)" : "var(--color-paper-mute)",
      }}
      role="tab"
      aria-selected={active}
    >
      {children}
    </button>
  );
}

function FeatureList({ items, accent }: { items: string[]; accent?: boolean }) {
  return (
    <ul className="mt-8 space-y-3.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 text-[14px] leading-[1.55]"
        >
          <span
            className="shrink-0 mt-0.5"
            style={{
              color: accent
                ? "var(--color-accent-bright)"
                : "var(--color-paper)",
            }}
            aria-hidden="true"
          >
            <Check />
          </span>
          <span style={{ color: "var(--color-paper-mute)" }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M2.5 7L5.5 10L11.5 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
