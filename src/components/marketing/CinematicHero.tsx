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
 * Cinematic hero — two implementations, one component.
 *
 *  Desktop  (md and up):  scroll-pinned, three exclusive stages with a
 *                         clarity score that climbs as the user scrolls.
 *  Mobile  (sm and down): three stacked sections that fade in on scroll.
 *                         No sticky, no momentum-scroll surprises.
 *
 * Both versions tell the same three-act story:
 *   01  What you typed   — the vague prompt
 *   02  What we asked    — three clarifying questions
 *   03  What we send     — the rewrite
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

// Score scale
const SCORE_FROM = 22
const SCORE_TO = 87

function scoreColor(score: number): string {
  if (score < 30) return '#C25E5E'
  if (score < 60) return 'var(--color-paper-mute)'
  return 'var(--color-paper)'
}

export function CinematicHero() {
  return (
    <>
      {/* Desktop: scroll-pinned cinematic */}
      <div className="hidden md:block">
        <DesktopCinematic />
      </div>
      {/* Mobile: stacked, no sticky */}
      <div className="md:hidden">
        <MobileStacked />
      </div>
    </>
  )
}

/* =====================================================
   Desktop — scroll-pinned, three exclusive stages
   ===================================================== */

const STAGE_2_START = 0.33
const STAGE_3_START = 0.66
const SCORE_START = 0.68
const SCORE_END = 0.94

type Stage = 1 | 2 | 3

function DesktopCinematic() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  const [stage, setStage] = useState<Stage>(1)

  useEffect(() => {
    const p = scrollYProgress.get()
    setStage(p < STAGE_2_START ? 1 : p < STAGE_3_START ? 2 : 3)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMotionValueEvent(scrollYProgress, 'change', p => {
    const next: Stage = p < STAGE_2_START ? 1 : p < STAGE_3_START ? 2 : 3
    setStage(prev => (prev === next ? prev : next))
  })

  const rawScore = useTransform(scrollYProgress, [SCORE_START, SCORE_END], [SCORE_FROM, SCORE_TO])
  const score = useSpring(rawScore, { stiffness: 100, damping: 24 })
  const [displayScore, setDisplayScore] = useState(SCORE_FROM)
  useMotionValueEvent(score, 'change', v => setDisplayScore(Math.round(v)))

  return (
    <section
      ref={ref}
      className="relative"
      style={{ height: '300vh' }}
      aria-label="How Deepclario transforms a prompt"
    >
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="w-full max-w-6xl mx-auto px-10">
          <div className="flex items-baseline justify-between mb-16">
            <span className="eyebrow">A real prompt, sharpened</span>
            <div className="flex items-baseline gap-3">
              <span className="eyebrow">Clarity</span>
              <span
                className="font-serif text-6xl tabular-nums tracking-tight transition-colors duration-500"
                style={{ fontWeight: 400, color: scoreColor(displayScore) }}
              >
                {displayScore}
              </span>
              <span className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>/ 100</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-16 items-start">
            <div className="col-span-3">
              <DesktopStageMarker activeStage={stage} />
            </div>
            <div className="col-span-9 relative min-h-[55vh]">
              <AnimatePresence mode="wait" initial={false}>
                {stage === 1 && <DesktopVagueStage key="vague" reduce={!!reduce} />}
                {stage === 2 && <DesktopQuestionsStage key="questions" reduce={!!reduce} />}
                {stage === 3 && <DesktopRewriteStage key="rewrite" reduce={!!reduce} />}
              </AnimatePresence>
            </div>
          </div>

          <DesktopBottomCTA visible={stage === 3} reduce={!!reduce} />
        </div>
      </div>
    </section>
  )
}

const stageMotionProps = (reduce: boolean) =>
  reduce
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -16 },
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
      }

function DesktopVagueStage({ reduce }: { reduce: boolean }) {
  return (
    <motion.div {...stageMotionProps(reduce)} className="absolute inset-0">
      <p className="eyebrow mb-4" style={{ color: 'var(--color-paper-mute)' }}>What you typed</p>
      <p
        className="font-serif text-[5.2rem] leading-tight tracking-tight"
        style={{ color: 'var(--color-paper)', fontWeight: 400 }}
      >
        &ldquo;{VAGUE_PROMPT}.&rdquo;
      </p>
      <p className="mt-8 text-lg max-w-md" style={{ color: 'var(--color-paper-mute)' }}>
        Eight words. The model has to guess everything — audience, length, tone, goal, structure. It will guess wrong.
      </p>
    </motion.div>
  )
}

function DesktopQuestionsStage({ reduce }: { reduce: boolean }) {
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
              className="font-serif text-2xl mb-2"
              style={{ color: 'var(--color-paper)', fontWeight: 400, fontStyle: 'italic' }}
            >
              {item.q}
            </p>
            <p className="text-lg" style={{ color: 'var(--color-paper-mute)' }}>
              {item.a}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function DesktopRewriteStage({ reduce }: { reduce: boolean }) {
  return (
    <motion.div {...stageMotionProps(reduce)} className="absolute inset-0">
      <p className="eyebrow mb-4" style={{ color: 'var(--color-paper)' }}>What we send to the model</p>
      <p
        className="font-serif text-[1.55rem] leading-snug whitespace-pre-line"
        style={{ color: 'var(--color-paper)', fontWeight: 400 }}
      >
        {REWRITTEN_PROMPT}
      </p>
    </motion.div>
  )
}

function DesktopStageMarker({ activeStage }: { activeStage: Stage }) {
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

function DesktopBottomCTA({ visible, reduce }: { visible: boolean; reduce: boolean }) {
  return (
    <motion.div
      className="mt-16 flex flex-wrap items-center gap-6"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: reduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <Link
        href="#try"
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] transition-all hover:gap-3 btn-paper"
        style={{
          background: 'var(--color-paper)',
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-inter)',
          fontWeight: 500,
        }}
      >
        Try this on your own prompt
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <span className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
        Free. No account needed.
      </span>
    </motion.div>
  )
}

/* =====================================================
   Mobile — stacked, no sticky, fades in on scroll
   ===================================================== */

function MobileStacked() {
  const reduce = useReducedMotion()

  return (
    <section aria-label="How Deepclario transforms a prompt" className="px-6 py-12 space-y-16">
      <MobileStage
        eyebrowColor="var(--color-paper-mute)"
        eyebrow="01 · What you typed"
        score={SCORE_FROM}
        reduce={!!reduce}
      >
        <p
          className="font-serif text-[2.6rem] leading-tight tracking-tight"
          style={{ color: 'var(--color-paper)', fontWeight: 400 }}
        >
          &ldquo;{VAGUE_PROMPT}.&rdquo;
        </p>
        <p className="mt-5 text-base" style={{ color: 'var(--color-paper-mute)' }}>
          Eight words. The model has to guess everything — audience, length, tone, goal, structure. It will guess wrong.
        </p>
      </MobileStage>

      <MobileStage
        eyebrowColor="var(--color-accent)"
        eyebrow="02 · One question at a time"
        score={SCORE_FROM}
        reduce={!!reduce}
      >
        <div className="space-y-5">
          {QUESTIONS.map((item, i) => (
            <div
              key={i}
              className="pl-4"
              style={{ borderLeft: '1px solid var(--color-rule-strong)' }}
            >
              <p
                className="font-serif text-xl mb-1"
                style={{ color: 'var(--color-paper)', fontWeight: 400, fontStyle: 'italic' }}
              >
                {item.q}
              </p>
              <p className="text-base" style={{ color: 'var(--color-paper-mute)' }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </MobileStage>

      <MobileStage
        eyebrowColor="var(--color-paper-mute)"
        eyebrow="03 · What we send"
        score={SCORE_TO}
        reduce={!!reduce}
      >
        <p
          className="font-serif text-lg leading-snug whitespace-pre-line"
          style={{ color: 'var(--color-paper)', fontWeight: 400 }}
        >
          {REWRITTEN_PROMPT}
        </p>
        <Link
          href="#try"
          className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] transition-all hover:gap-3 btn-paper"
          style={{
            background: 'var(--color-paper)',
            color: 'var(--color-ink)',
            fontWeight: 500,
          }}
        >
          Try this on your own prompt
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M2 7H12M12 7L7 2M12 7L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </MobileStage>
    </section>
  )
}

function MobileStage({
  eyebrow,
  eyebrowColor,
  score,
  reduce,
  children,
}: {
  eyebrow: string
  eyebrowColor: string
  score: number
  reduce: boolean
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-baseline justify-between mb-6">
        <span className="eyebrow" style={{ color: eyebrowColor }}>{eyebrow}</span>
        <div className="flex items-baseline gap-2">
          <span className="eyebrow">Clarity</span>
          <span
            className="font-serif text-3xl tabular-nums"
            style={{ fontWeight: 400, color: scoreColor(score) }}
          >
            {score}
          </span>
        </div>
      </div>
      {children}
    </motion.div>
  )
}

/* Suppress unused-import warning when MotionValue is not directly referenced */
export type _MotionValue = MotionValue<number>
