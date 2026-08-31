/**
 * The palette and type scale, in one place, shared with the web app.
 *
 * WHY THIS FILE EXISTS
 *
 * These values were hand-copied as hex into four files (popup.html, panel.js,
 * and two blocks inside content.js) and had already drifted: the extension
 * used #8FB4F2 as its accent where the app used #5B8FED, so the two halves of
 * one product were literally different colours. Nobody noticed because you
 * never see them side by side.
 *
 * KEEP IN SYNC WITH src/app/globals.css. There is no build step here (the
 * extension ships as raw files, which is a feature: it is auditable by anyone
 * who unzips it), so this cannot import from the app. It is a copy, and the
 * comment above each group says what it is a copy of.
 *
 * Colours and typography only. The extension deliberately does not carry the
 * app's components or its features.
 */

const DC = {
  /* --- surfaces --- */
  paper: '#F1F0EA',
  card: '#FFFFFF',

  /* --- text --- */
  ink: '#15130F',
  inkSoft: '#6B6559',

  /* --- lines --- */
  rule: '#DFDCD2',
  ruleStrong: '#CFCBBE',

  /* --- brand --- */
  brand: '#C9452F',
  brandDeep: '#A93520',

  /* --- meaning. Only ever these three things. --- */
  machine: '#2C5FD4',
  machineBg: '#E8EEFC',
  guess: '#8F5D12',
  guessAccent: '#B8791A',
  guessBg: '#FBF1DE',
  confirm: '#2E6F4E',
  confirmBg: '#E4EFE8',

  /* --- type ---
     The app self-hosts Bricolage Grotesque and IBM Plex. A content script
     cannot load a web font into a host page without asking for permissions
     this extension deliberately does not have, so the chip uses the system
     stack. The palette is what carries the brand here, not the typeface. */
  fontSans:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "IBM Plex Sans", system-ui, sans-serif',
  fontMono:
    'ui-monospace, SFMono-Regular, Menlo, "IBM Plex Mono", monospace',

  /* Label styling, matching .eyebrow in the app. */
  eyebrow: 'font-size:11px;font-weight:500;letter-spacing:.12em;text-transform:uppercase',
}

/** Every surface builds its CSS from these, so one edit moves all of them. */
DC.cssVars = `
  --dc-paper:${DC.paper};
  --dc-card:${DC.card};
  --dc-ink:${DC.ink};
  --dc-ink-soft:${DC.inkSoft};
  --dc-rule:${DC.rule};
  --dc-rule-strong:${DC.ruleStrong};
  --dc-brand:${DC.brand};
  --dc-brand-deep:${DC.brandDeep};
  --dc-machine:${DC.machine};
  --dc-machine-bg:${DC.machineBg};
  --dc-guess:${DC.guess};
  --dc-guess-accent:${DC.guessAccent};
  --dc-guess-bg:${DC.guessBg};
  --dc-confirm:${DC.confirm};
  --dc-confirm-bg:${DC.confirmBg};
  --dc-font:${DC.fontSans};
  --dc-mono:${DC.fontMono};
`

if (typeof window !== 'undefined') window.DC_TOKENS = DC
if (typeof globalThis !== 'undefined') globalThis.DC_TOKENS = DC
