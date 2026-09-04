---
name: Warm Editorial Truth
colors:
  surface: '#fbf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#fbf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e4e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#5b403b'
  inverse-surface: '#30312f'
  inverse-on-surface: '#f2f0ed'
  outline: '#8f706a'
  outline-variant: '#e3beb7'
  surface-tint: '#b5260b'
  primary: '#b12408'
  on-primary: '#ffffff'
  primary-container: '#d53d21'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a5'
  secondary: '#5f5e61'
  on-secondary: '#ffffff'
  secondary-container: '#e4e1e6'
  on-secondary-container: '#656467'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a5'
  on-primary-fixed: '#3e0400'
  on-primary-fixed-variant: '#8e1500'
  secondary-fixed: '#e4e1e6'
  secondary-fixed-dim: '#c8c5ca'
  on-secondary-fixed: '#1b1b1e'
  on-secondary-fixed-variant: '#47464a'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#fbf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2df'
  surface-subtle: '#F4EFEB'
  surface-card: '#FFFFFF'
  border-warm: '#E5E0D8'
  text-muted: '#71717A'
  claim-discrepancy: '#E11D48'
  claim-verified: '#10B981'
  accent-vermilion-hover: '#EA580C'
typography:
  display-hero:
    fontFamily: Newsreader
    fontSize: 56px
    fontWeight: '500'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 38px
    fontWeight: '500'
    lineHeight: 46px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  metric-display:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  eyebrow-mono:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2: 0.125rem
  space-4: 0.25rem
  space-8: 0.5rem
  space-12: 0.75rem
  space-16: 1rem
  space-20: 1.25rem
  space-24: 1.5rem
  space-32: 2rem
  space-48: 3rem
  space-64: 4rem
  space-96: 6rem
  container-max: 1180px
  gutter-desktop: 1.5rem
  gutter-mobile: 1rem
---

## Brand & Style

This design system embodies an editorial investigation desk fused with contemporary software rigor: "Stripe Press meets Linear." Built for researchers, journalists, and rigorous writers, the visual language rejects synthetic tech hype in favor of tactile honesty, deliberate typography, and high-clarity verification signals.

The aesthetic marries classical publishing craft—warm parchment surfaces, inked text contrast, and literary serif display heads—with the structural precision of modern developer tools. Every surface feels tangible, grounded, and quiet, allowing textual truths and source contradictions to command attention without sensory overload.

## Colors

The palette establishes an authentic paper-and-ink hierarchy:
- **Paper Canvas (`#FAF8F5`) & Inset Surface (`#F4EFEB`)**: Replaces sterile clinical whites with warm, non-glare editorial paper grounds that reduce eye strain during prolonged reading and verification audits.
- **Obsidian Ink (`#18181B`) & Crisp Slate (`#71717A`)**: The primary text mimics freshly pressed letterpress black, while secondary labels rely on neutral slate to preserve hierarchy without washed-out low contrast.
- **Warm Vermilion (`#F95738`, `#EA580C`)**: Used strictly for primary deliberate actions, high-leverage focus states, and the primary brand voice.
- **Verification Semantics (`#10B981` & `#E11D48`)**: Semantic pairs tuned for fact verification. Emerald signals intact citations and faithful claims; soft crimson pinpoints swapped terms, hallucinations, paywalls, or broken claims.
- **Structural Warmth (`#E5E0D8`)**: Fine, unyielding borders with gentle warmth that segment cards, split-screen comparisons, and comparison diff tables.

## Typography

The typography unites three distinct typographic traditions:
1. **Editorial Authority (Newsreader)**: Headlines, narrative declarations, and section headings leverage medium-weighted serifs with subtle literary italic alternates for emphasis and quotes.
2. **Utilitarian Clarity (Inter)**: Body copy, comparison prose, and instructional guidance use neutral sans-serif rendering for sustained readability across dense blocks of text.
3. **Forensic Precision (JetBrains Mono)**: Character counters (`0 / 12,000`), discrepancy labels, confidence ratios, eyebrows, and code-style source diff markers run in monospaced glyphs to signal mathematical rigor and systematic validation.

## Layout & Spacing

The layout adopts an aligned structural grid capped at `1180px` maximum width to preserve editorial reading rhythms (optimizing line lengths between 65–75 characters for analytical prose).

- **Grid Framework**: 12-column desktop layout utilizing `24px` gutters and variable margins. Collapses to 6 columns on tablet (`768px`) and a single fluid column on mobile (`<640px`).
- **Split Comparison Canvas**: Dedicated 50/50 side-by-side inspection viewports on desktop that transform into top/bottom tabbed panels on mobile viewports.
- **Rhythm Cadence**: Multiples of `8px` enforce structural rhythm, with tight `4px` adjustments reserved for badge padding, inline diff markers, and character counters.

## Elevation & Depth

This system avoids synthetic floating blurs and deep SaaS drop shadows. Visual depth is tactile, restrained, and grounded:

- **Surface Tiers**: Base background sits at `#FAF8F5`. Working documents, comparison viewports, and primary input zones reside on elevated white (`#FFFFFF`) or subdued secondary parchment (`#F4EFEB`).
- **Hairline Framing**: Structural depth is primarily articulated through crisp `1px` borders (`#E5E0D8`). Containers, input zones, and pricing cards establish boundaries via line weight rather than high-elevation blur.
- **Inner Top Highlight**: Primary action surfaces and buttons employ a tactile `1px` inner top rim (`inset 0 1px 0 rgba(255, 255, 255, 0.2)`) paired with an micro ambient ground shadow (`0 1px 2px rgba(24, 24, 27, 0.08)`), imparting the feel of a machined physical stamp.
- **Diff Layering**: When highlighting contradictory claims, inline differences are highlighted with tinted background fills (`#E11D48` at 8% opacity with a `1px` border underline) rather than floating tooltips.

## Shapes

The interface embraces a structured, "Soft" geometric profile (`roundedness: 1`). 

- **Base Radius**: Standard interactive elements (inputs, toolbars, buttons, tags) utilize `4px` to `6px` radii, echoing classic clipped paper borders and bound journal edges.
- **Large Containers**: Cards, pricing modules, and the central hero verification workspace utilize `8px` (`0.5rem`).
- **Status Indicators & Pills**: Meta counters and verification status tags utilize fully rounded capsule pills (`9999px`) to immediately separate metadata tags from content blocks.

## Components

### Buttons
- **Primary ("Check my links")**: Background in Vermilion (`#F95738`), text in `#FFFFFF`, with a `1px` inset top highlight (`inset 0 1px 0 rgba(255,255,255,0.25)`) and micro bottom rim (`inset 0 -1px 0 rgba(0,0,0,0.15)`). Hover transition shifts to `#EA580C`.
- **Secondary / Ghost**: Parchment surface with border `1px solid #E5E0D8`, text in Obsidian `#18181B`. Hover applies `#F4EFEB`.

### Input & Textarea Workspace
- Grounded in `#FFFFFF` with `1px solid #E5E0D8` border. Focus state elevates with a crisp Vermilion outline (`0 0 0 1px #F95738`).
- Bottom bar integration retains a fixed monospaced character counter (`0 / 12,000`) in `label-mono` along with quick paste/clear actions.

### Fact & Discrepancy Chips
- **Verified Match**: Pill badge with background `#10B981` (10% tint), border `1px solid rgba(16, 185, 129, 0.25)`, text `#047857` in `label-mono`.
- **Claim Discrepancy**: Pill badge with background `#E11D48` (10% tint), border `1px solid rgba(225, 29, 72, 0.25)`, text `#BE123C` in `label-mono`.
- **Edge Statuses (Paywall, Dead Link)**: Muted neutral pills with `#71717A` typography and `#F4EFEB` background.

### Comparison Diff View
- Side-by-side grid split by a central `1px` rule (`#E5E0D8`).
- Original text column displays detected claims; source citation column highlights corresponding matches or divergences using selective background fills with bold monospaced indicators.

### Cards & Pricing
- Flat, warm cards surrounded by `#E5E0D8` borders. Selected tiers (e.g., "Pro") incorporate an intentional vermilion accent eyebrow or upper border highlight.