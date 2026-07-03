"use client";

import { REWRITE_WINDOW_HOURS } from "@/lib/limits";

/**
 * Always-on free-credits meter for signed-in free users.
 *
 * A depleting battery of pips makes the scarcity tangible (you SEE a
 * credit go dark each time you spend one), and the remaining number stays
 * in view so "running low" registers before the hard wall. Bare row - no
 * card - so it reads as a quiet status line, not an ad.
 */
export function FreeCreditsMeter({
  used,
  limit,
  onUpgrade,
}: {
  used: number;
  limit: number;
  onUpgrade: () => void;
}) {
  const remaining = Math.max(0, limit - used);
  const low = remaining <= 1;
  const out = remaining === 0;
  const accent = out
    ? "#C25E5E"
    : low
      ? "var(--color-accent)"
      : "var(--color-paper)";

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex items-center gap-1.5" aria-hidden>
          {Array.from({ length: limit }).map((_, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full transition-colors duration-500"
              style={{
                background: i < remaining ? accent : "var(--color-rule-strong)",
              }}
            />
          ))}
        </div>
        <p className="text-sm" style={{ color: "var(--color-paper-mute)" }}>
          <span style={{ color: accent, fontWeight: 500 }}>{remaining}</span> of{" "}
          {limit} free rewrites left
          <span className="mx-2" style={{ color: "var(--color-rule-strong)" }}>
            ·
          </span>
        </p>
      </div>

      <button
        onClick={onUpgrade}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all btn-paper"
        style={{
          background: "var(--color-paper)",
          color: "var(--color-ink)",
          fontWeight: 500,
        }}
      >
        Go unlimited
        <span className="text-xs opacity-70">$4.99/mo</span>
      </button>
    </div>
  );
}
