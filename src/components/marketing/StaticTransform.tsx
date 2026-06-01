/**
 * Static replacement for the old scroll-pinned CinematicHero.
 *
 * Same three-act story (brief sent → questions a teammate would ask
 * → prompt the model understands) but laid out as three columns of
 * elevated cards. No scroll-jacking, no sticky positioning, no
 * staged animations. Renders identically on mobile and desktop, fast.
 *
 * Why this exists: the cinematic version looked great but consumed
 * 300vh of scroll and competed with the LivePromptDemo above it for
 * "show me what it does" attention. This is the calmer version.
 */

const VAGUE_PROMPT = 'Write me a blog post about AI'

const QUESTIONS = [
  { q: 'Who is this for?', a: 'B2B marketing leaders deciding where AI fits in their team.' },
  { q: 'What should they do after reading it?', a: 'Walk into Monday with an opinion they can defend.' },
  { q: 'How long, and what tone?', a: '1,200 words. Direct. No hype, no bullet soup.' },
]

const REWRITTEN_PROMPT = `Act as a senior content strategist writing for B2B marketing leaders.

Write a 1,200-word essay titled "Where AI replaces marketers, and where it doesn't." Use three concrete examples per side. End with a one-paragraph recommendation for a director-level reader who needs to brief their team Monday.

Tone: direct. No hype. No bullet-point soup.`

export function StaticTransform() {
  return (
    <section
      className="px-6 md:px-10 py-24 md:py-32"
      style={{ borderTop: '1px solid var(--color-rule)' }}
      aria-label="From rough idea to a prompt the model understands"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="grid md:grid-cols-12 gap-8 md:gap-16 mb-14 md:mb-20">
          <div className="md:col-span-3">
            <p className="eyebrow">From rough idea to answer</p>
          </div>
          <div className="md:col-span-9">
            <h2
              className="display text-4xl md:text-6xl"
              style={{ color: 'var(--color-paper)' }}
            >
              The same prompt,{' '}
              <span className="accent">three times better.</span>
            </h2>
            <p
              className="mt-6 text-lg leading-relaxed max-w-2xl"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              A real example. The brief, the questions Deepclario asks, the prompt that actually ships.
            </p>
          </div>
        </div>

        {/* Three stage cards */}
        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          <StageCard
            stage="01"
            title="Brief you sent"
            scoreLabel="Clarity"
            score={22}
            scoreClass="lo"
          >
            <p
              className="font-serif text-[1.4rem] md:text-[1.55rem] leading-snug"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              &ldquo;{VAGUE_PROMPT}.&rdquo;
            </p>
            <p
              className="mt-5 text-sm leading-[1.6]"
              style={{ color: 'var(--color-paper-mute)' }}
            >
              Eight words. The model has to guess audience, length, tone, goal, structure.
            </p>
          </StageCard>

          <StageCard
            stage="02"
            title="Questions a teammate would ask"
            scoreLabel="Clarity"
            score={22}
            scoreClass="lo"
          >
            <ul className="space-y-4">
              {QUESTIONS.map((item, i) => (
                <li key={i} className="pl-4" style={{ borderLeft: '1px solid var(--color-rule-strong)' }}>
                  <p
                    className="text-[15px] mb-1 font-serif"
                    style={{ color: 'var(--color-paper)', fontStyle: 'italic', fontWeight: 400 }}
                  >
                    {item.q}
                  </p>
                  <p className="text-[13px] leading-[1.5]" style={{ color: 'var(--color-paper-mute)' }}>
                    {item.a}
                  </p>
                </li>
              ))}
            </ul>
          </StageCard>

          <StageCard
            stage="03"
            title="Prompt the model understands"
            scoreLabel="Clarity"
            score={87}
            scoreClass="hi"
          >
            <p
              className="text-[13.5px] leading-[1.6] whitespace-pre-line font-serif"
              style={{ color: 'var(--color-paper)', fontWeight: 400 }}
            >
              {REWRITTEN_PROMPT}
            </p>
          </StageCard>
        </div>
      </div>
    </section>
  )
}

function StageCard({
  stage,
  title,
  scoreLabel,
  score,
  scoreClass,
  children,
}: {
  stage: string
  title: string
  scoreLabel: string
  score: number
  scoreClass: 'lo' | 'mid' | 'hi'
  children: React.ReactNode
}) {
  const scoreColor =
    scoreClass === 'lo' ? '#C25E5E'
    : scoreClass === 'hi' ? 'var(--color-accent-bright)'
    : 'var(--color-paper-mute)'

  return (
    <div className="card-editorial p-7 md:p-8 h-full flex flex-col">
      <div className="flex items-baseline justify-between mb-5">
        <span className="font-serif text-2xl tabular-nums" style={{ color: 'var(--color-paper-mute)' }}>
          {stage}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="eyebrow">{scoreLabel}</span>
          <span
            className="font-serif text-3xl tabular-nums"
            style={{ fontWeight: 400, color: scoreColor }}
          >
            {score}
          </span>
        </div>
      </div>
      <p
        className="text-[11px] font-medium tracking-[0.16em] uppercase mb-6"
        style={{ color: 'var(--color-paper)' }}
      >
        {title}
      </p>
      <div className="flex-1">{children}</div>
    </div>
  )
}
