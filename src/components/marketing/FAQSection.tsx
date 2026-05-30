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
    a: 'You can, but you have to know your prompt was the problem in the first place. ChatGPT will not tell you. It will just produce something generic and leave you guessing. Deepclario catches the gap before you send and does the rewrite for you, so you skip the back-and-forth.',
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
    <div className="space-y-2">
      {FAQS.map((faq, i) => (
        <div key={i} className="glass rounded-2xl border border-[#1e2d4a] overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            aria-expanded={open === i}
          >
            <span className="text-sm font-semibold text-[#f0f4ff]">{faq.q}</span>
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              className={`shrink-0 text-[#4a5a80] transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
            >
              <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {open === i && (
            <div className="px-5 pb-4">
              <p className="text-sm text-[#8b9cc8] leading-relaxed">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
