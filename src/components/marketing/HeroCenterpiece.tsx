'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Hero centerpiece visual.
 *
 * Inspired by PromptPerfect's "centerpiece + orbiting chips" layout —
 * same structure, very different execution. No 3D, no glassy gradients,
 * no purple. Just our editorial mark at scale, a soft accent-blue glow
 * behind it, and six capability chips floating around the edges so the
 * feature set is legible without a separate features section.
 *
 * Sized to fit a 5/12 column on desktop, hidden under lg breakpoint so
 * mobile gets the text-only treatment.
 */

type Chip = {
  label: string
  // Position as percent of the container, anchored to top-left.
  // 50%/50% would be dead-center on the logo.
  x: number
  y: number
}

// Six chips. Each one tells a real product fact that's true today —
// not aspirational. Order: clockwise from top.
const CHIPS: Chip[] = [
  { label: 'Clarity 22 → 87',       x: 50, y: 4 },
  { label: 'Asks one smart question', x: 95, y: 24 },
  { label: 'ChatGPT · Claude · Gemini', x: 96, y: 70 },
  { label: '1-click Improve in-page', x: 58, y: 96 },
  { label: 'Free · 25 rewrites/mo',  x: 4, y: 76 },
  { label: 'CRAFT rewrite',          x: 4, y: 26 },
]

export function HeroCenterpiece() {
  const reduce = useReducedMotion()

  return (
    <div
      className="relative w-full aspect-square max-w-[560px] mx-auto"
      aria-hidden="true"
    >
      {/* Soft accent glow behind everything. Blurry, low-opacity,
          single layer — keeps GPU cost minimal. */}
      <div
        className="absolute inset-[12%]"
        style={{
          background:
            'radial-gradient(circle at center, var(--color-accent-glow), transparent 65%)',
          filter: 'blur(18px)',
        }}
      />

      {/* Faint ring around the logo — adds a sense of "orbit"
          without being a circle border. */}
      <div
        className="absolute inset-[18%] rounded-full"
        style={{ border: '1px solid var(--color-rule)' }}
      />
      <div
        className="absolute inset-[8%] rounded-full"
        style={{ border: '1px dashed var(--color-rule)' }}
      />

      {/* Logo centerpiece with a gentle breathe animation. */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={reduce ? undefined : { scale: [1, 1.025, 1] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{
            width: '38%',
            aspectRatio: '1 / 1',
            background: 'var(--color-paper)',
            borderRadius: '28%',
            boxShadow:
              '0 24px 60px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,244,241,0.06)',
          }}
        >
          <Image
            src="/logo.png"
            alt="Deepclario"
            width={300}
            height={300}
            priority
            className="w-[78%] h-[78%] object-contain"
          />
        </div>
      </motion.div>

      {/* Capability chips. Each fades in with stagger, then floats
          on its own slow loop with a unique phase so the whole thing
          breathes naturally. */}
      {CHIPS.map((chip, i) => (
        <motion.div
          key={chip.label}
          className="absolute"
          style={{
            left: `${chip.x}%`,
            top: `${chip.y}%`,
            transform: 'translate(-50%, -50%)',
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
            animate={reduce ? undefined : { y: [0, -4, 0] }}
            transition={{
              duration: 5.5 + i * 0.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-medium whitespace-nowrap"
            style={{
              background: 'var(--color-ink-card-elevated)',
              border: '1px solid var(--color-rule-strong)',
              color: 'var(--color-paper)',
              boxShadow:
                '0 12px 30px -12px rgba(0,0,0,0.7), 0 1px 0 rgba(245,244,241,0.04) inset',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--color-accent)' }}
              aria-hidden="true"
            />
            {chip.label}
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
