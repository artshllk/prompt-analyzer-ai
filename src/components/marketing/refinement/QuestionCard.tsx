"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Scenario } from "./scenarios";
import { atOrPast, type Phase } from "./useLoopPhase";

/**
 * Deepclario's one smart question - the emotional peak of the loop.
 * Slides in offset from the prompt card with the D mark as the actor;
 * a ghost cursor then highlights the picked option.
 */
export function QuestionCard({
  phase,
  scenario,
  staticFinal = false,
}: {
  phase: Phase;
  scenario: Scenario;
  staticFinal?: boolean;
}) {
  const visible = staticFinal || (atOrPast(phase, "question") && phase !== "dissolve");
  const answered = staticFinal || atOrPast(phase, "answer");
  const receded = !staticFinal && atOrPast(phase, "rewrite");

  return (
    <div className="relative min-h-[92px]">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={scenario.id}
            initial={staticFinal ? false : { opacity: 0, x: 24, scale: 0.96 }}
            animate={{
              opacity: receded ? 0.55 : 1,
              x: 0,
              scale: receded ? 0.97 : 1,
            }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.3 } }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="ml-6 rounded-2xl px-4 py-3 flex gap-3"
            style={{
              background: "var(--color-ink-card)",
              border: "1px solid var(--color-rule)",
              boxShadow: "0 18px 44px -18px rgba(0,0,0,0.7)",
            }}
          >
            <div
              className="shrink-0 w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center"
              style={{ background: "var(--color-paper)" }}
            >
              <Image
                src="/logo.png"
                alt=""
                width={40}
                height={40}
                className="w-[78%] h-[78%] object-contain"
              />
            </div>
            <div>
              <p
                className="text-[13px] leading-snug"
                style={{ color: "var(--color-paper)" }}
              >
                {scenario.question}
              </p>
              <div className="mt-2 flex gap-2">
                {scenario.options.map((opt, i) => {
                  const picked = answered && i === scenario.answerIndex;
                  return (
                    <span
                      key={opt}
                      className="text-[11px] px-2.5 py-1 rounded-full"
                      style={{
                        border: `1px solid ${
                          picked ? "var(--color-accent)" : "var(--color-rule-strong)"
                        }`,
                        background: picked
                          ? "var(--color-accent-soft)"
                          : "transparent",
                        color: picked
                          ? "var(--color-accent-bright)"
                          : "var(--color-paper-mute)",
                        transition:
                          "border-color 0.4s ease, background 0.4s ease, color 0.4s ease",
                      }}
                    >
                      {opt}
                    </span>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
