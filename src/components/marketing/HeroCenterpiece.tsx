'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion'

/**
 * Hero centerpiece — the "Living Orbit".
 *
 * A central identity core with capability nodes that actually orbit and
 * respond to the cursor. No Three.js: depth comes from counter-rotating
 * rings and a mouse-parallax tilt on the core (rotateX/Y).
 *
 * Interaction:
 *   - idle: rings counter-rotate; nodes revolve with their ring; one node
 *     auto-highlights on a slow cycle so it never feels fully static.
 *   - hover/focus a node: it lifts (spring), its dot brightens, a filament
 *     pulse fires from the core to it, the core leans toward it, neighbours
 *     dim, and a one-line caption appears under the core.
 *   - reduced-motion: all loops stop, nodes sit statically; hover still
 *     gives a gentle lift.
 */

type Node = {
  id: string
  label: string
  caption: string
  /** Angle on the circle, degrees, 0 = top, clockwise. */
  angle: number
  /** Which ring (radius) it sits on. */
  ring: 'inner' | 'outer'
}

// Six capabilities on a true circle. Alternating rings give the cluster
// depth instead of a flat wheel. Angles are evenly spaced (60° apart).
const NODES: Node[] = [
  { id: 'models', label: 'ChatGPT · Claude · Gemini', caption: 'Works with every major model.', angle: 0, ring: 'outer' },
  { id: 'clarity', label: 'Clarity 22 → 87', caption: 'Every rewrite is scored.', angle: 60, ring: 'inner' },
  { id: 'improve', label: 'Prompt improvement', caption: 'Rewritten for the model to nail it first try.', angle: 120, ring: 'outer' },
  { id: 'browser', label: 'Right in your browser', caption: 'One click inside ChatGPT, Claude, Gemini.', angle: 180, ring: 'inner' },
  { id: 'tokens', label: 'Tokens 412 → 268', caption: 'Tighter prompts, fewer tokens.', angle: 240, ring: 'outer' },
  { id: 'question', label: 'Asks one smart question', caption: 'The thing a senior teammate would ask.', angle: 300, ring: 'inner' },
]

const RADIUS = { inner: 33, outer: 46 } // percent of container from centre

/** Position (percent) of a node's centre for a given angle + ring. */
function nodePos(angle: number, ring: 'inner' | 'outer') {
  const r = RADIUS[ring]
  const rad = ((angle - 90) * Math.PI) / 180 // -90 so 0° = top
  return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) }
}

const PARTICLES = [
  { x: 12, y: 14, dur: 9, delay: 0 },
  { x: 88, y: 10, dur: 11, delay: 1.2 },
  { x: 94, y: 58, dur: 12, delay: 1.6 },
  { x: 6, y: 62, dur: 9.5, delay: 0.4 },
  { x: 16, y: 90, dur: 11, delay: 2 },
  { x: 84, y: 92, dur: 10, delay: 0.6 },
]

export function HeroCenterpiece() {
  const reduce = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  const [active, setActive] = useState<string | null>(null)
  const [autoActive, setAutoActive] = useState<string | null>(null)

  // Mouse parallax → normalized -1..1, smoothed with a spring.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 120, damping: 20, mass: 0.4 })
  const sy = useSpring(my, { stiffness: 120, damping: 20, mass: 0.4 })
  const tiltX = useTransform(sy, [-1, 1], [7, -7]) // tilt up/down
  const tiltY = useTransform(sx, [-1, 1], [-7, 7]) // tilt left/right
  const coreShiftX = useTransform(sx, [-1, 1], [-6, 6])
  const coreShiftY = useTransform(sy, [-1, 1], [-6, 6])

  // Idle auto-attract: cycle a highlighted node so it's never fully still.
  useEffect(() => {
    if (reduce) return
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % NODES.length
      setAutoActive(NODES[i].id)
    }, 2600)
    return () => clearInterval(id)
  }, [reduce])

  function handleMouse(e: React.MouseEvent) {
    if (reduce) return
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mx.set(((e.clientX - rect.left) / rect.width) * 2 - 1)
    my.set(((e.clientY - rect.top) / rect.height) * 2 - 1)
  }
  function resetMouse() {
    mx.set(0)
    my.set(0)
  }

  // The node the filament + caption follow: explicit hover/focus wins,
  // else the idle auto-attract pick.
  const shownId = active ?? autoActive
  const shown = NODES.find(n => n.id === shownId) ?? null
  const shownPos = shown ? nodePos(shown.angle, shown.ring) : null

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouse}
      onMouseLeave={() => { resetMouse(); setActive(null) }}
      className="relative w-full aspect-square max-w-[560px] mx-auto"
      style={{ perspective: 1000 }}
    >
      {/* Ambient particles. */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {PARTICLES.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={0.35}
            fill="var(--color-accent)"
            fillOpacity={0.3}
            animate={reduce ? { opacity: 0.3 } : { cy: [p.y - 1, p.y + 1, p.y - 1], opacity: [0.15, 0.45, 0.15] }}
            transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </svg>

      {/* Filament: an animated line from the core to the active node. */}
      {shownPos && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="filament" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--color-accent-bright)" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <motion.line
            key={shownId}
            x1="50" y1="50" x2={shownPos.x} y2={shownPos.y}
            stroke="url(#filament)"
            strokeWidth="0.4"
            strokeLinecap="round"
            initial={reduce ? { opacity: 0.5 } : { pathLength: 0, opacity: 0 }}
            animate={reduce ? { opacity: 0.5 } : { pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
      )}

      {/* Pulsing glow under the core. */}
      <motion.div
        className="absolute inset-[14%] pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, var(--color-accent-glow), transparent 65%)', filter: 'blur(22px)' }}
        animate={reduce ? undefined : { opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Counter-rotating rings for depth. */}
      <motion.div
        className="absolute inset-[4%] rounded-full pointer-events-none"
        style={{ border: '1px dashed var(--color-rule)' }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-[19%] rounded-full pointer-events-none"
        style={{ border: '1px solid var(--color-rule)' }}
        animate={reduce ? undefined : { rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />

      {/* Core: logo card with mouse-parallax tilt + breathe. */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          style={{
            width: '34%',
            aspectRatio: '1 / 1',
            rotateX: reduce ? 0 : tiltX,
            rotateY: reduce ? 0 : tiltY,
            x: reduce ? 0 : coreShiftX,
            y: reduce ? 0 : coreShiftY,
            transformStyle: 'preserve-3d',
          }}
        >
          <motion.div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            style={{
              background: 'var(--color-paper)',
              borderRadius: '28%',
              boxShadow: '0 30px 70px -22px rgba(0,0,0,0.75), 0 0 0 1px rgba(245,244,241,0.06), 0 0 60px -10px var(--color-accent-glow)',
            }}
            animate={reduce ? undefined : { scale: [1, 1.025, 1] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), transparent 55%)', mixBlendMode: 'overlay' }}
            />
            <Image src="/logo.png" alt="Deepclario" width={300} height={300} priority className="relative w-[78%] h-[78%] object-contain" />
          </motion.div>
        </motion.div>
      </div>

      {/* One-line caption under the core for the active node. */}
      <div className="absolute left-1/2 top-[64%] -translate-x-1/2 w-[52%] text-center pointer-events-none">
        <AnimatePresence mode="wait">
          {shown && (
            <motion.p
              key={shown.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-[11px] leading-snug"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              {shown.caption}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Capability nodes. */}
      {NODES.map((node, i) => {
        const pos = nodePos(node.angle, node.ring)
        const isActive = shownId === node.id
        const dimmed = shownId != null && !isActive
        return (
          <div
            key={node.id}
            className="absolute"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <motion.button
              type="button"
              onHoverStart={() => setActive(node.id)}
              onFocus={() => setActive(node.id)}
              onBlur={() => setActive(null)}
              aria-label={`${node.label}. ${node.caption}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-medium whitespace-nowrap cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-ink)"
              style={{
                background: isActive ? 'var(--color-ink-card-elevated)' : 'var(--color-ink-card)',
                border: `1px solid ${isActive ? 'rgba(91,143,237,0.5)' : 'var(--color-rule-strong)'}`,
                color: 'var(--color-paper)',
                boxShadow: isActive
                  ? '0 18px 40px -14px rgba(0,0,0,0.8), 0 0 0 4px rgba(91,143,237,0.10)'
                  : '0 14px 32px -14px rgba(0,0,0,0.75), 0 1px 0 rgba(245,244,241,0.05) inset',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              initial={reduce ? false : { opacity: 0, scale: 0.9 }}
              animate={{
                opacity: dimmed ? 0.5 : 1,
                scale: isActive ? 1.06 : 1,
                // Gentle orbital drift when idle; freeze the active node.
                y: reduce || isActive ? 0 : [0, node.ring === 'outer' ? -4 : 4, 0],
              }}
              transition={{
                opacity: { duration: 0.3 },
                scale: { type: 'spring', stiffness: 320, damping: 22 },
                y: reduce ? { duration: 0 } : { duration: 6 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 },
              }}
            >
              <motion.span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: isActive ? 'var(--color-accent-bright)' : 'var(--color-accent)' }}
                aria-hidden
                animate={reduce ? undefined : { opacity: isActive ? 1 : [0.6, 1, 0.6] }}
                transition={{ duration: 2.4 + i * 0.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
              />
              {node.label}
            </motion.button>
          </div>
        )
      })}
    </div>
  )
}
