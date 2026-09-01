/**
 * One real mistake, shown the way the product shows it.
 *
 * WHY THIS EXISTS. The page used to describe the mechanism, which tells a
 * visitor what we do and never tells them why they should care. This is a real
 * error found on a real, well-known SEO site, rendered exactly as the tool
 * renders it: the sentence marked, the source quote underneath, the note.
 *
 * The publisher is not named. The mistake is theirs and it is public, but
 * naming them to sell a tool is a different act from telling them privately,
 * and we have not told them yet.
 *
 * Static and pre-rendered. No API call, no state, visible on first paint
 * before anyone types a word. Someone should get this in five seconds without
 * scrolling.
 *
 * COPY RULE, stricter here than anywhere else on the site: basic English, read
 * once and understood. The words "citation", "verify", "claim" and "coverage"
 * do not appear. It says link, check, number, source.
 */
/**
 * `onDark` changes ONE thing: the card's border. Everything inside it sits on
 * white either way, so every colour in here is measured against white and none
 * of them move. A component that restyled its own contents based on what is
 * behind it would need every ratio checked twice.
 */
export function WorkedExample({ onDark }: { onDark?: boolean } = {}) {
  return (
    <section
      className="rounded-2xl p-5 sm:p-7"
      /* The card stays white on both grounds. That is the point of it: a
         marked-up page looks like paper, and paper does not go dark. */
      style={{
        background: 'var(--card)',
        border: `1px solid ${onDark ? 'transparent' : 'var(--rule)'}`,
      }}
      aria-label="An example of a mistake this finds"
    >

      <p className="text-[15px] leading-relaxed mb-4" style={{ color: 'var(--ink-soft)' }}>
        A big SEO site wrote this. It is still up.
      </p>

      {/* The sentence, marked the way the product marks it. The two swapped
          words carry the mark, not the whole sentence, because that is where
          the mistake is. */}
      <p
        className="text-[16px] sm:text-[17px] leading-[1.9] wrap-break-word"
        style={{ color: 'var(--ink)' }}
      >
        61.5% of{' '}
        <span
          className="px-1 py-1 -my-1 rounded-md"
          style={{
            background: 'var(--contradicted-bg)',
            color: 'var(--contradicted)',
            textDecoration: 'underline dotted 2px',
            textUnderlineOffset: '3px',
          }}
        >
          desktop
        </span>{' '}
        searches and 34.4% of{' '}
        <span
          className="px-1 py-1 -my-1 rounded-md"
          style={{
            background: 'var(--contradicted-bg)',
            color: 'var(--contradicted)',
            textDecoration: 'underline dotted 2px',
            textUnderlineOffset: '3px',
          }}
        >
          mobile
        </span>{' '}
        searches end without a click.
      </p>

      <div
        className="mt-5 pt-4"
        style={{ borderTop: '1px solid var(--rule)' }}
      >
        <p
          className="text-[12px] uppercase tracking-[0.12em] mb-2"
          style={{ color: 'var(--contradicted)', fontFamily: 'var(--font-mono)' }}
        >
          The page they link to says
        </p>
        <p
          className="text-[15px] leading-relaxed pl-3"
          style={{ borderLeft: '2px solid var(--contradicted)', color: 'var(--ink)' }}
        >
          61.5% of <strong>mobile</strong> searches and 34.3% of{' '}
          <strong>desktop</strong> searches end without a click.
        </p>

        <p className="mt-4 text-[15px] leading-relaxed" style={{ color: 'var(--ink)' }}>
          Same numbers. The two words are swapped.
        </p>
      </div>
    </section>
  )
}

/**
 * The second thing the tool does, in one line.
 *
 * Measured, not guessed: 55 of 114 numbers across 11 stats-heavy articles had
 * no link at all. Rounded to "half" because the exact figure invites a
 * question the sentence does not need to answer.
 */
export function NoLinkNote({ onDark }: { onDark?: boolean } = {}) {
  return (
    <p
      className="text-[15px] leading-relaxed"
      /* --ink-soft is 3.21:1 on the dark ground, so the dark section gets its
         own mute rather than the same token at a worse ratio. */
      style={{ color: onDark ? 'var(--mute-on-ink)' : 'var(--ink-soft)' }}
    >
      Half the numbers in posts like this have no link. We list those too.
    </p>
  )
}
