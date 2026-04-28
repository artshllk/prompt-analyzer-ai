'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    sub: 'forever',
    features: ['25 prompt analyses / month', 'AI clarity scoring', 'Improvement suggestions', 'Tone control (5 styles)', '7-day session history'],
    cta: 'Get started free',
    href: '/login',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$5',
    sub: '/month · or $48/year',
    features: ['Unlimited analyses', 'Everything in Free', 'Full history forever', 'Weekly insights reports', 'Mistake pattern analysis', 'CSV export'],
    cta: 'Start Pro',
    href: '/login',
    highlight: true,
  },
]

export function PricingSection() {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
      {PLANS.map((plan, i) => (
        <motion.div
          key={plan.name}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          className={`relative rounded-2xl p-6 border ${
            plan.highlight
              ? 'border-violet-500/40 bg-violet-600/10'
              : 'border-[#1e2d4a] bg-[#0f1628]'
          }`}
        >
          {plan.highlight && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-bold">Most Popular</span>
            </div>
          )}
          {plan.highlight && (
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
          )}

          <div className="mb-5">
            <p className="text-sm font-medium text-[#8b9cc8] mb-1">{plan.name}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold text-[#f0f4ff]">{plan.price}</span>
              <span className="text-sm text-[#4a5a80]">{plan.sub}</span>
            </div>
          </div>

          <ul className="space-y-2.5 mb-6">
            {plan.features.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-[#8b9cc8]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                  <circle cx="7" cy="7" r="6" stroke={plan.highlight ? '#7c3aed' : '#4a5a80'} strokeWidth="1.2"/>
                  <path d="M4.5 7L6.5 9L9.5 5" stroke={plan.highlight ? '#7c3aed' : '#4a5a80'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href={plan.href}
            className={`block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all ${
              plan.highlight
                ? 'bg-violet-600 hover:bg-violet-500 text-white glow-violet'
                : 'border border-[#2d4070] text-[#8b9cc8] hover:border-[#4a5a80] hover:text-[#f0f4ff]'
            }`}
          >
            {plan.cta}
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
