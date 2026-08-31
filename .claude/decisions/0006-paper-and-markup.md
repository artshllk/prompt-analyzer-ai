# 0006 — Paper and markup, light only

**Supersedes 0004 (editorial dark, locked).**

## Context

0004 locked the aesthetic to editorial dark with an electric-blue accent, and
said not to pivot it without an explicit call from Art. This is that call.

The reason is not taste. The product's one idea is that it marks up your
prompt and shows you what it added. That is a copy editor's idea, and a copy
editor works on paper. A dark canvas with one accent colour cannot carry three
distinct meanings (contributed, guessed, confirmed) legibly at the size of an
inline chip, which is exactly where they have to be readable.

## Decision

**The page is paper and the product marks it up. Colour carries meaning, it is
not decoration.**

```
--paper       #F1F0EA   page background
--card        #FFFFFF   raised surfaces
--ink         #15130F   primary text, "your words"
--ink-soft    #6B6559   secondary text
--rule        #DFDCD2   hairlines and borders
--brand       #C9452F   buttons, links, brand marks
--brand-deep  #A93520   button hover fill
--machine     #2C5FD4   anything the tool contributed
--machine-bg  #E8EEFC
--guess       #B8791A   assumptions
--guess-bg    #FBF1DE
--confirm     #2E6F4E   verified, removed, done
```

**Light only. There is no dark mode and none is planned.** A marked-up page is
a light-surface idea, and a second palette doubles the surface area of every
contrast decision above for no gain. `machine` and `guess` would both need
re-picking against a dark ground, and the whole point is that those two stay
distinguishable at chip size.

**Type:** Bricolage Grotesque (600, 800) for display, IBM Plex Sans
(400/500/600) for body, IBM Plex Mono (400/500) for anything countable.
**Not Inter.** Inter is the default of every AI product shipped in the last
three years, and looking like all of them is the one thing this brand cannot
afford. No purple, no gradients, no glassmorphism, no serif-on-cream.

## The legacy token aliases are deliberate

`--color-ink` used to be the dark BACKGROUND and `--color-paper` the light
TEXT. There are roughly 2,700 uses across 118 files, 84% of them in blog
posts. They are now aliases mapped **by role**: `--color-ink` resolves to
`--paper`, `--color-paper` resolves to `--ink`.

The names are wrong and the mapping is right. Do not "fix" them to match their
names; that inverts the entire site. New code uses the honest names.

## Motion

Button fill sweeps left to right on hover and focus-visible: a pseudo-element
at `scaleX(0)` with `transform-origin: left`, 320ms `cubic-bezier(.4,0,.2,1)`.
Never an animated width or background-position.

Scroll reveals use IntersectionObserver at threshold 0.15, unobserved after
firing once, 500ms `cubic-bezier(.16,1,.3,1)`, children staggered 60ms,
section-level blocks only, six per page maximum.

**The reveal class is added by JavaScript.** Nothing is hidden in CSS by
default. The previous framer-motion version server-rendered `opacity: 0` and
relied on hydration to undo it, so a page with blocked or slow JS rendered
blank. `prefers-reduced-motion: reduce` disables all of it.

## Still rejected, from 0004

No 3D hero treatments, no voice input, no audio.
