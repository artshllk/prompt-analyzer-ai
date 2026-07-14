'use client'

import { motion } from 'framer-motion'
import { Hotkey } from '@/components/shared/Hotkey'

/**
 * The hero shot: a chat box with the Deepclario chip beside it, and the
 * question it asks before it rewrites anything.
 *
 * The old version showed an "Improve" button and a docked side panel. Neither
 * exists. The product is a keystroke and a small chip, and the thing worth
 * showing is not the rewrite (everyone claims that) - it is that it ASKS
 * first. That is the whole difference, so it is what the picture is of.
 *
 * CSS/HTML mock, not a screenshot: always crisp, always on-brand, and it can
 * animate the one beat that matters.
 */
export function ExtensionHeroVisual() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 blur-3xl opacity-60"
        style={{
          background:
            'radial-gradient(60% 55% at 60% 40%, var(--color-accent-glow), transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl overflow-hidden p-5 sm:p-6"
        style={{
          background: 'rgba(20,20,24,0.72)',
          border: '1px solid var(--color-rule-strong)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7)',
        }}
      >
        {/* The question. This is the product. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-3"
        >
          <div
            className="rounded-xl px-3.5 py-2.5 mb-2 text-[13px] font-semibold"
            style={{
              background: 'var(--color-ink)',
              border: '1px solid var(--color-rule-strong)',
              color: 'var(--color-paper)',
            }}
          >
            What kind of array do you need?
          </div>

          <div className="space-y-1.5">
            {[
              ['Simple list', 'Numbers or words, like [1, 2, 3]'],
              ['Object list', 'Items with fields, like { name: … }'],
            ].map(([label, sub], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.09, duration: 0.4 }}
                className="rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
                style={{
                  background: 'var(--color-ink-card)',
                  border: `1px solid ${i === 0 ? 'rgba(143,180,242,.45)' : 'var(--color-rule-strong)'}`,
                }}
              >
                <span
                  className="shrink-0 grid place-items-center rounded-md text-[10px] font-bold"
                  style={{
                    width: 16,
                    height: 16,
                    background: i === 0 ? 'var(--color-accent-bright)' : 'rgba(245,244,241,.10)',
                    color: i === 0 ? 'var(--color-ink)' : 'var(--color-paper-mute)',
                  }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className="block text-[12.5px] font-semibold leading-tight"
                    style={{ color: 'var(--color-paper)' }}
                  >
                    {label}
                  </span>
                  <span
                    className="block text-[11px] leading-tight mt-0.5 truncate"
                    style={{ color: 'var(--color-paper-mute)' }}
                  >
                    {sub}
                  </span>
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* The chip, sitting where it really sits: on top of the input. */}
        <div className="relative">
          <motion.span
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -top-3 right-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: 'var(--color-paper)',
              color: 'var(--color-ink)',
              boxShadow: '0 3px 14px rgba(0,0,0,.35)',
            }}
          >
            ✦ Improve
            <span
              className="rounded px-1 py-px text-[9px] font-bold opacity-60"
              style={{ border: '1px solid rgba(14,14,16,.3)' }}
            >
              <Hotkey plain />
            </span>
          </motion.span>

          {/* The chat box. */}
          <div
            className="rounded-xl px-4 pt-4 pb-3"
            style={{
              background: 'var(--color-ink-card)',
              border: '1px solid var(--color-rule-strong)',
            }}
          >
            <p className="text-[13.5px]" style={{ color: 'var(--color-paper)' }}>
              help me write a javascript array
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px]" style={{ color: 'var(--color-paper-mute)' }}>
                ChatGPT
              </span>
              <span
                className="grid place-items-center rounded-full"
                style={{ width: 22, height: 22, background: 'rgba(245,244,241,.14)' }}
              >
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M7 12V2M7 2L2 7M7 2L12 7"
                    stroke="var(--color-paper-mute)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
