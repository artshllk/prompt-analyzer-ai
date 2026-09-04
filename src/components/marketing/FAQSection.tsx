'use client'

import { useState } from 'react'
import { FAQS } from '@/lib/faq'


/**
 * The accordion controls VISIBILITY, not EXISTENCE.
 *
 * This used to be `{isOpen && <answer>}`, so a closed answer was never in the
 * DOM and never in the server HTML. Measured against production: the page
 * shipped all ten questions and ZERO answers, and `curl | grep` for any
 * answer text returned nothing.
 *
 * That is the most valuable text on the page and it was invisible to everyone
 * who is not running JavaScript, which includes every search crawler reading
 * the initial HTML. An FAQ is one of the few page types that can rank on the
 * answer text itself, and this one was offering ten headings and nothing to
 * read.
 *
 * So every answer is always rendered. `hidden` keeps it out of the accessible
 * tree and off the screen when closed, and it is a real attribute rather than
 * a class, so it works before the CSS loads too.
 */
export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <ul className="space-y-px">
      <li className="rule-strong" />
      {FAQS.map((faq, i) => {
        const isOpen = open === i
        const panelId = `faq-answer-${i}`
        const buttonId = `faq-question-${i}`
        return (
          <li key={i}>
            <button
              id={buttonId}
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-6 py-6 text-left row-hover -mx-3 px-3 rounded-md"
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span
                className="text-[15px] md:text-base leading-snug"
                style={{ color: 'var(--color-paper)', fontWeight: 500 }}
              >
                {faq.q}
              </span>
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                style={{ color: 'var(--color-paper-mute)' }}
                aria-hidden="true"
              >
                <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="pb-7 pr-10 -mt-2"
            >
              <p
                className="text-[15px] leading-[1.7]"
                style={{ color: 'var(--color-paper-mute)' }}
              >
                {faq.a}
              </p>
            </div>
            <div className="rule" />
          </li>
        )
      })}
    </ul>
  )
}
