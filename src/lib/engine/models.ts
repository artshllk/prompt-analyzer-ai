/**
 * Model assignments per pipeline stage - the single place model upgrades
 * happen. Pricing (July 2026, per 1M in/out):
 *
 *   gpt-5.4-nano       $0.20 / $1.25   - contrast lines, cheap utility calls
 *   gpt-5.4-mini       $0.75 / $4.50   - diagnose, free-tier rewrite, judge
 *   gemini-3.5-flash   $1.50 / $9.00   - Pro rewrite + critic (frontier-class)
 *
 * A full free session (diagnose + rewrite) lands around $0.01-0.02;
 * a Pro deep session (+ critic on Flash) around $0.06. See
 * .claude/plans and limits.ts for the quota math that keeps this sane.
 */

export const MODELS = {
  /** Stage 1+2+3 merged: intent triage, interpretation forks, rubric audit. */
  diagnose: 'gpt-5.4-mini',
  /** Stage 4: rewrite for free-tier users. */
  rewriteFree: 'gpt-5.4-mini',
  /** Stage 4: rewrite for Pro users (Gemini, with OpenAI fallback). */
  rewritePro: 'gemini-3.5-flash',
  /** Stage 5: Pro deep - hostile critique + refine. */
  critic: 'gemini-3.5-flash',
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
