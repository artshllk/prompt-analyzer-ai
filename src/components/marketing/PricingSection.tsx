'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const FREE_FEATURES = [
  { text: '25 prompt analyses per month', included: true },
  { text: 'AI clarity scoring (5 dimensions)', included: true },
  { text: 'Prompt rewriting with CRAFT framework', included: true },
  { text: '5 tone styles', included: true },
  { text: '7-day session history', included: true },
  { text: 'Weekly insights & pattern reports', included: false },
  { text: 'Full history (unlimited)', included: false },
  { text: 'Mistake pattern analysis', included: false },
]

const PRO_FEATURES = [
  { text: 'Unlimited analyses', included: true, highlight: true },
  { text: 'AI clarity scoring (5 dimensions)', included: true },
  { text: 'Prompt rewriting with CRAFT framework', included: true },
  { text: '5 tone styles', included: true },
  { text: 'Full history forever', included: true, highlight: true },
  { text: 'Weekly insights & pattern reports', included: true, highlight: true },
  { text: 'Mistake pattern analysis', included: true, highlight: true },
  { text: 'Priority support', included: true },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Annual toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm transition-colors ${!annual ? 'text-[#f0f4ff]' : 'text-[#4a5a80]'}`}>Monthly</span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-11 h-6 rounded-full transition-colors ${annual ? 'bg-violet-600' : 'bg-[#1e2d4a]'}`}
          aria-label="Toggle annual billing"
        >
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${annual ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
        <span className={`text-sm transition-colors ${annual ? 'text-[#f0f4ff]' : 'text-[#4a5a80]'}`}>
          Annual
          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">Save 20%</span>
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-6 border border-[#1e2d4a] bg-[#0f1628]"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold text-[#4a5a80] uppercase tracking-wider mb-2">Free</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-[#f0f4ff]">$0</span>
              <span className="text-sm text-[#4a5a80]">forever</span>
            </div>
            <p className="text-xs text-[#4a5a80] mt-2">Good for getting started</p>
          </div>

          <ul className="space-y-2.5 mb-6">
            {FREE_FEATURES.map(f => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                {f.included ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                    <circle cx="7" cy="7" r="6" stroke="#4a5a80" strokeWidth="1.2"/>
                    <path d="M4.5 7L6.5 9L9.5 5" stroke="#4a5a80" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5 opacity-30">
                    <circle cx="7" cy="7" r="6" stroke="#4a5a80" strokeWidth="1.2"/>
                    <path d="M5 9L9 5M5 5L9 9" stroke="#4a5a80" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                )}
                <span className={f.included ? 'text-[#8b9cc8]' : 'text-[#2d4070] line-through'}>{f.text}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/playground"
            className="block w-full py-3 rounded-xl text-sm font-semibold text-center border border-[#2d4070] text-[#8b9cc8] hover:border-[#4a5a80] hover:text-[#f0f4ff] transition-all"
          >
            Start analyzing free →
          </Link>
        </motion.div>

        {/* Pro */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative rounded-2xl pt-8 px-6 pb-6 border border-violet-500/40 bg-violet-600/10"
        >
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
            <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-bold whitespace-nowrap shadow-lg shadow-violet-600/30">Most Popular</span>
          </div>
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

          <div className="mb-6">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">Pro</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-[#f0f4ff]">
                {annual ? '$3.99' : '$4.99'}
              </span>
              <span className="text-sm text-[#4a5a80]">/month</span>
              {annual && <span className="text-xs text-[#4a5a80] ml-1">billed $47.88/year</span>}
            </div>
            <p className="text-xs text-[#8b9cc8] mt-2">For people who use AI every day</p>
          </div>

          <ul className="space-y-2.5 mb-6">
            {PRO_FEATURES.map(f => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                  <circle cx="7" cy="7" r="6" stroke="#7c3aed" strokeWidth="1.2"/>
                  <path d="M4.5 7L6.5 9L9.5 5" stroke="#7c3aed" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={f.highlight ? 'text-[#f0f4ff] font-medium' : 'text-[#8b9cc8]'}>{f.text}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/login"
            className="block w-full py-3 rounded-xl text-sm font-semibold text-center bg-violet-600 hover:bg-violet-500 text-white transition-all glow-violet"
          >
            Unlock Pro — {annual ? '$3.99' : '$4.99'}/month →
          </Link>
          <p className="text-center text-xs text-[#4a5a80] mt-3">Cancel anytime · No questions asked</p>
        </motion.div>
      </div>

      <p className="text-center text-xs text-[#4a5a80] mt-8">
        No credit card required to start.
      </p>
    </div>
  )
}
