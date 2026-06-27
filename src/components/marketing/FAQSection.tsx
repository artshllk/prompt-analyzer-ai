'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'What does Deepclario actually do?',
    a: 'You type a rough prompt. Deepclario reviews it, asks one quick question if it has to, and rewrites it for clarity. ChatGPT, Claude, or Gemini get a brief they can actually act on, and you get the output you wanted on the first try.',
  },
  {
    q: 'Is Deepclario free to use?',
    a: 'Yes. The free plan gives you 25 prompt rewrites per month with full clarity scoring and the full rewrite. No credit card needed. Pro is $9.99 a month and removes the limit, adds full history, persona memory, and weekly insights.',
  },
  {
    q: 'Do I have to learn prompt engineering to use this?',
    a: 'No. That is the whole point. You write the rough idea. Deepclario fills in the gaps. You do not need to know what a system prompt is, or what CRAFT stands for, or what role-playing means. The product handles it.',
  },
  {
    q: 'What AI tools does this work with?',
    a: 'ChatGPT, Claude, Gemini, and any other major LLM. Deepclario improves the prompt itself, so the same rewrite works no matter which model you paste it into.',
  },
  {
    q: 'Why not just ask ChatGPT to improve my prompt?',
    a: 'You can, but you have to know your prompt was the problem in the first place. ChatGPT will not tell you. It will just produce something generic and leave you guessing. Deepclario catches the gap before you send. It asks one quick question if it has to, then hands you the fixed prompt. No rewrite spiral, no second guessing, no five-prompt session to land on the answer you wanted in the first place. One layer between you and every AI model. Same model. Better output. Less of your time.',
  },
  {
    q: 'What is prompt engineering?',
    a: 'Prompt engineering is the practice of writing instructions for an AI model that are specific enough to produce useful output. A good prompt names the role, the audience, the format, and the constraints. A bad prompt forces the model to guess. Deepclario does this work for you.',
  },
  {
    q: 'Does Deepclario store my prompts?',
    a: 'Signed-in users get full session history. Anonymous users (no account) get 2 free rewrites with no data stored. You can delete your account and all data at any time from Settings.',
  },
  {
    q: 'Can I cancel Pro anytime?',
    a: 'Yes. Cancel anytime from your account settings, no questions asked. You keep Pro access until the end of your billing period.',
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
