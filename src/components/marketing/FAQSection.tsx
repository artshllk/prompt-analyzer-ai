'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'What is prompt engineering?',
    a: 'Prompt engineering is the practice of structuring your instructions to an AI model so it produces consistently useful output. A well-engineered prompt specifies role, context, output format, and constraints - reducing guesswork and dramatically improving response quality.',
  },
  {
    q: 'Is Deepclario free to use?',
    a: 'Yes. The free plan gives you 25 prompt analyses per month with full AI improvement, clarity scoring, and tone control. No credit card needed. The Pro plan ($4.99/month) adds unlimited analyses, full history, and weekly insight reports.',
  },
  {
    q: 'How does Deepclario improve my prompts?',
    a: 'Deepclario scores your prompt across 5 dimensions (goal clarity, context, format, constraints, examples). If your score is below 80%, it asks up to 3 targeted clarifying questions to understand your intent. Then it rewrites your prompt using the CRAFT framework and shows exactly what changed and why.',
  },
  {
    q: 'What AI tools does this work with?',
    a: 'The improved prompts work with any AI - ChatGPT, Claude, Gemini, Grok, Copilot, or any other LLM. Deepclario improves the prompt itself, not the AI you use it with.',
  },
  {
    q: "Why not just ask ChatGPT to improve my prompt?",
    a: "ChatGPT will rewrite your prompt, but it won't score it, identify which specific dimensions are weak, ask the targeted questions that actually matter, or track your improvement over time. Deepclario is purpose-built for this workflow - it makes you better at prompting, not just dependent on a tool.",
  },
  {
    q: 'What is the CRAFT framework?',
    a: 'CRAFT stands for Context, Role, Action, Format, and Tone/Constraints. It\'s a structured approach to writing prompts that ensures every critical element is present. Deepclario uses it as the foundation for every rewrite.',
  },
  {
    q: 'Does Deepclario store my prompts?',
    a: 'Signed-in users get full session history. Anonymous users (no account) get 2 free analyses with no data stored. You can delete your account and all data at any time from Settings.',
  },
  {
    q: 'Can I cancel Pro anytime?',
    a: 'Yes. Cancel anytime from your account settings - no questions asked. You keep Pro access until the end of your billing period.',
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
