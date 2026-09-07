import Link from 'next/link'

/**
 * The fact-checker CTA, for the handful of posts where it is not noise.
 *
 * ON 15 POSTS OUT OF 56, AND THAT IS STILL THE POINT: this aside is an
 * interruption mid-article, so it only runs where the reader is already
 * thinking about whether the text is trustworthy. A CTA that appears
 * everywhere teaches a reader to stop seeing it.
 *
 * It is not the only checker link on the blog. The 15 AI-explainer and
 * model posts also END on a checker CTA, in the closing box every post
 * already has. That box is not an interruption, it is the sign-off, and it
 * used to advertise the frozen prompt improver. Repointing it is a different
 * decision from adding this aside, and the two do not overlap: the one post
 * that had both (why-ai-makes-mistakes) kept this aside and dropped the box.
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
 * LINKS TO `/`, NOT `/check`. `/check` is the signed-in app view: it is
 * noindex, nofollow and it 307s signed-out visitors to `/`. Nearly everyone
 * reading a blog post is signed out, so pointing here sent them through a
 * redirect and passed no ranking signal to anything. `/` is the checker's
 * real landing page.
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
        href="/"
        className="mt-3 inline-block text-[15px] underline underline-offset-4"
        style={{ color: 'var(--brand-text)' }}
      >
        Check your links →
      </Link>
    </aside>
  )
}
