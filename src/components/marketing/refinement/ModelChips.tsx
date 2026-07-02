"use client";

import { motion } from "framer-motion";
import { atOrPast, type Phase } from "./useLoopPhase";

const MODELS = ["ChatGPT", "Claude", "Gemini"];

/**
 * "Works everywhere" payoff. The three model chips light up in
 * sequence once the refined prompt settles.
 */
export function ModelChips({
  phase,
  staticFinal = false,
  onHoverModel,
}: {
  phase: Phase;
  staticFinal?: boolean;
  onHoverModel?: (model: string | null) => void;
}) {
  const lit = staticFinal || atOrPast(phase, "settle");

  return (
    <div className="flex items-center justify-center gap-2">
      {MODELS.map((model, i) => (
        <motion.button
          key={model}
          type="button"
          tabIndex={0}
          onMouseEnter={() => onHoverModel?.(model)}
          onMouseLeave={() => onHoverModel?.(null)}
          onFocus={() => onHoverModel?.(model)}
          onBlur={() => onHoverModel?.(null)}
          animate={{ opacity: lit ? 1 : 0.35 }}
          transition={{ delay: staticFinal ? 0 : i * 0.18, duration: 0.4 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium cursor-default"
          style={{
            border: "1px solid var(--color-rule-strong)",
            color: "var(--color-paper)",
            background: "var(--color-ink-card)",
          }}
          aria-label={`Works with ${model}`}
        >
          <motion.span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--color-accent)" }}
            animate={{ scale: lit ? [1, 1.5, 1] : 1 }}
            transition={{ delay: staticFinal ? 0 : i * 0.18, duration: 0.5 }}
            aria-hidden="true"
          />
          {model}
        </motion.button>
      ))}
    </div>
  );
}
