'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
  useSpring,
  type MotionValue,
} from 'framer-motion'
import Link from 'next/link'

/**
 * Cinematic scroll-driven hero.
 *
 * The user scrolls, and the page tells a three-act story:
 *   01  Vague  — the prompt as typed.
 *   02  Asked  — three editorial clarifying questions.
 *   03  Sharp  — the rewritten prompt, score climbs to 91.
 *
 * Implementation notes:
 *   - Single derived `stage` state (1 | 2 | 3) drives what renders.
 *   - AnimatePresence handles the crossfade between stages — no
 *     overlapping absolute siblings, no ghost rendering.
 *   - Score is a separate spring-eased MotionValue with no spring on
 *     the stage logic, so opacity transitions are crisp.
 *   - prefers-reduced-motion: stage transitions are instant; score
 *     still updates because it is content, not decoration.
 */

const VAGUE_PROMPT = 'Write me a blog post about AI'

const QUESTIONS = [
  { q: 'Who is this for?', a: 'B2B marketing leaders deciding where AI fits in their team.' },
  { q: 'What should they do after reading it?', a: 'Walk into Monday with an opinion they can defend.' },
  { q: 'How long, and what tone?', a: '1,200 words. Direct. No hype, no bullet soup.' },
]

const REWRITTEN_PROMPT = `Act as a senior content strategist writing for B2B marketing leaders.

Write a 1,200-word essay titled "Where AI replaces marketers, and where it doesn't." Be specific. Use three concrete examples per side. End with a one-paragraph recommendation for a director-level reader who needs to brief their team Monday.

Tone: direct. No hype. No bullet-point soup.`

// Stage boundaries (scrollYProgress thresholds)
const STAGE_2_START = 0.33
const STAGE_3_START = 0.66

// Score: only climbs during the rewrite stage
const SCORE_START = 0.68
const SCORE_END = 0.94
const SCORE_FROM = 22
const SCORE_TO = 87

type Stage = 1 | 2 | 3

export function CinematicHero() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  /* --------- Stage state (single source of truth) --------- */
  const [stage, setStage] = useState<Stage>(1)

  // Set initial stage on mount based on current scroll position (deep link / refresh case)
  useEffect(() => {
    const p = scrollYProgress.get()
    setStage(p < STAGE_2_START ? 1 : p < STAGE_3_START ? 2 : 3)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMotionValueEvent(scrollYProgress, 'change', p => {
    const next: Stage = p < STAGE_2_START ? 1 : p < STAGE_3_START ? 2 : 3
    setStage(prev => (prev === next ? prev : next))
  })

  /* --------- Score (spring-eased, separate from stage) --------- */
  const rawScore = useTransform(scrollYProgress, [SCORE_START, SCORE_END], [SCORE_FROM, SCORE_TO])
  const score = useSpring(rawScore, { stiffness: 100, damping: 24 })
  const [displayScore, setDisplayScore] = useState(SCORE_FROM)
  useMotionValueEvent(score, 'change', v => setDisplayScore(Math.round(v)))

  const scoreColor = displayScore < 30 ? '#C25E5E' : displayScore < 60 ? '#C99550' : '#7FA875'

  return (
    <section
      ref={ref}
      className="relative"
      style={{ height: '300vh' }}
      aria-label="How Deepclario transforms a prompt"
    >
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="w-full max-w-6xl mx-auto px-6 md:px-10">
          {/* Top row: eyebrow + persistent score */}
          <div className="flex items-baseline justify-between mb-12 md:mb-16">
            <span className="eyebrow">A real prompt, sharpened</span>
            <div className="flex items-baseline gap-3">
              <span className="eyebrow">Clarity</span>
              <span
                className="font-serif text-5xl md:text-6xl tabular-nums tracking-tight transition-colors duration-500"
                style={{ fontWeight: 400, color: scoreColor }}
              >
                {displayScore}
              </span>
              <span className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>/ 100</span>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-start">
            {/* Left: stage progress markers */}
            <div className="md:col-span-3 hidden md:block">
              <StageMarker activeStage={stage} />
            </div>

            {/* Right: only the current stage renders, AnimatePresence handles crossfade */}
            <div className="md:col-span-9 relative min-h-[55vh]">
              <AnimatePresence mode="wait" initial={false}>
                {stage === 1 && <VagueStage key="vague" reduce={!!reduce} />}
                {stage === 2 && <QuestionsStage key="questions" reduce={!!reduce} />}
                {stage === 3 && <RewriteStage key="rewrite" reduce={!!reduce} />}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom CTA — fades in once we reach stage 3 */}
          <BottomCTA visible={stage === 3} reduce={!!reduce} />
        </div>
      </div>
    </section>
  )
}

/* =====================================================
   Stages
   ===================================================== */

const stageMotionProps = (reduce: boolean) =>
  reduce
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -16 },
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
      }

function VagueStage({ reduce }: { reduce: boolean }) {
  return (
    <motion.div {...stageMotionProps(reduce)} className="absolute inset-0">
      <p className="eyebrow mb-4" style={{ color: '#C25E5E' }}>What you typed</p>
      <p
        className="display display-italic text-[10vw] md:text-[5.2rem] leading-[1.05]"
        style={{ color: 'var(--color-paper)' }}
      >
        &ldquo;{VAGUE_PROMPT}.&rdquo;
      </p>
      <p className="mt-8 text-base md:text-lg max-w-md" style={{ color: 'var(--color-paper-mute)' }}>
        Eight words. The model has to guess everything &mdash; audience, length, tone, goal, structure. It will guess wrong.
      </p>
    </motion.div>
  )
}

function QuestionsStage({ reduce }: { reduce: boolean }) {
  return (
    <motion.div {...stageMotionProps(reduce)} className="absolute inset-0">
      <p className="eyebrow mb-6" style={{ color: 'var(--color-accent)' }}>One question at a time</p>
      <div className="space-y-7 max-w-2xl">
        {QUESTIONS.map((item, i) => (
          <motion.div
            key={i}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduce ? 0 : 0.5,
              delay: reduce ? 0 : 0.18 + i * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="pl-5"
            style={{ borderLeft: '1px solid var(--color-rule-strong)' }}
          >
            <p
              className="font-serif text-xl md:text-2xl mb-2"
              style={{ color: 'var(--color-paper)', fontWeight: 400, fontStyle: 'italic' }}
            >
              {item.q}
            </p>
            <p className="text-base md:text-lg" style={{ color: 'var(--color-paper-mute)' }}>
              {item.a}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function RewriteStage({ reduce }: { reduce: boolean }) {
  return (
    <motion.div {...stageMotionProps(reduce)} className="absolute inset-0">
      <p className="eyebrow mb-4" style={{ color: '#7FA875' }}>What we send to the model</p>
      <p
        className="font-serif text-lg md:text-[1.55rem] leading-[1.45] whitespace-pre-line"
        style={{ color: 'var(--color-paper)', fontWeight: 400 }}
      >
        {REWRITTEN_PROMPT}
      </p>
    </motion.div>
  )
}

/* =====================================================
   Sub-components
   ===================================================== */

function StageMarker({ activeStage }: { activeStage: Stage }) {
  const labels: { id: Stage; label: string }[] = [
    { id: 1, label: '01 / What you typed' },
    { id: 2, label: '02 / What we asked' },
    { id: 3, label: '03 / What we send' },
  ]

  return (
    <div className="space-y-5">
      {labels.map(({ id, label }) => (
        <motion.div
          key={id}
          className="flex items-center gap-3"
          animate={{ opacity: id === activeStage ? 1 : 0.22 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="w-6 h-px" style={{ background: 'var(--color-paper)' }} />
          <span className="eyebrow">{label}</span>
        </motion.div>
      ))}
    </div>
  )
}

function BottomCTA({ visible, reduce }: { visible: boolean; reduce: boolean }) {
  return (
    <motion.div
      className="mt-12 md:mt-16 flex flex-wrap items-center gap-6"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: reduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <Link
        href="#try"
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] transition-all hover:gap-3"
        style={{
          background: 'var(--color-paper)',
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-inter)',
          fontWeight: 500,
        }}
      >
        Try this on your own prompt
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 7H12M12 7L7 2M12 7L7 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <span className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
        Free. No account needed.
      </span>
    </motion.div>
  )
}

/* Suppress unused-import warning when MotionValue is not directly referenced */
export type _MotionValue = MotionValue<number>
