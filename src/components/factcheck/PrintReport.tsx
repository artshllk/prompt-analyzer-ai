import type { Claim } from '@/lib/factcheck/types'
import { stripLinkSyntax } from '@/lib/factcheck/paste'

/**
 * The report someone else reads.
 *
 * THE READER DID NOT RUN THE CHECK. It is an editor, a client, or a professor.
 * They have thirty seconds and have never heard of Deepclario. Everything here
 * is shaped by that: the finding is in the first line, every checked claim
 * carries the URL and the source's own sentence so it can be followed without
 * asking anyone, and the things we could not check are named rather than
 * omitted.
 *
 * IT NEVER SAYS THE DOCUMENT IS ACCURATE. It says which specific numbers were
 * checked against which specific pages on which date. Listing what was not
 * checked is what makes the rest believable, so the closing paragraph is not
 * decoration and does not get shortened.
 *
 * Rendered from the result already in the browser. No route, no storage, no
 * server call: `window.print()` does the work, so this keeps the promise that
 * we save nothing.
 */

/** Failure first, then the rest. Document order buries the finding at twelve. */
function orderChecked(claims: Claim[]): Claim[] {
  const failed = claims.filter(c => c.citation.check === 'does_not_contain')
  const passed = claims.filter(c => c.citation.check === 'supports')
  return [...failed, ...passed]
}

/** Why a claim was not checked, named, in the reader's language. */
function notCheckedReason(claim: Claim): string {
  if (claim.subject === 'first_party') {
    return "The author's own figure. Nobody outside can check it."
  }
  switch (claim.citation.unreadable) {
    case 'paywalled':
      return 'Behind a paywall. Your reader hits the same wall.'
    case 'dead':
      return 'The link is gone.'
    case 'live_source':
      return "Live dashboard. It only shows today's number."
    case 'no_source':
      return 'No source given.'
    default:
      break
  }
  if (claim.judgement.reason === 'live_source') {
    return "Live dashboard. It only shows today's number."
  }
  if (claim.sourceForm === 'none') return 'No source given.'
  return 'We could not finish checking this one.'
}

/**
 * The first line of the pasted text, so the reader can identify the document.
 *
 * Pasted text has no title. The first line is what a person would call it, and
 * it is already in front of them in the file they were sent.
 */
function documentTitle(text: string): string {
  /**
   * LINK SYNTAX IS OUR FORMATTING, NOT THEIR TITLE.
   *
   * Pasting out of a browser converts hrefs to markdown, so a first line that
   * carries a link arrived here as
   * "Mount Everest rises [8,849 metres](https://en.wikipedia.org/...) above
   * sea..." and the 90-character cut then spent most of its budget on a URL.
   * The reader of this report did not run the check and has never heard of us;
   * the first thing they see cannot be raw markup.
   *
   * Same helper the character counter measures with, so "what counts as the
   * writer's prose" has one definition.
   */
  const first =
    stripLinkSyntax(text).trim().split('\n').find(l => l.trim().length > 0) ?? ''
  const clean = first.trim().replace(/\s+/g, ' ')
  return clean.length > 90 ? clean.slice(0, 90).trimEnd() + '…' : clean
}

/**
 * The count line, and it carries the finding rather than making the reader
 * hunt for it. Never a score and never a percentage.
 */
function countLine(total: number, failed: number, passed: number, notChecked: number): string {
  const parts = [`${total} ${total === 1 ? 'number' : 'numbers'} found.`]
  if (failed > 0) {
    parts.push(
      failed === 1
        ? '1 does not match its source.'
        : `${failed} do not match their sources.`
    )
  }
  if (passed > 0) parts.push(`${passed} checked out.`)
  parts.push(`${notChecked} not checked.`)
  return parts.join(' ')
}

export function PrintReport({ text, claims }: { text: string; claims: Claim[] }) {
  const checked = orderChecked(claims)
  const notChecked = claims.filter(
    c => c.citation.check !== 'does_not_contain' && c.citation.check !== 'supports'
  )
  const failed = claims.filter(c => c.citation.check === 'does_not_contain').length
  const passed = claims.filter(c => c.citation.check === 'supports').length

  const runOn = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="print-report" style={{ fontFamily: 'var(--font-sans)', fontSize: '11pt', lineHeight: 1.45 }}>
      <header style={{ borderBottom: '1px solid #000', paddingBottom: '8pt', marginBottom: '12pt' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt' }}>
          <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>Source check</span>
          <span>deepclario.com</span>
        </div>
        <p style={{ margin: '6pt 0 2pt', fontSize: '13pt', fontWeight: 600 }}>
          {documentTitle(text) || 'Untitled document'}
        </p>
        <p style={{ margin: 0, fontSize: '9pt' }}>Checked {runOn}</p>
      </header>

      <p style={{ margin: '0 0 14pt', fontSize: '12pt', fontWeight: 600 }}>
        {countLine(claims.length, failed, passed, notChecked.length)}
      </p>

      {checked.length > 0 && (
        <section style={{ marginBottom: '14pt' }}>
          <h2 style={{ fontSize: '9pt', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #999', paddingBottom: '3pt', margin: '0 0 8pt' }}>
            Checked
          </h2>
          {checked.map(c => {
            const failedThis = c.citation.check === 'does_not_contain'
            const ev = c.citation.evidence[0]
            return (
              <div key={c.id} className="print-entry" style={{ marginBottom: '11pt' }}>
                <p style={{ margin: 0 }}>
                  <span style={{ fontWeight: 700, marginRight: '6pt' }}>{failedThis ? '✗' : '✓'}</span>
                  {c.claimText}
                </p>
                <p style={{ margin: '2pt 0 0 14pt', fontWeight: 600 }}>
                  {failedThis ? 'The page does not say this.' : 'The page says this.'}
                </p>
                {c.sourceUrl && (
                  <p style={{ margin: '2pt 0 0 14pt', fontSize: '9pt', wordBreak: 'break-all' }}>
                    {c.sourceUrl}
                  </p>
                )}
                {ev?.quote && (
                  <p style={{ margin: '2pt 0 0 14pt', fontSize: '10pt', fontStyle: 'italic' }}>
                    {failedThis ? 'The page says: ' : ''}
                    &ldquo;{ev.quote.replace(/\s+/g, ' ').slice(0, 300)}&rdquo;
                  </p>
                )}
              </div>
            )
          })}
        </section>
      )}

      {notChecked.length > 0 && (
        <section style={{ marginBottom: '14pt' }}>
          <h2 style={{ fontSize: '9pt', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #999', paddingBottom: '3pt', margin: '0 0 8pt' }}>
            Not checked
          </h2>
          {notChecked.map(c => (
            <div key={c.id} className="print-entry" style={{ marginBottom: '9pt' }}>
              <p style={{ margin: 0 }}>
                <span style={{ fontWeight: 700, marginRight: '6pt' }}>&ndash;</span>
                {c.claimText}
              </p>
              <p style={{ margin: '2pt 0 0 14pt' }}>{notCheckedReason(c)}</p>
              {c.sourceUrl && (
                <p style={{ margin: '2pt 0 0 14pt', fontSize: '9pt', wordBreak: 'break-all' }}>
                  {c.sourceUrl}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Not decoration, and it does not get shortened. */}
      <footer style={{ borderTop: '1px solid #000', paddingTop: '8pt', fontSize: '9pt' }}>
        <p style={{ margin: 0 }}>
          This is not a statement that the document is accurate. It lists which
          numbers were checked, against which pages, on the date above. A number
          we could not check is not a number we think is wrong.
        </p>
      </footer>
    </div>
  )
}
