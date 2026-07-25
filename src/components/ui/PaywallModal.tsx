"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WaitlistModal } from "./WaitlistModal";
import { usePaddle } from "@/components/PaddleProvider";
import { REWRITE_FREE_LIMIT, REWRITE_WINDOW_HOURS } from "@/lib/limits";

const PADDLE_LIVE = process.env.NEXT_PUBLIC_PADDLE_LIVE === "true";

/**
 * Why the modal was opened - drives the headline + body copy so the
 * message actually matches what the user just did.
 *
 * NOTE: this component currently has no call sites. It is kept because the
 * paywall is needed again the moment an in-app upgrade prompt exists, but
 * nothing renders it today, so none of this copy is on screen.
 *
 * The "deep-rewrite" reason is gone with the feature. Nothing in the repo
 * sends deep:true since the playground was deleted, so the modal was offering
 * to sell an upgrade for something the buyer could not then use. It comes back
 * with the feature.
 */
type PaywallReason = "limit" | "upgrade";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  reason?: PaywallReason;
}

const COPY: Record<PaywallReason, { headline: string; body: (limit: number, hours: number) => string }> = {
  limit: {
    headline: "You've hit your limit.",
    body: (limit, hours) =>
      `You've used all ${limit} free improvements for now. Go Pro for unlimited improvements on a stronger model, or wait for your ${hours}-hour window to reset.`,
  },
  upgrade: {
    headline: "Go unlimited with Pro.",
    body: () =>
      "Unlimited improvements, a stronger model on every one, and full history kept forever.",
  },
};

/**
 * Pro feature bullets, in the same short-noun-phrase tone as the pricing
 * page (EditorialPricing PRO_FEATURES). Kept to the highest-value five so
 * the modal stays scannable.
 */
const PRO_FEATURES = [
  "Unlimited improvements",
  "A stronger model on every improve",
  "Weekly insights report",
  "Full history, kept forever",
  "Priority processing and support",
];

/**
 * Launch pricing - mirrors EditorialPricing's LAUNCH block. Display only;
 * the real charge comes from the Paddle price the checkout uses. Keep these
 * numbers in sync with src/components/marketing/EditorialPricing.tsx.
 */
const LAUNCH = {
  percentOff: 50,
  monthly: { list: "9.99", now: "4.99" },
  yearly: { list: "7.99", now: "3.99", billedTotal: "47.88" },
};

export function PaywallModal({ open, onClose, reason = "upgrade" }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"pro_monthly" | "pro_annual">("pro_monthly");
  const [showWaitlist, setShowWaitlist] = useState(false);
  const paddle = usePaddle();

  const annual = plan === "pro_annual";
  const period = annual ? LAUNCH.yearly : LAUNCH.monthly;
  const copy = COPY[reason];

  // Escape to close + lock body scroll while open, matching the other
  // overlays (hero demo, detector gate).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function handleUpgrade() {
    if (!PADDLE_LIVE) {
      setShowWaitlist(true);
      return;
    }
    if (!paddle) return;
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { transactionId?: string };
      if (data.transactionId) {
        paddle.Checkout.open({ transactionId: data.transactionId });
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  if (showWaitlist) {
    return (
      <WaitlistModal
        open={open}
        onClose={() => {
          setShowWaitlist(false);
          onClose();
        }}
      />
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Upgrade to Pro"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{
            background: "rgba(10,10,12,0.72)",
            backdropFilter: "blur(8px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl p-7 sm:p-9 overflow-y-auto"
            style={{
              background: "var(--color-ink)",
              border: "1px solid var(--color-rule-strong)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
              maxHeight: "92dvh",
            }}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 inline-flex items-center justify-center w-9 h-9 rounded-full transition-all opacity-60 hover:opacity-100"
              style={{
                border: "1px solid var(--color-rule-strong)",
                color: "var(--color-paper)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 2L12 12M12 2L2 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Header */}
            <p
              className="eyebrow mb-3"
              style={{ color: "var(--color-accent)" }}
            >
              Pro
            </p>
            <h2
              className="font-serif text-3xl sm:text-[2.25rem] leading-tight tracking-tight mb-3"
              style={{ color: "var(--color-paper)", fontWeight: 400 }}
            >
              {copy.headline}
            </h2>
            <p
              className="text-sm sm:text-[15px] leading-relaxed mb-7"
              style={{ color: "var(--color-paper-mute)" }}
            >
              {copy.body(REWRITE_FREE_LIMIT, REWRITE_WINDOW_HOURS)}
            </p>

            {/* Billing toggle */}
            <div
              className="inline-flex w-full p-1 rounded-full mb-6"
              style={{
                background: "var(--color-ink-card)",
                border: "1px solid var(--color-rule)",
              }}
              role="tablist"
              aria-label="Billing period"
            >
              <BillingToggle
                active={!annual}
                onClick={() => setPlan("pro_monthly")}
              >
                Monthly
              </BillingToggle>
              <BillingToggle
                active={annual}
                onClick={() => setPlan("pro_annual")}
              >
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

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span
                  className="font-serif text-lg tabular-nums line-through"
                  style={{ color: "var(--color-paper-mute)", fontWeight: 400 }}
                >
                  ${period.list}
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
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-serif text-5xl tabular-nums"
                  style={{ color: "var(--color-paper)", fontWeight: 400 }}
                >
                  ${period.now}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--color-paper-mute)" }}
                >
                  /month
                </span>
              </div>
              <p
                className="mt-1.5 text-sm"
                style={{ color: "var(--color-paper-mute)" }}
              >
                {annual
                  ? `Billed $${LAUNCH.yearly.billedTotal} yearly. Cancel anytime.`
                  : "Billed monthly. Cancel anytime."}
              </p>
            </div>

            {/* Features - pricing-page style */}
            <ul className="space-y-3 mb-7">
              {PRO_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3 text-[14px] leading-[1.55]"
                >
                  <span
                    className="shrink-0 mt-0.5"
                    style={{ color: "var(--color-accent-bright)" }}
                    aria-hidden
                  >
                    <Check />
                  </span>
                  <span style={{ color: "var(--color-paper-mute)" }}>{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="block w-full text-center py-3.5 rounded-full text-sm font-medium transition-all btn-paper disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "var(--color-paper)",
                color: "var(--color-ink)",
              }}
            >
              {loading ? "Redirecting…" : "Upgrade to Pro"}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 mt-1 text-sm transition-colors hover:text-[var(--color-paper)]"
              style={{ color: "var(--color-paper-mute)" }}
            >
              Not now
            </button>

            <p
              className="mt-2 text-xs text-center"
              style={{ color: "var(--color-paper-mute)" }}
            >
              Payments by Paddle. Tax handled automatically.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
      className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium transition-colors"
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
