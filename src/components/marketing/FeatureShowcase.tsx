'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/**
 * Tabbed feature showcase. Same structural idea PromptPerfect uses
 * (one feature in focus at a time, tabs to switch), executed with
 * Deepclario's editorial palette and four genuinely distinct demos
 * instead of two stacked boxes that say almost the same thing.
 *
 * Each panel is a custom mini-demo - no generic chat-bubble icons,
 * no glassy gradients. Just real product behaviour shown small.
 */

type TabId = 'score' | 'clarify' | 'rewrite' | 'in-chat'

const TABS: { id: TabId; label: string; eyebrow: string; title: string }[] = [
  {
    id: 'score',
    label: 'Score',
    eyebrow: '01 · Score',
    title: 'Five dimensions. One number you can trust.',
  },
  {
    id: 'clarify',
    label: 'Clarify',
    eyebrow: '02 · Clarify',
    title: 'One smart question. Never an interview.',
  },
  {
    id: 'rewrite',
    label: 'Rewrite',
    eyebrow: '03 · Rewrite',
    title: 'The version a careful expert would write themselves.',
  },
  {
    id: 'in-chat',
    label: 'In ChatGPT',
    eyebrow: '04 · In ChatGPT',
    title: 'One click, inside the chat. No copy-paste.',
  },
]

export function FeatureShowcase() {
  const [active, setActive] = useState<TabId>('score')
  const reduce = useReducedMotion()
  const activeTab = TABS.find(t => t.id === active)!

  return (
    <section
      className="px-6 md:px-10 py-24 md:py-32"
      style={{ borderTop: '1px solid var(--color-rule)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="grid md:grid-cols-12 gap-8 md:gap-16 mb-14 md:mb-20">
          <div className="md:col-span-3">
            <p className="eyebrow">How it works</p>
          </div>
          <div className="md:col-span-9">
            <h2
              className="display text-4xl md:text-6xl"
              style={{ color: 'var(--color-paper)' }}
            >
              Four moves.{' '}
              <span className="accent">Click through them.</span>
            </h2>
            <p
              className="mt-6 text-lg leading-relaxed max-w-2xl"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              The same engine, shown from four angles. Each tab is a real piece of the product, not a feature card pretending to be one.
            </p>
          </div>
        </div>

        {/* Tab strip - horizontally scrollable on mobile if it overflows */}
        <div
          className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0 mb-8"
          role="tablist"
        >
          <div
            className="inline-flex items-center gap-1 p-1.5 rounded-full"
            style={{
              background: 'var(--color-ink-card)',
              border: '1px solid var(--color-rule)',
            }}
          >
            {TABS.map(t => {
              const isActive = t.id === active
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(t.id)}
                  className="relative px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
                  style={{
                    color: isActive ? 'var(--color-ink)' : 'var(--color-paper-mute)',
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'var(--color-paper)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Left rail: eyebrow + title */}
          <div className="lg:col-span-4 lg:pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={`title-${active}`}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="eyebrow mb-4">{activeTab.eyebrow}</p>
                <h3
                  className="font-serif text-3xl md:text-4xl leading-[1.1] tracking-tight"
                  style={{ color: 'var(--color-paper)', fontWeight: 400 }}
                >
                  {activeTab.title}
                </h3>
                <p
                  className="mt-5 text-base leading-relaxed"
                  style={{ color: 'var(--color-paper-mute)' }}
                >
                  {PANEL_BLURBS[active]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right panel: per-tab custom demo */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`panel-${active}`}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="card-editorial p-7 md:p-9"
              >
                {active === 'score' && <PanelScore />}
                {active === 'clarify' && <PanelClarify />}
                {active === 'rewrite' && <PanelRewrite />}
                {active === 'in-chat' && <PanelInChat />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

const PANEL_BLURBS: Record<TabId, string> = {
  score:
    'Goal clarity, context, format, constraints, examples. Each rated on its own merits. You see exactly which dimension is weak and why.',
  clarify:
    'Only when the rewrite would change meaningfully based on the answer. Capped at three. Junk answers do not satisfy the model - it will ask again.',
  rewrite:
    'Role assigned, audience named, format specified, constraints stated. The version a careful expert would write themselves.',
  'in-chat':
    'Install the extension and an Improve button shows up next to the send button on ChatGPT, Claude, and Gemini. Click. Done.',
}

/* ============================================================
   Panel: Score
   Shows the 5-dimension breakdown with mini bars + total.
   ============================================================ */
function PanelScore() {
  const dims = [
    { label: 'Goal clarity', score: 4 },
    { label: 'Context', score: 2 },
    { label: 'Format', score: 1 },
    { label: 'Constraints', score: 2 },
    { label: 'Examples', score: 1 },
  ]
  const total = dims.reduce((s, d) => s + d.score, 0) * 5 // out of 100

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">The prompt</p>
        <p
          className="font-serif text-xl md:text-2xl leading-snug"
          style={{ color: 'var(--color-paper)' }}
        >
          &ldquo;Write me a blog post about AI.&rdquo;
        </p>
      </div>

      <div className="rule" />

      <ul className="space-y-4">
        {dims.map(d => (
          <li key={d.label} className="flex items-center gap-4">
            <span className="w-32 md:w-40 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
              {d.label}
            </span>
            <div className="flex-1 flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <span
                  key={i}
                  className="h-1.5 flex-1 rounded-full"
                  style={{
                    background:
                      i <= d.score
                        ? 'var(--color-accent)'
                        : 'rgba(245,244,241,0.08)',
                  }}
                />
              ))}
            </div>
            <span
              className="text-sm tabular-nums w-8 text-right"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              {d.score}/5
            </span>
          </li>
        ))}
      </ul>

      <div className="rule" />

      <div className="flex items-baseline justify-between">
        <span className="eyebrow">Total clarity</span>
        <span
          className="font-serif text-5xl tabular-nums"
          style={{ color: '#C25E5E', fontWeight: 400 }}
        >
          {total}
          <span
            className="text-base ml-1.5"
            style={{ color: 'var(--color-paper-mute)' }}
          >
            / 100
          </span>
        </span>
      </div>
    </div>
  )
}

/* ============================================================
   Panel: Clarify
   Shows the prompt → question → answer flow with confidence rise.
   ============================================================ */
function PanelClarify() {
  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Conversation</p>
        <div className="flex items-baseline gap-2">
          <span className="eyebrow">Confidence</span>
          <span
            className="font-serif text-2xl tabular-nums"
            style={{ color: 'var(--color-paper)' }}
          >
            35%
          </span>
          <span style={{ color: 'var(--color-paper-mute)' }}>→</span>
          <span
            className="font-serif text-2xl tabular-nums"
            style={{ color: 'var(--color-accent-bright)' }}
          >
            82%
          </span>
        </div>
      </div>

      <div className="rule" />

      <div
        className="pl-4 py-2"
        style={{ borderLeft: '1px solid var(--color-rule-strong)' }}
      >
        <p className="eyebrow mb-1.5" style={{ color: 'var(--color-paper-mute)' }}>
          You wrote
        </p>
        <p
          className="font-serif text-lg"
          style={{ color: 'var(--color-paper)' }}
        >
          &ldquo;Write me a blog post about AI.&rdquo;
        </p>
      </div>

      <div
        className="pl-4 py-2"
        style={{ borderLeft: `1px solid var(--color-accent)` }}
      >
        <p className="eyebrow mb-1.5" style={{ color: 'var(--color-accent)' }}>
          Deepclario asks
        </p>
        <p
          className="font-serif italic text-lg"
          style={{ color: 'var(--color-paper)' }}
        >
          Who is this post for - founders new to AI, or already using AI but getting inconsistent results?
        </p>
      </div>

      <div
        className="pl-4 py-2"
        style={{ borderLeft: '1px solid var(--color-rule-strong)' }}
      >
        <p className="eyebrow mb-1.5" style={{ color: 'var(--color-paper-mute)' }}>
          You answer
        </p>
        <p
          className="font-serif text-lg"
          style={{ color: 'var(--color-paper)' }}
        >
          B2B marketing leaders deciding where AI fits in their team.
        </p>
      </div>

      <p
        className="text-sm pt-2"
        style={{ color: 'var(--color-paper-mute)' }}
      >
        That was enough. Confidence crossed the threshold - straight to rewrite.
      </p>
    </div>
  )
}

/* ============================================================
   Panel: Rewrite
   Before / After diff-style.
   ============================================================ */
function PanelRewrite() {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div>
        <p className="eyebrow mb-3" style={{ color: 'var(--color-paper-mute)' }}>
          Before · 22
        </p>
        <div
          className="rounded-xl p-4 h-full"
          style={{
            background: 'rgba(194, 94, 94, 0.06)',
            border: '1px solid rgba(194, 94, 94, 0.18)',
          }}
        >
          <p
            className="font-serif text-base leading-snug"
            style={{ color: 'var(--color-paper)' }}
          >
            &ldquo;Write me a blog post about AI.&rdquo;
          </p>
        </div>
      </div>
      <div>
        <p className="eyebrow mb-3" style={{ color: 'var(--color-accent-bright)' }}>
          After · 87
        </p>
        <div
          className="rounded-xl p-4 h-full"
          style={{
            background: 'var(--color-accent-soft)',
            border: '1px solid rgba(91, 143, 237, 0.28)',
          }}
        >
          <p
            className="text-[13.5px] leading-[1.55] whitespace-pre-line font-serif"
            style={{ color: 'var(--color-paper)' }}
          >
{`Act as a senior content strategist writing for B2B marketing leaders deciding where AI fits in their team.

Write a 1,200-word essay titled "Where AI replaces marketers, and where it does not." Use three concrete examples per side. End with a one-paragraph recommendation for a director who needs to brief their team Monday.

Tone: direct. No hype, no bullet-point soup.`}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Panel: In ChatGPT
   Mocked chat textarea with an injected Improve button.
   ============================================================ */
function PanelInChat() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
          style={{ background: '#10A37F', color: 'white' }}
        >
          AI
        </div>
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          chatgpt.com
        </span>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{
          background: '#1a1a1d',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <p
          className="text-[15px] leading-relaxed mb-3"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          Write me a blog post about AI
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--color-accent)' }}
            />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Cursor here
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* The injected Deepclario button */}
            <motion.button
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                boxShadow: '0 0 0 4px var(--color-accent-soft), 0 8px 20px -8px var(--color-accent-glow)',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 1L7.2 4.4L10.6 5.5L7.8 7.5L8.8 11L6 9L3.2 11L4.2 7.5L1.4 5.5L4.8 4.4L6 1Z"
                  fill="currentColor"
                />
              </svg>
              Improve
            </motion.button>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              aria-label="Send"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 12V2M7 2L3 6M7 2L11 6"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
        Click Improve. Your prompt gets rewritten in place. Send hits the rewritten version, not the rough one.
      </p>
    </div>
  )
}
