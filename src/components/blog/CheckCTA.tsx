import Link from 'next/link'

/**
 * The fact-checker CTA, for the handful of posts where it is not noise.
 *
 * ON 15 POSTS OUT OF 57, AND THAT IS THE POINT. The other 42 are prompt
 * engineering and AI explainers, where a link to a source checker is an
 * interruption. A CTA that appears everywhere teaches a reader to stop seeing
 * it.
 *
 * TWO VARIANTS, BECAUSE THE READER ARRIVED WITH A DIFFERENT WORRY.
 *
 * `detector` runs on the thirteen AI-detection posts. Every one of them has
 * just explained that detectors guess from how predictable writing is, so the
 * honest bridge is to say what that cannot do and offer the part that can be
 * answered. It moves the reader from a question nobody can settle to one they
 * can settle in a minute.
 *
 * `hallucination` runs where the reader is already worried that AI invents
 * facts. No bridge is needed there, so it says the thing directly.
 *
 * Copy is deliberately basic English. The words "citation", "verify", "claim"
 * and "coverage" appear nowhere.
 */

const COPY = {
  detector:
    'A detector guesses whether a machine wrote this. It cannot tell you whether the numbers in it are true. That part you can actually check.',
  hallucination: 'Paste your draft and see which numbers your sources actually back up.',
} as const

export function CheckCTA({ variant }: { variant: keyof typeof COPY }) {
  return (
    <aside
      className="my-10 rounded-2xl p-5 sm:p-6"
      style={{ background: 'var(--card)', border: '1px solid var(--rule)' }}
    >
      <p className="text-[15px] sm:text-base leading-[1.7]" style={{ color: 'var(--ink)' }}>
        {COPY[variant]}
      </p>
      <Link
        href="/check"
        className="mt-3 inline-block text-[15px] underline underline-offset-4"
        style={{ color: 'var(--brand-text)' }}
      >
        Check your links →
      </Link>
    </aside>
  )
}
