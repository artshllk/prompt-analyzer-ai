"use client";

import { useEffect, useState } from "react";
import { UpgradeButton } from "@/components/ui/UpgradeButton";
import { Mark } from "@/components/marketing/SectionFrame";
import Link from "next/link";
import {
  FACTCHECK_FREE_LIMIT,
  PRO_FACTCHECK_LIMIT,
  DETECT_FREE_LIMIT,
  PRO_DETECT_LIMIT,
  IMPROVE_FREE_LIMIT,
  IMPROVE_PRO_LIMIT,
  HISTORY_FREE_DAYS,
} from "@/lib/limits";
import { ANON_FACTCHECK_MONTH } from "@/lib/rate-limit";

/**
 * The anonymous allowance, taken from the bucket the server actually applies
 * rather than typed out beside it. `capacity` is the number of runs the
 * bucket holds, which is the number a visitor gets in a day.
 */
const ANON_CHECKS_A_MONTH = ANON_FACTCHECK_MONTH.capacity;

/**
 * Pricing - two-tier card grid (Free + Pro) with a polished
 * "Most popular" treatment on Pro. The cards use card-editorial
 * for surface depth and card-accent-edge for the Pro accent ring.
 *
 * EVERY BULLET HERE MUST BE REACHABLE BY A USER TODAY. This list had drifted
 * badly enough to be selling three things nobody could get to:
 *
 *   - "5 prompt rewrites / 48h" came from REWRITE_FREE_LIMIT, which limits.ts
 *     marks @deprecated. The real limit is USAGE_DAILY_LIMIT: 10 a day.
 *   - "Deep Rewrite" had no client. Nothing sent deep:true, so no paying
 *     customer could ever run it. It has since been deleted outright rather
 *     than left parked, because a Pro tier is not allowed to list a feature
 *     that does not exist.
 *   - "Clarity score for every prompt" was an invented number, and it is gone
 *     from the product. The rewrite model was grading its own rewrite.
 *   - "Weekly insights report" was built on those same scores. Since the
 *     shipping path never wrote them, the email always said "+0 clarity".
 *
 * The detector is routed again, so it is a real bullet now rather than a
 * broken promise.
 *
 * The stronger-model bullet is new and it is real: MODELS.sharpenPro runs a
 * bigger model than MODELS.sharpen on every single improve (see models.ts).
 */

/**
 * THE TWO LISTS ARE READ SIDE BY SIDE, SO THEY HAVE TO PAIR LINE FOR LINE.
 *
 * The table broke once already by mixing units: Free at "10 a day" is 300 a
 * month against a Pro cap of 100 a month, so Pro was a third of Free. Accounts
 * are now both monthly and Pro is ten times Free on the line that matters.
 *
 * A feature that appears in Free and not in Pro reads as parity even when Pro
 * is better, so every Free line has a Pro line above it that beats it. The
 * anonymous trial is not a plan and is stated under the table, not inside the
 * Free column, where it made "2 a day" look like a Free limit.
 *
 * Every number here is enforced in limits.ts. None of it is aspirational.
 */
/**
 * The lead line, rendered on its own above "Also included".
 *
 * Source checking is the product now, so the table has to agree with the
 * homepage about that. A flat list of six made it one bullet among six.
 *
 * Split into number and unit because that is where the confusion lives: "10 a
 * month" and "10 a day" sat next to each other and read as the same thing at a
 * glance. The number carries the weight, the unit carries the muted colour.
 */
/**
 * EVERY NUMBER ON THIS PAGE IS READ FROM THE CONSTANT THE SERVER ENFORCES.
 *
 * This is the fifth time copy and server have disagreed, and the last one was
 * a day old: the anonymous limit went from 2 to 5 in rate-limit.ts and this
 * file went on saying 2. Interpolating removes the class of bug rather than
 * fixing another instance of it, and pricing-copy.test.ts fails if a literal
 * ever creeps back in.
 *
 * The one number NOT read from a constant is the anonymous allowance, because
 * ANON_FACTCHECK_MONTH is a token bucket rather than a plain integer. Its test
 * reads the bucket's capacity out of the source instead.
 */
const FREE_LEAD = { n: String(FACTCHECK_FREE_LIMIT), unit: "source checks a month" };
const PRO_LEAD = { n: String(PRO_FACTCHECK_LIMIT), unit: "source checks a month" };

const FREE_FEATURES = [
  `${IMPROVE_FREE_LIMIT} prompt improvements a month`,
  `${DETECT_FREE_LIMIT} AI text detections a month`,
  `${HISTORY_FREE_DAYS} days of history`,
];

const PRO_FEATURES = [
  // NOTHING HERE IS UNLIMITED ANY MORE. Improvements said "Unlimited" on the
  // belief that they cost about a cent; measured over three real runs a Pro
  // one is $0.0198, and no code enforced the promise - getUsage returned no
  // limit for pro on both the analyze and sharpen routes. Detections had the
  // same shape. Both are numbers now and both are enforced.
  `${IMPROVE_PRO_LIMIT} prompt improvements a month`,
  `${PRO_DETECT_LIMIT} AI text detections a month`,
  "History kept forever",
  "A stronger model on every improve",
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
/**
 * The founding offer. Prices are strings here and cents in paddle.ts, and
 * pricing-copy.test.ts asserts they agree, because the dashboard is what
 * actually charges the card and this is only what a person reads.
 *
 * `now` is the founding price and `list` is what everyone after the first
 * fifty pays. It is a locked price rather than a discount that expires: a
 * separate Paddle price id, so a subscription created against it keeps
 * billing against it when the list price moves.
 */
const LAUNCH = {
  active: true,
  /** Headline percent off, shown in the badge and saving chip. */
  percentOff: 37,
  /** Monthly list price -> founding price. */
  monthly: { list: "19", now: "12" },
  /** Yearly per-month list price -> founding price, plus the billed total. */
  yearly: { list: "15.83", now: "15.83", billedTotal: "190" },
};

/**
 * FOUR STATES, AND EVERY ONE OF THEM GETS A USEFUL ACTION.
 *
 * This component knew nothing about who was looking. Both buttons rendered for
 * everyone, so "Get Pro" linked to /login, and the proxy bounces a signed-in
 * visitor off /login straight back to /check. That made the button dead for
 * Pro users AND for signed-in free users, who are the people most likely to
 * press it.
 *
 * The badge marks the card you are on, and that card's button becomes the next
 * thing you could want rather than disappearing. A disabled button does not
 * say why it is dead and leaves you stuck.
 *
 *   anon   Free "Start free" -> sign up      Pro "Get Pro" -> sign up, then here
 *   free   Free badge, no button             Pro "Get Pro" -> checkout
 *   pro    Free nothing at all               Pro badge + "Manage subscription"
 *
 * On `pro`, the Free card gets no badge and no button: you cannot "get" the
 * free plan while paying for Pro, and a badge there would say you are on it.
 */
export function EditorialPricing({
  headingLevel = "h2",
  foundingLeft,
}: {
  /** "h1" on the standalone /pricing page (its top-level heading); "h2" when embedded as a section. */
  headingLevel?: "h1" | "h2";
  /**
   * Founding seats still available, counted at Paddle by the server.
   *
   * THE PRICE SHOWN AND THE PRICE CHARGED MUST BE THE SAME ONE. Without this
   * the page advertised $12 and checkout would have created a $19
   * transaction, which is the copy-versus-server bug in its most expensive
   * form. Undefined means we could not count, and the honest response to that
   * is to show the ordinary price.
   */
  foundingLeft?: number;
}) {
  const [annual, setAnnual] = useState(false);

  /**
   * WHO IS LOOKING, FETCHED HERE RATHER THAN PASSED IN. viewerPlan() reads
   * cookies, so calling it during the server render opted /pricing out of
   * static rendering, which also meant the Paddle count next to it ran on
   * every request. See /api/billing/plan.
   *
   * `anon` until it answers. That is the fallback viewerPlan() already uses
   * on any error, and it is the safe direction: a sign-up button shown to
   * someone signed in is a wrong link, while guessing `pro` would hide the
   * way to buy from a paying customer.
   *
   * The PRICE is not fetched here. It comes from foundingLeft on the server,
   * so the number never moves under the reader after paint.
   */
  const [plan, setPlan] = useState<"anon" | "free" | "pro">("anon");
  const [renewsOn, setRenewsOn] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/plan")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setPlan(d.plan);
        setRenewsOn(d.renewsOn);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const Heading = headingLevel;

  /**
   * The founding offer is live only while there are seats AND we are looking
   * at a monthly subscription. There is no founding annual price, so the
   * yearly toggle always shows the list price rather than pretending.
   */
  const founding = LAUNCH.active && !annual && (foundingLeft ?? 0) > 0;
  const period = annual ? LAUNCH.yearly : LAUNCH.monthly;
  const listPrice = period.list;
  const nowPrice = founding ? period.now : period.list;
  // The plan key sent to checkout. It has to be the plan whose price is on
  // screen, or the customer is charged something they did not read.
  const checkoutPlan = annual ? "pro_annual" : founding ? "pro_founding" : "pro_monthly";

  return (
    <div>
      {/* Section header - left-aligned in the manuscript measure: heading,
          then the billing toggle directly below it. */}
      <div className="flex flex-col items-start text-left mb-10 md:mb-12">
        <Heading
          className="display text-3xl md:text-[38px] md:leading-[46px]"
          style={{ color: "var(--color-paper)" }}
        >
          Free to start. <Mark>Pay when you need more.</Mark>
        </Heading>
        <p
          className="mt-4 text-lg leading-relaxed"
          style={{ color: "var(--ink-soft)" }}
        >
          No card to try it. Cancel any time.
        </p>

        {/* Billing toggle */}
        <div
          className="inline-flex p-1 rounded mt-8"
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

      {/*
        TWO CARDS, CAPPED AT 900px.

        They were filling the 1180px container, which put roughly 560px of
        card behind about 300px of content and made a five-line feature list
        look like a landing page of its own. Every pricing table worth copying
        keeps a two-tier grid near 900: the eye has to compare two columns, and
        comparison gets harder the further apart they sit.
      */}
      <div className="grid md:grid-cols-2 gap-5 md:gap-6 max-w-[900px] mx-auto">
        {/* Free */}
        <PricingCard tier="Free" chip="Tier 0">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span
              className="font-serif text-[44px] leading-none tabular-nums"
              style={{ color: "var(--color-paper)", fontWeight: 500 }}
            >
              $0
            </span>
          </div>
          <p
            className="text-sm mb-5"
            style={{ color: "var(--color-paper-mute)" }}
          >
            Enough to see if it helps.
          </p>
          {plan === "anon" && (
            <Link
              href="/login?signup=1"
              className="block w-full text-center py-3 rounded text-sm font-medium transition-all btn-outline"
              style={{
                border: "1px solid var(--color-rule-strong)",
                color: "var(--color-paper)",
              }}
            >
              Start free
            </Link>
          )}
          {plan === "free" && <PlanBadge />}
          {/* plan === "pro": nothing. You cannot get the free plan while
              paying for Pro, and a badge here would say you are on it. */}
          <LeadFeature n={FREE_LEAD.n} unit={FREE_LEAD.unit} />
          <AlsoIncluded />
          <FeatureList items={FREE_FEATURES} />
        </PricingCard>

        {/* Pro - most popular */}
        <PricingCard tier="Pro" popular>
          {/* Identity line: who Pro is for, before any number. */}
          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-paper-mute)" }}
          >
            For people who publish every day.
          </p>
          {/* Anchor row: struck list price + saving chip, sitting above
              the big current price so the discount reads at a glance. */}
          {founding && (
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
                  background: "var(--color-accent-soft)",
                  color: "var(--brand-text)",
                }}
              >
                Save {LAUNCH.percentOff}%
              </span>
            </div>
          )}
          <div className="flex items-baseline gap-1.5 mb-1">
            <span
              className="font-serif text-[44px] leading-none tabular-nums"
              style={{ color: "var(--color-paper)", fontWeight: 500 }}
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
              ? `Billed $${LAUNCH.yearly.billedTotal} yearly. Cancel anytime.`
              : "Billed monthly. Cancel anytime."}
          </p>
          {founding && (
            <div className="mt-2.5 mb-5">
              {/* A chip, because it is a condition on the price above it and
                  not another sentence of prose. The count is Paddle's, read at
                  request time, so it cannot advertise places that are sold. */}
              <span
                className="inline-flex items-center gap-2 text-[11px] px-2.5 py-1 rounded-[3px]"
                style={{
                  background: "var(--color-accent-soft)",
                  color: "var(--color-accent-bright)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {foundingLeft === 1
                  ? "Founding price, 1 place left. It never rises."
                  : `Founding price, ${foundingLeft} places left. It never rises.`}
              </span>
            </div>
          )}
          {!founding && <div className="mb-5" />}
          {plan === "anon" && (
            <Link
              /* Comes back here after signing up, so the next click is
                 checkout rather than a hunt for the page they were on. */
              href="/login?signup=1&redirectTo=%2Fpricing"
              className="block w-full text-center py-3 rounded text-sm font-medium transition-all btn-paper"
              style={{
                background: "var(--action)",
                color: "#fff",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.15), 0 1px 2px rgba(24,24,27,0.08)",
              }}
            >
              Get Pro
            </Link>
          )}
          {plan === "free" && (
            <UpgradeButton
              plan={checkoutPlan}
              className="block w-full text-center py-3 rounded text-sm font-medium transition-all btn-paper bg-[var(--action)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.15),0_1px_2px_rgba(24,24,27,0.08)]"
            >
              Get Pro
            </UpgradeButton>
          )}
          {plan === "pro" && (
            <>
              <PlanBadge renewsOn={renewsOn} />
              {/*
                A LINK TO SETTINGS, NOT A CALL TO THE BILLING API.

                This used to open the Paddle portal directly from the pricing
                table, which put the portal's failures on a marketing page. An
                account that is Pro without a paid subscription got told so
                here, in a card, with no way onward: a dead end in the last
                place anyone would look for billing.

                Settings is where billing lives and it always renders. One hop
                each way, and every step reachable.
              */}
              <Link
                href="/settings"
                className="mt-3 block w-full text-center py-3 rounded-full text-sm font-medium transition-all btn-outline"
                style={{
                  border: "1px solid var(--color-rule-strong)",
                  color: "var(--color-paper)",
                }}
              >
                Manage in settings
              </Link>
            </>
          )}
          <LeadFeature n={PRO_LEAD.n} unit={PRO_LEAD.unit} accent />
          <AlsoIncluded />
          <FeatureList items={PRO_FEATURES} accent />
        </PricingCard>
      </div>

      {/* The trial belongs here, not in the Free column. Inside it, "2 a day"
          read as a Free limit and made the plan look worse than it is. */}
      <p
        className="mt-8 max-w-[900px] mx-auto text-sm"
        style={{ color: "var(--ink-soft)" }}
      >
        No account? You can run {ANON_CHECKS_A_MONTH} checks a month without one.
      </p>

      <p
        className="mt-2 max-w-[900px] mx-auto text-xs"
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
  chip,
  popular,
  children,
}: {
  tier: string;
  /** A small mono label in the header. Free carries its position in the
   *  ladder; Pro carries the badge on the border instead. */
  chip?: string;
  popular?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`card-editorial p-6 md:p-7 relative ${popular ? "card-accent-edge" : ""}`}
    >
      {/*
        SITS ON THE BORDER, not inside the card.

        Inline in the header row it read as one more label among the tier name
        and the price, which is the one thing a "most popular" mark must not
        do: its whole job is to be noticed before the card is read. Straddling
        the top edge takes it out of the reading order and puts it on the
        frame, which is where a tab belongs.
      */}
      {popular && (
        <span
          /* z-10 because card-accent-edge draws its ring in an ::after, which
             comes after this in paint order and was drawing the top edge
             straight through the word. */
          className="absolute -top-2.5 left-6 md:left-7 z-10 inline-flex items-center text-[10px] tracking-[0.14em] uppercase font-semibold px-2.5 py-1 rounded-[3px]"
          style={{
            background: "var(--color-accent)",
            /* White, not paper. CLAUDE.md measures white on #C9452F at 4.80:1;
               the warmer paper tone is below that, and this is 10px text. */
            color: "var(--card)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Most popular
        </span>
      )}
      <div className="flex items-center justify-between mb-5">
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
        {chip && (
          <span
            className="text-[10px] tracking-[0.14em] uppercase px-2.5 py-1 rounded-[3px]"
            style={{
              background: "transparent",
              color: "var(--color-paper-mute)",
              border: "1px solid var(--color-rule)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {chip}
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
      className="inline-flex items-center px-4 md:px-5 py-2 rounded text-sm font-medium transition-colors"
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

/**
 * The headline allowance, alone, with real space under it.
 *
 * Number bold and full-strength, unit muted and lighter, because "10 a month"
 * and "10 a day" have to read differently at a glance and the unit is the part
 * that distinguishes them.
 */
function LeadFeature({ n, unit, accent }: { n: string; unit: string; accent?: boolean }) {
  return (
    <div className="mt-6 pb-5" style={{ borderBottom: "1px solid var(--rule)" }}>
      <div className="flex items-baseline gap-2.5">
        {/* Mono, and big. A number somebody can check by hand is set in mono
            everywhere on this site, and this is the number the two plans are
            actually compared on. */}
        <span
          className="text-[32px] tabular-nums leading-none"
          style={{
            color: accent ? "var(--color-accent-bright)" : "var(--ink)",
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
          }}
        >
          {n}
        </span>
        <span className="text-[15px]" style={{ color: "var(--ink-soft)" }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

/**
 * Marks the card the person is on.
 *
 * It replaces the button rather than sitting beside it, because on the card
 * you are already on there is nothing to buy, and a badge next to a live
 * button asks you to work out which one applies to you.
 *
 * The renewal date comes from profiles.subscription_period_end, which the
 * webhook already keeps up to date, so it costs no extra read.
 */
function PlanBadge({ renewsOn }: { renewsOn?: string | null }) {
  let renews: string | null = null
  if (renewsOn) {
    const d = new Date(renewsOn)
    if (!Number.isNaN(d.getTime())) {
      renews = d.toLocaleDateString("en-GB", { day: "numeric", month: "long" })
    }
  }
  return (
    <div
      className="w-full text-center py-3 rounded-full text-sm font-medium"
      style={{
        border: "1px solid var(--color-rule-strong)",
        color: "var(--color-paper-mute)",
      }}
    >
      Your plan
      {renews && (
        <span className="block text-[12px] mt-0.5" style={{ color: "var(--color-paper-mute)" }}>
          Renews {renews}
        </span>
      )}
    </div>
  );
}

/** Quiet, so it separates without competing with the number above it. */
function AlsoIncluded() {
  return (
    <p
      className="mt-5 text-[11px] uppercase tracking-[0.14em]"
      style={{ color: "var(--ink-soft)" }}
    >
      Also included
    </p>
  );
}

function FeatureList({ items, accent }: { items: string[]; accent?: boolean }) {
  return (
    <ul className="mt-4 space-y-3">
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
