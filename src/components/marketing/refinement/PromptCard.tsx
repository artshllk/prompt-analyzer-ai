"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { roughText, type Scenario } from "./scenarios";
import { atOrPast, type Phase } from "./useLoopPhase";

/**
 * The prompt itself. Types in rough, then rewrites in place: each swap
 * segment blurs in its refined phrasing on a stagger while the text
 * reflows, which reads as "being rewritten" rather than replaced.
 */
export function PromptCard({
  phase,
  scenario,
  staticFinal = false,
  headerOverride,
}: {
  phase: Phase;
  scenario: Scenario;
  staticFinal?: boolean;
  headerOverride?: string | null;
}) {
  const rough = roughText(scenario);
  const typing = phase === "typing";
  const rewriting = atOrPast(phase, "rewrite");
  const settled = atOrPast(phase, "settle");

  // Character-by-character reveal during the typing phase. One text
  // node, updated string; no per-character DOM. `chars` and `swapped`
  // are reset during render when the scenario changes (the React
  // "derived state" pattern) so effects never set state synchronously.
  const [chars, setChars] = useState(0);
  const [swapped, setSwapped] = useState(0);
  const [lastScenarioId, setLastScenarioId] = useState(scenario.id);
  if (lastScenarioId !== scenario.id) {
    setLastScenarioId(scenario.id);
    setChars(0);
    setSwapped(0);
  }

  useEffect(() => {
    if (staticFinal || !typing) return;
    const interval = window.setInterval(() => {
      setChars((c) => {
        if (c >= rough.length) {
          window.clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, 26);
    return () => window.clearInterval(interval);
  }, [typing, rough, staticFinal]);

  // Stagger the swaps during the rewrite phase.
  const swapCount = scenario.segments.filter((s) => s.type === "swap").length;
  useEffect(() => {
    if (staticFinal || !rewriting) return;
    const timers: number[] = [];
    for (let i = 1; i <= swapCount; i++) {
      timers.push(window.setTimeout(() => setSwapped(i), i * 320));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [rewriting, swapCount, scenario, staticFinal]);

  const showRefined = staticFinal || rewriting;

  return (
    <motion.div
      className="relative rounded-2xl px-5 py-4"
      style={{
        background: "var(--color-ink-card-elevated)",
        border: "1px solid var(--color-rule-strong)",
        boxShadow: settled || staticFinal
          ? "0 24px 60px -20px rgba(0,0,0,0.7), 0 0 40px -8px var(--color-accent-glow)"
          : "0 24px 60px -20px rgba(0,0,0,0.7)",
        transition: "box-shadow 0.8s ease",
      }}
    >
      <div
        className="text-[10px] uppercase tracking-[0.14em] mb-2"
        style={{
          color: headerOverride
            ? "var(--color-accent-bright)"
            : "var(--color-paper-mute)",
          transition: "color 0.3s ease",
        }}
      >
        {headerOverride ?? "Your prompt"}
      </div>
      <p
        className="text-[14px] leading-relaxed min-h-18"
        style={{ color: "var(--color-paper)" }}
      >
        {!showRefined ? (
          <>
            {typing ? rough.slice(0, chars) : rough}
            {typing && (
              <motion.span
                className="inline-block w-0.5 h-[1em] align-middle ml-px"
                style={{ background: "var(--color-accent)" }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
            )}
          </>
        ) : (
          scenario.segments.map((seg, i) => {
            if (seg.type === "keep") return <span key={i}>{seg.text}</span>;
            const swapIndex = scenario.segments
              .slice(0, i)
              .filter((s) => s.type === "swap").length;
            const done = staticFinal || swapped > swapIndex;
            return (
              <motion.span
                key={`${i}-${done ? "refined" : "rough"}`}
                initial={
                  done && !staticFinal
                    ? { opacity: 0, filter: "blur(4px)", y: 2 }
                    : false
                }
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="inline"
                style={{
                  color:
                    done && !settled && !staticFinal
                      ? "var(--color-accent-bright)"
                      : "var(--color-paper)",
                  transition: "color 1s ease",
                }}
              >
                {done ? seg.refined : seg.rough}
              </motion.span>
            );
          })
        )}
      </p>
    </motion.div>
  );
}
