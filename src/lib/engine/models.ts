/**
 * Model assignments per pipeline stage - the single place model upgrades
 * happen. Pricing (July 2026, per 1M in/out):
 *
 *   gpt-5.4-nano       $0.20 / $1.25   - contrast lines, cheap utility calls
 *   gpt-5.4-mini       $0.75 / $4.50   - diagnose, free-tier rewrite, judge
 *   gemini-3.5-flash   $1.50 / $9.00   - Pro rewrite (frontier-class)
 *
 * A full free session (diagnose + rewrite) lands around $0.01-0.02.
 * See limits.ts for the quota math that keeps this sane.
 */

export const MODELS = {
  /**
   * Fast-path inline sharpen: one streaming call, no reasoning, no JSON
   * schema, no diagnosis. The extension's default action - optimized for
   * perceived latency (first token < 1s), not depth. nano is ~2x faster
   * and ~4x cheaper than mini and plenty for a single rewrite.
   */
  sharpen: 'gpt-5.4-nano',
  /**
   * Same fast path, for Pro. The extension's Improve button used to run nano
   * for everybody, which made Pro identical to free at the exact moment a
   * paying user is looking for their money's worth. Still OpenAI streaming,
   * so first-token latency stays in the same class; mini is ~4x nano per call
   * and Pro is unlimited, so this is the line to watch if Pro cost drifts.
   */
  sharpenPro: 'gpt-5.4-mini',
  /** Stage 1+2+3 merged: intent triage, interpretation forks, rubric audit. */
  diagnose: 'gpt-5.4-mini',
  /** Stage 4: rewrite for free-tier users. */
  rewriteFree: 'gpt-5.4-mini',
  /** Stage 4: rewrite for Pro users (Gemini, with OpenAI fallback). */
  rewritePro: 'gemini-3.5-flash',
  /** Stage 6: verification runs when the user hasn't picked a target model. */
  verifyDefault: 'gpt-5.4-mini',
  /** One-line before/after contrast in verification. */
  contrast: 'gpt-5.4-nano',
} as const

/** Gemini fallback cascade, strongest first. Used by gemini-client.ts. */
export const GEMINI_CASCADE = [
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
] as const
