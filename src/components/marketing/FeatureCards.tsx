'use client'

import { motion } from 'framer-motion'

const FEATURES = [
  {
    icon: '🔍',
    title: 'Deep Analysis',
    desc: 'Scores your prompt across 5 dimensions: goal clarity, context, format, constraints, and examples.',
    color: 'from-violet-600/20 to-violet-600/5',
    border: 'border-violet-500/20',
  },
  {
    icon: '🎯',
    title: 'Socratic Coaching',
    desc: 'AI acts like a senior engineer. It asks clarifying questions before rewriting - not after.',
    color: 'from-cyan-600/20 to-cyan-600/5',
    border: 'border-cyan-500/20',
  },
  {
    icon: '📈',
    title: 'Track Progress',
    desc: 'Weekly insight reports show your common mistakes and how your prompt writing improves over time.',
    color: 'from-emerald-600/20 to-emerald-600/5',
    border: 'border-emerald-500/20',
  },
]

export function FeatureCards() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {FEATURES.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className={`rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} p-6`}
        >
          <span className="text-3xl mb-4 block">{f.icon}</span>
          <h3 className="font-bold text-[#f0f4ff] mb-2">{f.title}</h3>
          <p className="text-sm text-[#8b9cc8] leading-relaxed">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  )
}
