'use client'

import { motion } from 'framer-motion'

/**
 * The hero "money shot": a CSS/HTML mock of a ChatGPT chat box with the
 * Deepclario Improve panel docked beside it. No screenshot - always crisp,
 * on-brand. Floats up on load; the accent glow sits behind it.
 *
 * Refined-premium treatment: one accent glow, glass surfaces, gentle
 * motion. Respects prefers-reduced-motion via Framer's reduced-motion
 * handling (transforms collapse to opacity-only for those users).
 */
export function ExtensionHeroVisual() {
  return (
    <div className="relative">
      {/* Accent glow behind the frame. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 blur-3xl opacity-60"
        style={{
          background:
            'radial-gradient(60% 55% at 60% 40%, var(--color-accent-glow), transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(20,20,24,0.7)',
          border: '1px solid var(--color-rule-strong)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7)',
        }}
      >
        {/* Browser chrome */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: '1px solid var(--color-rule)' }}
        >
          <span className="flex gap-1.5" aria-hidden>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#E5695B' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#E0B23C' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#5FBE8C' }} />
          </span>
          <div
            className="ml-2 flex-1 max-w-[200px] px-3 py-1 rounded-md text-[11px]"
            style={{ background: 'var(--color-ink-card)', color: 'var(--color-paper-mute)' }}
          >
            chatgpt.com
          </div>
        </div>

        {/* Body: chat on the left, Deepclario panel on the right */}
        <div className="grid grid-cols-5 gap-0">
          {/* Chat column */}
          <div className="col-span-3 p-4 md:p-5 space-y-3">
            <div className="h-2 rounded-full w-1/2" style={{ background: 'var(--color-rule-strong)' }} />
            <div className="h-2 rounded-full w-4/5" style={{ background: 'var(--color-rule)' }} />
            <div className="h-2 rounded-full w-2/3" style={{ background: 'var(--color-rule)' }} />

            {/* The chat input with the Improve affordance */}
            <div
              className="mt-6 rounded-xl p-3"
              style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule-strong)' }}
            >
              <p className="text-[12px] leading-snug" style={{ color: 'var(--color-paper-mute)' }}>
                write me a blog post about AI
              </p>
              <div className="mt-3 flex items-center justify-between">
                <motion.span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{
                    background: 'var(--color-accent-soft)',
                    color: 'var(--color-accent-bright)',
                    border: '1px solid rgba(91,143,237,0.3)',
                  }}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  ✦ Improve
                </motion.span>
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px]"
                  style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}
                >
                  ↑
                </span>
              </div>
            </div>
          </div>

          {/* Deepclario panel */}
          <div
            className="col-span-2 p-4 md:p-5"
            style={{
              background: 'rgba(91,143,237,0.06)',
              borderLeft: '1px solid var(--color-rule-strong)',
            }}
          >
            <p
              className="text-[10px] tracking-[0.12em] uppercase font-semibold mb-2"
              style={{ color: 'var(--color-accent-bright)' }}
            >
              Deepclario
            </p>
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="font-serif text-2xl tabular-nums leading-none" style={{ color: 'var(--color-paper-mute)' }}>22</span>
              <span className="text-[11px]" style={{ color: 'var(--color-paper-mute)' }}>→</span>
              <span className="font-serif text-2xl tabular-nums leading-none" style={{ color: 'var(--color-accent-bright)' }}>87</span>
            </div>
            <div className="space-y-2">
              <div className="h-1.5 rounded-full w-full" style={{ background: 'var(--color-accent-soft)' }} />
              <div className="h-1.5 rounded-full w-5/6" style={{ background: 'var(--color-accent-soft)' }} />
              <div className="h-1.5 rounded-full w-11/12" style={{ background: 'var(--color-accent-soft)' }} />
              <div className="h-1.5 rounded-full w-3/4" style={{ background: 'var(--color-accent-soft)' }} />
            </div>
            <div
              className="mt-4 text-center text-[11px] py-1.5 rounded-full font-medium"
              style={{ background: 'var(--color-paper)', color: 'var(--color-ink)' }}
            >
              Use rewrite
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
