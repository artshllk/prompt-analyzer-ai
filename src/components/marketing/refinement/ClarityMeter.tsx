"use client";

import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import type { Scenario } from "./scenarios";
import { atOrPast, type Phase } from "./useLoopPhase";

/**
 * Live clarity score and token counters. The count-up with an ease-out
 * tail (last digits land slowly) is the scroll-stopping mechanic, so
 * both numbers animate from real "before" values, not from zero.
 */
function Counter({
  from,
  to,
  active,
  staticFinal,
}: {
  from: number;
  to: number;
  active: boolean;
  staticFinal: boolean;
}) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (staticFinal || !active) return;
    const controls = animate(from, to, {
      duration: 1.3,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [active, from, to, staticFinal]);
  if (staticFinal) return <>{to}</>;
  return <>{active ? value : from}</>;
}

export function ClarityMeter({
  phase,
  scenario,
  staticFinal = false,
}: {
  phase: Phase;
  scenario: Scenario;
  staticFinal?: boolean;
}) {
  const scored = staticFinal || atOrPast(phase, "score");
  const fill = scored ? scenario.clarity.to : scenario.clarity.from;

  return (
    <div
      className="rounded-2xl px-5 py-4 flex items-center gap-5"
      style={{
        background: "var(--color-ink-card)",
        border: "1px solid var(--color-rule)",
      }}
    >
      <div className="flex-1">
        <div className="flex items-baseline justify-between mb-2">
          <span
            className="text-[10px] uppercase tracking-[0.14em]"
            style={{ color: "var(--color-paper-mute)" }}
          >
            Clarity
          </span>
          <span
            className="text-[15px] font-semibold tabular-nums"
            style={{
              color: scored ? "var(--color-accent-bright)" : "#D4A054",
              transition: "color 0.6s ease",
            }}
          >
            <Counter
              from={scenario.clarity.from}
              to={scenario.clarity.to}
              active={scored}
              staticFinal={staticFinal}
            />
          </span>
        </div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: "var(--color-rule)" }}
        >
          <motion.div
            className="h-full rounded-full origin-left"
            style={{ background: scored ? "var(--color-accent)" : "#D4A054" }}
            animate={{ scaleX: fill / 100 }}
            initial={false}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
      <div
        className="w-px self-stretch"
        style={{ background: "var(--color-rule)" }}
      />
      <div className="text-right">
        <div
          className="text-[10px] uppercase tracking-[0.14em] mb-1"
          style={{ color: "var(--color-paper-mute)" }}
        >
          Tokens
        </div>
        <div
          className="text-[15px] font-semibold tabular-nums"
          style={{ color: "var(--color-paper)" }}
        >
          <Counter
            from={scenario.tokens.from}
            to={scenario.tokens.to}
            active={scored}
            staticFinal={staticFinal}
          />
        </div>
      </div>
    </div>
  );
}
