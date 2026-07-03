"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { refinedText, roughText } from "./scenarios";
import { useLoopPhase } from "./useLoopPhase";
import { PromptCard } from "./PromptCard";
import { QuestionCard } from "./QuestionCard";
import { ClarityMeter } from "./ClarityMeter";
import { ModelChips } from "./ModelChips";

/**
 * Hero visual: "The Refinement". A self-playing loop showing the
 * product happening - rough prompt in, one smart question, refined
 * prompt out, clarity up, tokens down - instead of a diagram about it.
 *
 * - Timeline lives in useLoopPhase; everything here is declarative.
 * - Hover slows the loop to 30% and reveals annotation labels.
 * - Click advances to the next scenario ("this is real, poke it").
 * - Cursor parallax adds shallow depth; transform/opacity/filter only.
 * - Reduced motion collapses to a static before/after with final numbers.
 */
export function HeroRefinement() {
  const reduce = useReducedMotion() ?? false;
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { amount: 0.3 });
  const [hovered, setHovered] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  const { phase, scenario, advance } = useLoopPhase(!reduce && inView, hovered);

  // Cursor parallax: spring-damped, a few px of translate and ~1.5deg
  // of tilt. Cheap and instantly dimensional.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [1.5, -1.5]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-1.5, 1.5]);
  const glowX = useTransform(sx, [-0.5, 0.5], ["42%", "58%"]);
  const dotsX = useTransform(sx, (v) => v * -10);
  const dotsY = useTransform(sy, (v) => v * -10);
  const amberGlow = useTransform(
    glowX,
    (x) =>
      `radial-gradient(60% 55% at ${x} 50%, rgba(212,160,84,0.12), transparent 70%)`,
  );
  const accentGlow = useTransform(
    glowX,
    (x) =>
      `radial-gradient(60% 55% at ${x} 50%, var(--color-accent-glow), transparent 70%)`,
  );
  const glowSettled =
    reduce || phase === "score" || phase === "settle" || phase === "dissolve";

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduce) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const srDescription = `Example of Deepclario refining a prompt. Before: "${roughText(
    scenario,
  )}" with clarity ${scenario.clarity.from} and ${scenario.tokens.from} tokens. Deepclario asks: "${
    scenario.question
  }" After: "${refinedText(scenario)}" with clarity ${scenario.clarity.to} and ${
    scenario.tokens.to
  } tokens. Works with ChatGPT, Claude, and Gemini.`;

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Deepclario prompt refinement demo"
      className="relative w-full max-w-110 mx-auto select-none"
      style={{ perspective: 1000 }}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
        setHovered(false);
      }}
      onPointerEnter={() => setHovered(true)}
      onClick={advance}
    >
      <span className="sr-only">{srDescription}</span>

      {/* Ambient glow that shifts from amber (rough) to accent blue
          (refined), so the background reflects the prompt's state.
          Two layers crossfading; each follows the cursor via glowX. */}
      <motion.div
        aria-hidden="true"
        className="absolute -inset-8 pointer-events-none"
        style={{ background: amberGlow, filter: "blur(24px)" }}
        animate={{ opacity: glowSettled ? 0 : 0.85 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -inset-8 pointer-events-none"
        style={{ background: accentGlow, filter: "blur(24px)" }}
        animate={
          glowSettled
            ? reduce
              ? { opacity: 0.85 }
              : { opacity: [0.7, 1, 0.7] }
            : { opacity: 0 }
        }
        transition={
          glowSettled && !reduce
            ? { duration: 7, repeat: Infinity, ease: "easeInOut" }
            : { duration: 1.2, ease: "easeInOut" }
        }
      />

      {/* Sparse depth field - two drifting dot layers on parallax. */}
      {!reduce && (
        <motion.svg
          aria-hidden="true"
          className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ x: dotsX, y: dotsY }}
        >
          {[
            { x: 6, y: 14, r: 0.4 },
            { x: 92, y: 10, r: 0.5 },
            { x: 88, y: 78, r: 0.35 },
            { x: 10, y: 86, r: 0.5 },
            { x: 50, y: 4, r: 0.3 },
            { x: 96, y: 45, r: 0.35 },
            { x: 3, y: 52, r: 0.3 },
          ].map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill="var(--color-accent)"
              animate={{ opacity: [0.15, 0.45, 0.15] }}
              transition={{
                duration: 8 + i * 1.3,
                delay: i * 0.7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.svg>
      )}

      {/* The scene. Tilts with the cursor; dissolves between scenarios. */}
      <motion.div
        style={
          reduce
            ? undefined
            : { rotateX, rotateY, transformStyle: "preserve-3d" }
        }
        className="relative"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={scenario.id}
            initial={reduce ? false : { opacity: 0, filter: "blur(6px)" }}
            animate={{
              opacity: phase === "dissolve" ? 0 : 1,
              filter: phase === "dissolve" ? "blur(6px)" : "blur(0px)",
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="flex flex-col gap-3"
          >
            <PromptCard
              phase={phase}
              scenario={scenario}
              staticFinal={reduce}
              headerOverride={
                hoveredModel ? `Optimized for ${hoveredModel}` : null
              }
            />
            <QuestionCard
              phase={phase}
              scenario={scenario}
              staticFinal={reduce}
            />
            <ClarityMeter
              phase={phase}
              scenario={scenario}
              staticFinal={reduce}
            />
            <ModelChips
              phase={phase}
              staticFinal={reduce}
              onHoverModel={setHoveredModel}
            />
          </motion.div>
        </AnimatePresence>

        {/* Hover annotations - convert curiosity into comprehension. */}
        <AnimatePresence>
          {hovered && !reduce && (
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 pointer-events-none"
            >
              <Annotation className="-top-6 left-1">
                Rewritten as you watch
              </Annotation>
              <Annotation className="top-[34.7%] -right-2">
                One smart question
              </Annotation>
              <Annotation className="-bottom-6 left-1">
                Scored live · fewer tokens, same intent
              </Annotation>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Annotation({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`absolute text-[10px] uppercase tracking-[0.14em] whitespace-nowrap ${className}`}
      style={{ color: "var(--color-accent-bright)" }}
    >
      {children}
    </span>
  );
}
