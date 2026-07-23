/**
 * The image-prompt knowledge base. This is the proprietary substance of the
 * image feature: what an expert in each visual medium actually asks for, in the
 * words they use.
 *
 * It exists because "make it realistic" and "make it anime" are not two values
 * of one setting - they are two different vocabularies. A photographer reaches
 * for a lens, an aperture, a film stock and a lighting direction; an animation
 * director reaches for line weight, cel shading and a studio look. A prompt
 * that borrows the wrong vocabulary produces a plausible wrong image, which is
 * the exact failure this feature is built to stop.
 *
 * This deepens the single `image-generation` rubric in rubrics.ts into a
 * per-family model. Both the plan stage (which family is this, what is missing)
 * and the rewrite stage (write it like an expert in THIS family) read from here,
 * so the two can never disagree about what "cinematic" means.
 *
 * Output target: natural-language prompts for ChatGPT (GPT Image) and Gemini
 * (Imagen). No Midjourney parameter grammar (--ar, --style, --no) - those tools
 * are not where the extension runs.
 *
 * Pure data. No imports, no side effects, importable from anywhere.
 */

export type StyleFamily =
  | 'photoreal'
  | 'cinematic'
  | 'anime'
  | '3d-render'
  | 'illustration'
  | 'product'
  | 'logo'
  | 'concept-art'

export interface FamilyKnowledge {
  /** Shown to the user as a tappable answer. Plain words, no jargon. */
  label: string
  /** One line the plan stage uses to describe the look, in a fork option. */
  blurb: string
  /** The levers an expert in this medium pulls. Fed to the rewrite stage as the
   *  vocabulary to reach for - not a checklist to dump, a palette to choose
   *  from. Kept concrete and visualizable. */
  vocabulary: string
  /** What makes THIS family look cheap or wrong, so the rewrite avoids it. */
  pitfalls: string
}

export const STYLE_FAMILIES: Record<StyleFamily, FamilyKnowledge> = {
  photoreal: {
    label: 'Realistic photo',
    blurb: 'Looks like a real photograph, as if shot on a camera.',
    vocabulary:
      'camera and lens (35mm, 85mm portrait, macro), aperture and depth of field, film or sensor look, natural or studio lighting with a clear direction, time of day and weather, realistic materials and skin texture, believable imperfection over plastic perfection',
    pitfalls:
      'the waxy over-smoothed "AI face", impossible lighting, plastic skin, everything in focus when a real lens would not be',
  },
  cinematic: {
    label: 'Cinematic still',
    blurb: 'A dramatic movie-frame look, staged and lit like film.',
    vocabulary:
      'shot type (wide establishing, medium, close-up), anamorphic or spherical feel, colour grade (teal-orange, muted, high contrast), motivated lighting (key, rim, practical lights in frame), atmosphere (haze, volumetric light), mood and time of day, shallow depth of field',
    pitfalls:
      'flat even lighting that kills the drama, a grade so heavy it muddies the subject, staging with no focal point',
  },
  anime: {
    label: 'Anime / cartoon',
    blurb: 'Drawn animation look, from clean anime to Western cartoon.',
    vocabulary:
      'line weight and clean linework, cel shading vs soft gradient, flat colour blocks, expressive eyes and simplified anatomy, a named studio or era feel only when the user asks, background painting style, screen-tone or none',
    pitfalls:
      'realistic 3D shading bolted onto flat art, muddy colours, over-detailed backgrounds that fight the character',
  },
  '3d-render': {
    label: '3D render',
    blurb: 'A rendered 3D look, from Pixar-soft to hard product CGI.',
    vocabulary:
      'render feel (physically based, stylized soft, clay), materials (subsurface for skin, metal, glass, matte plastic), lighting rig with soft shadows and ambient occlusion, global illumination, level of surface detail, turntable vs scene',
    pitfalls:
      'the dead-eyed uncanny character, flat lighting with no occlusion, materials that all read as the same plastic',
  },
  illustration: {
    label: 'Illustration / painting',
    blurb: 'A hand-made illustrated or painted look.',
    vocabulary:
      'medium (gouache, watercolour, oil, ink, digital paint), visible brush or pen texture, paper or canvas grain, palette and colour harmony, line vs painterly edges, flat vs rendered light, level of finish (sketch to fully rendered)',
    pitfalls:
      'a digital look that betrays the claimed medium, texture applied evenly like a filter, muddy colour mixing',
  },
  product: {
    label: 'Product shot',
    blurb: 'A clean commercial photo of a single object.',
    vocabulary:
      'seamless or contextual background, softbox and reflector setup, reflections and highlight control, angle (three-quarter, top-down, eye-level), surface (glossy, matte), shadow (soft, hard, floating), negative space for copy, crisp focus on the product',
    pitfalls:
      'distracting background, blown-out highlights on glossy surfaces, an angle that hides the product, clutter',
  },
  logo: {
    label: 'Logo / icon',
    blurb: 'A flat, scalable brand mark or icon.',
    vocabulary:
      'mark vs wordmark vs combination, flat vector with clean geometry, deliberate negative space, a tight palette (one or two colours plus neutrals), works at small size, on a plain background, one clear idea rather than three',
    pitfalls:
      'photographic detail or gradients that will not scale down, embedded literal text that renders as garbled letters, three concepts crammed into one mark',
  },
  'concept-art': {
    label: 'Concept art',
    blurb: 'A mood-setting design frame for a character, place, or world.',
    vocabulary:
      'strong silhouette read, mood and palette first, environment scale and atmosphere, design intent (what is this FOR), painterly rendering, dramatic value contrast, a clear focal point',
    pitfalls:
      'pretty but unreadable, detail everywhere with no focal hierarchy, a palette with no mood decision behind it',
  },
}

/**
 * The order an expert lays an image prompt out. The rewrite stage follows this
 * so prompts read consistently and nothing important is buried. Lifted from the
 * image-generation rubric's rewriteStrategy in rubrics.ts.
 */
export const COMPOSITION_ORDER =
  'subject, then what it is doing, then the setting, then style, then lighting, then composition and framing, then what to exclude'

/**
 * Sensible aspect ratios by use, offered when the user has not said. Natural
 * language, because GPT Image and Imagen take words, not a --ar flag.
 */
export const ASPECT_GUIDANCE =
  'square for a profile or icon, portrait (tall) for a phone wallpaper or a standing figure, landscape (wide) for a scene or a banner, widescreen for a cinematic frame'

/**
 * The exclusions worth defaulting on for any generator, because they are the
 * artifacts users regenerate to escape. The rewrite folds in only the ones that
 * fit the request - a logo wants "no photographic detail", a portrait does not.
 */
export const DEFAULT_EXCLUSIONS =
  'garbled text and watermarks, extra fingers or limbs, distorted faces, random clutter that competes with the subject'

/** Compact digest of the families, injected into the plan stage's prompt. */
export function familyDigest(): string {
  return (Object.entries(STYLE_FAMILIES) as Array<[StyleFamily, FamilyKnowledge]>)
    .map(([key, f]) => `- ${key} (${f.label}): ${f.blurb}`)
    .join('\n')
}

/** The full knowledge for one chosen family, injected into the rewrite stage. */
export function familyBrief(family: StyleFamily | null): string {
  if (!family || !STYLE_FAMILIES[family]) {
    return 'No style chosen. Infer the most fitting look from the request and commit to it.'
  }
  const f = STYLE_FAMILIES[family]
  return [
    `Style: ${f.label}. ${f.blurb}`,
    `Reach for: ${f.vocabulary}`,
    `Avoid: ${f.pitfalls}`,
  ].join('\n')
}
