/**
 * What happens when we cannot check a link.
 *
 * THIS WAS MISSING FROM THE HOMEPAGE ENTIRELY, and it is the most
 * differentiating thing on the site. It only appeared in the results panel
 * after somebody had already pasted an article, so the one idea nobody else
 * has was invisible to everyone who had not already committed.
 *
 * It is also the honest part. Every other checker either judges a source it
 * could not read or says nothing at all. Saying WHICH KIND of nothing is the
 * whole argument, and it costs no judgement to say, so it can never be a false
 * accusation.
 *
 * The four states and their wording match readability.ts and severity.ts, so
 * the promise on this page is word for word what the product does.
 */

const STATES: { label: string; body: string }[] = [
  {
    label: 'No link at all',
    body: 'Nothing to open. In the posts we tested, half the numbers.',
  },
  {
    label: 'Behind a paywall',
    body: 'Your reader hits the same wall we did.',
  },
  {
    label: 'Dead link',
    body: 'It is gone. Your reader lands on nothing.',
  },
  {
    label: 'Live dashboard',
    body: 'The number moves. What they see is not what you wrote.',
  },
]

export function CannotCheck() {
  return (
    <section
      className="px-6 md:px-10 py-20 md:py-28"
      style={{ borderTop: '1px solid var(--rule)' }}
    >
      <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 md:gap-16">
        <div className="md:col-span-4">
          <p className="eyebrow mb-4">When we cannot check</p>
          <h2
            className="display text-3xl md:text-4xl leading-[1.1]"
            style={{ color: 'var(--ink)' }}
          >
            We tell you which kind of nothing.
          </h2>
          <p className="mt-4 text-[15px] leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>
            Not every link can be opened. Each one gets a reason.
          </p>
        </div>

        <div className="md:col-span-8">
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-7">
            {STATES.map(s => (
              <div key={s.label}>
                <dt
                  className="text-[15px] mb-1"
                  style={{ color: 'var(--ink)', fontWeight: 500 }}
                >
                  {s.label}
                </dt>
                <dd
                  className="text-[15px] leading-[1.6]"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  {s.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
