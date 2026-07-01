"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Hero centerpiece visual.
 *
 * 2D-only refresh - no three.js, no glassy 3D. Adds quiet depth via:
 *   - drifting background particles (SVG dots)
 *   - a slowly-rotating outer dashed ring
 *   - three concentric rings around the logo
 *   - per-chip parallax drift (x and y, unique phase)
 *   - subtle pulsing accent glow under the logo card
 *
 * Six capability chips, evenly distributed around the circle. Each
 * names a real product behaviour, including the new live token counter.
 */

type Chip = {
  label: string;
  // Position as percent of the container, anchored to its centre.
  x: number;
  y: number;
};

// Six product chips laid out on a TRUE circle (radius 46 from centre, at
// 60° steps) so they sit cleanly on the outer orbit ring instead of the
// old hand-picked coordinates that drifted off it. Clockwise from top.
// The two widest labels take the top/bottom slots (x = 50), where centred
// text reads symmetrically; the shorter labels take the four diagonals.
const CHIPS: Chip[] = [
  { label: "ChatGPT · Claude · Gemini", x: 50, y: 4 }, // top
  { label: "Clarity 22 → 87", x: 78, y: 27 }, // top-right
  { label: "Prompt improvement", x: 80, y: 60 }, // bottom-right
  { label: "Improve prompts right in your browser", x: 50, y: 90 }, // bottom
  { label: "Tokens 412 → 268", x: 6, y: 78 }, // bottom-left
  { label: "Asks one smart question", x: 0, y: 12 },
  { label: "Ai detector", x: 0, y: 50 }, // top-left
  // top-left
];

// Drifting background particles. Hand-picked positions so the
// distribution feels intentional, not random. Each value is a
// percent of the container.
const PARTICLES = [
  { x: 8, y: 12, size: 1.5, dur: 9, delay: 0 },
  { x: 92, y: 8, size: 2, dur: 11, delay: 1.2 },
  { x: 70, y: 4, size: 1, dur: 8, delay: 2.4 },
  { x: 22, y: 6, size: 1, dur: 10, delay: 0.8 },
  { x: 96, y: 55, size: 1.5, dur: 12, delay: 1.6 },
  { x: 4, y: 60, size: 1, dur: 9.5, delay: 0.4 },
  { x: 12, y: 92, size: 1.5, dur: 11, delay: 2 },
  { x: 88, y: 95, size: 1, dur: 10, delay: 0.6 },
  { x: 60, y: 90, size: 1, dur: 8.5, delay: 1.4 },
  { x: 36, y: 96, size: 1.5, dur: 12, delay: 2.2 },
  { x: 80, y: 35, size: 1, dur: 9.2, delay: 0.2 },
  { x: 20, y: 40, size: 1, dur: 10.5, delay: 1.8 },
];

export function HeroCenterpiece() {
  const reduce = useReducedMotion();

  return (
    <div
      className="relative w-full aspect-square max-w-[560px] mx-auto"
      aria-hidden="true"
    >
      {/* Particle field - soft drifting dots in the background.
          SVG so it scales crisply, low opacity so it never competes
          with the logo or chips. */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {PARTICLES.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.size / 4}
            fill="var(--color-accent)"
            fillOpacity={0.32}
            initial={reduce ? false : { y: 0, opacity: 0 }}
            animate={
              reduce
                ? { opacity: 0.32 }
                : { y: [-1, 1, -1], opacity: [0.2, 0.5, 0.2] }
            }
            transition={{
              duration: p.dur,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>

      {/* Pulsing accent glow under the logo. */}
      <motion.div
        className="absolute inset-[12%]"
        style={{
          background:
            "radial-gradient(circle at center, var(--color-accent-glow), transparent 65%)",
          filter: "blur(20px)",
        }}
        animate={reduce ? undefined : { opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Rotating outer dashed ring - slow enough to be sensed, not seen. */}
      <motion.div
        className="absolute inset-[4%] rounded-full"
        style={{ border: "1px dashed var(--color-rule)" }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      />

      {/* Middle solid ring */}
      <div
        className="absolute inset-[15%] rounded-full"
        style={{ border: "1px solid var(--color-rule)" }}
      />

      {/* Inner ring closest to the logo - slightly brighter so the
          eye lands at the centre. */}
      <div
        className="absolute inset-[26%] rounded-full"
        style={{ border: "1px solid var(--color-rule-strong)" }}
      />

      {/* Logo centrepiece with a gentle breathe animation. */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={reduce ? undefined : { scale: [1, 1.025, 1] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            width: "36%",
            aspectRatio: "1 / 1",
            background: "var(--color-paper)",
            borderRadius: "28%",
            boxShadow:
              "0 30px 70px -22px rgba(0,0,0,0.75), 0 0 0 1px rgba(245,244,241,0.06), 0 0 60px -10px var(--color-accent-glow)",
          }}
        >
          {/* Very subtle inner sheen so the card has dimension without
              looking glassy. Top-left highlight, fades to nothing. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), transparent 55%)",
              mixBlendMode: "overlay",
            }}
          />
          <Image
            src="/logo.png"
            alt="Deepclario"
            width={300}
            height={300}
            priority
            className="relative w-[78%] h-[78%] object-contain"
          />
        </div>
      </motion.div>

      {/* Capability chips. Each fades in with stagger then drifts on
          its own x/y loop with a unique phase so the whole composition
          breathes naturally rather than ticking in lock-step. */}
      {CHIPS.map((chip, i) => {
        // Drift values chosen per-chip so adjacent chips never move
        // together. The pattern alternates slight horizontal vs
        // vertical lead so it reads as orbit, not bobbing.
        const xRange = i % 2 === 0 ? [0, 2, 0] : [0, -2, 0];
        const yRange = i % 2 === 0 ? [0, -3, 0] : [0, 3, 0];

        return (
          <motion.div
            key={chip.label}
            className="absolute"
            style={{
              left: `${chip.x}%`,
              top: `${chip.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reduce ? 0 : 0.35 + i * 0.09,
              duration: reduce ? 0 : 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <motion.div
              animate={reduce ? undefined : { x: xRange, y: yRange }}
              transition={{
                duration: 6 + i * 0.45,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.35,
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-medium whitespace-nowrap"
              style={{
                background: "var(--color-ink-card-elevated)",
                border: "1px solid var(--color-rule-strong)",
                color: "var(--color-paper)",
                boxShadow:
                  "0 14px 32px -14px rgba(0,0,0,0.75), 0 1px 0 rgba(245,244,241,0.05) inset",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <motion.span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--color-accent)" }}
                aria-hidden="true"
                animate={reduce ? undefined : { opacity: [0.6, 1, 0.6] }}
                transition={{
                  duration: 2.4 + i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15,
                }}
              />
              {chip.label}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
