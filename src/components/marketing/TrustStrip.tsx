import { formatStat } from '@/lib/stats'

/**
 * Hero trust strip. Surfaces factual signals only — never inflated counts.
 * Sits right under the hero CTAs. Four chips in a row on desktop, stack
 * gracefully on mobile.
 *
 * Rules of honesty:
 *   - Show the prompt count only if it is large enough to be credible.
 *     The page passes 0 when the threshold isn't met.
 *   - Every other claim must be factually true at all times.
 */
export function TrustStrip({ promptsCount }: { promptsCount: number }) {
  const items: { icon: React.ReactNode; label: string }[] = []

  if (promptsCount > 0) {
    items.push({
      icon: <Dot />,
      label: `${formatStat(promptsCount)}+ prompts improved`,
    })
  }

  items.push(
    { icon: <Dot />, label: 'ChatGPT, Claude, Gemini' },
    { icon: <Dot />, label: 'Chrome extension out now' },
  )

  return (
    <div
      className="mt-10 md:mt-12 flex flex-wrap items-center gap-x-6 gap-y-3"
      aria-label="Product highlights"
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: 'var(--color-paper-mute)' }}
        >
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-1.5 h-1.5 rounded-full"
      style={{ background: 'var(--color-accent)' }}
    />
  )
}
