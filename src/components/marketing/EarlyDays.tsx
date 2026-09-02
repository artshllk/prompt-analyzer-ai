/**
 * The honest note. No demo, no testimonials, no CTA.
 *
 * This used to be a full "See it work" section containing the prompt improver
 * entire: a cover letter prompt, a clarifying question, the rewrite, and a
 * button to the extension. That product is frozen, and the section was the
 * second largest thing on a page about checking sources. It is gone.
 *
 * What survives is the only part that was ever about Deepclario rather than
 * about the improver: we do not invent reviews. The line "the example above is
 * a real rewrite" pointed at a rewrite that no longer exists, and now points at
 * the marked-up example that does.
 */
export function EarlyDays() {
  return (
    <section
      className="px-6 md:px-10 py-20 md:py-28"
      style={{ borderTop: '1px solid var(--rule)' }}
    >
      <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
        <div className="md:col-span-3">
          <p className="eyebrow">Early days</p>
        </div>
        <div className="md:col-span-9">
          <p className="text-[17px] leading-[1.7]" style={{ color: 'var(--ink)' }}>
            Deepclario is new, so you will not find made-up reviews here.
          </p>
          <p className="mt-3 text-[15px] leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>
            The example above is real, and still published. Run your own article
            and judge it yourself. If something looks wrong, reply to any of our
            emails. I read every one.
          </p>
          <p className="mt-4 text-sm" style={{ color: 'var(--ink-soft)' }}>
            Art, founder of Deepclario
          </p>
        </div>
      </div>
    </section>
  )
}
