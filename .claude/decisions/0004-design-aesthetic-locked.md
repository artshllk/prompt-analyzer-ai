> **SUPERSEDED by [0006](0006-paper-and-markup.md).** The aesthetic moved to
> paper and markup, light only, in preparation for launch. Kept for the
> reasoning, which is still why there is no purple and no glassmorphism.

# 0004 — Design aesthetic is locked (editorial dark, no 3D)

## Context

Deepclario's brand is deliberately not the generic AI-startup look (glassy 3D,
purple gradients, neon glow). The visual identity is settled and should not drift.

## Decision

The aesthetic is **locked** and should not be pivoted without an explicit call from Art.

- **Editorial dark.** Warm near-black background, warm off-white foreground, a single
  accent (electric blue, not purple, not generic AI cyan). Serif for display, clean
  sans for body. References: Linear, Vercel, Cal, Stripe.
- The blog uses an `editorial grain` shell with styled bordered cards as its visual
  element. Blog posts use **no `<img>` tags**; diagrams are div-cards.

## Do not

- No glassy 3D, purple gradients, neon glow, or generic AI-startup hero treatments.
- No 3D hero treatments, voice input, or audio features (explicitly rejected).
- Do not pivot the visual aesthetic.

## Open contradiction to resolve

`three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
are installed and `src/components/3d/` exists, which conflicts with "no 3D". Before
removing them, confirm whether anything still imports them (an old hero or an
effect that survived). If nothing uses them, removing the four Three.js packages
and `components/3d/` is a safe cleanup. Tracked in `.claude/roadmap.md` backlog.
