'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'What does this do?',
    a: 'You paste an article. We open each link in it. Then we tell you what that page really says.',
  },
  {
    q: 'Do you tell me if a number is wrong?',
    a: 'No. We only tell you what the page says. A number can be right and the link still wrong.',
  },
  {
    q: 'What if a number has no link?',
    a: 'We list it. In the posts we tested, half the numbers had no link. That is usually the biggest group.',
  },
  {
    q: 'What if the page is behind a paywall?',
    a: 'We say so. Your reader will hit the same wall.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. Two checks a day. Ten if you make an account.',
  },
  {
    q: 'Do you keep my text?',
    a: 'No. We save nothing.',
  },
  {
    q: 'Who else sees it?',
    a: 'OpenAI, to run the check. Your links go to a search service that opens them.',
  },
  {
    q: 'What happened to the prompt tool?',
    a: 'It still works. We stopped adding to it. You can find it under Playground.',
  },
]

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <ul className="space-y-px">
      <li className="rule-strong" />
      {FAQS.map((faq, i) => {
        const isOpen = open === i
        return (
          <li key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-6 py-6 text-left row-hover -mx-3 px-3 rounded-md"
              aria-expanded={isOpen}
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
              >
                <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {isOpen && (
              <div className="pb-7 pr-10 -mt-2">
                <p
                  className="text-[15px] leading-[1.7]"
                  style={{ color: 'var(--color-paper-mute)' }}
                >
                  {faq.a}
                </p>
              </div>
            )}
            <div className="rule" />
          </li>
        )
      })}
    </ul>
  )
}
