'use client'

import { useState, useEffect } from 'react'

const DEMO_STEPS = [
  { id: 'input', label: 'Original prompt' },
  { id: 'score', label: 'Scored' },
  { id: 'question', label: 'Clarification asked' },
  { id: 'answer', label: 'Answer given' },
  { id: 'result', label: 'Improved' },
] as const

type StepId = typeof DEMO_STEPS[number]['id']

const WEAK_PROMPT = 'Write me a blog post about AI tools'
const CLARIFICATION = 'Who is the target audience - technical developers or general business users?'
const ANSWER = 'General business users who are curious but not technical'
const IMPROVED = 'Write a 900-word blog post for non-technical business professionals explaining the top 5 AI tools that save time in everyday work tasks. For each tool, include: what it does in one sentence, one concrete example of a task it handles, and an estimated time saved per week. Use a friendly, encouraging tone. Avoid technical jargon.'

const DIMENSIONS = [
  { name: 'Goal clarity', before: 14, after: 19 },
  { name: 'Context', before: 4, after: 18 },
  { name: 'Format', before: 2, after: 19 },
  { name: 'Constraints', before: 3, after: 17 },
  { name: 'Examples', before: 0, after: 16 },
]

function ScoreBar({ value, max = 20, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 bg-[#1e2d4a] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  )
}

export function PromptDemo() {
  const [step, setStep] = useState<StepId>('input')
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto) return
    const SEQUENCE: [StepId, number][] = [
      ['input', 1800],
      ['score', 2200],
      ['question', 2000],
      ['answer', 2200],
      ['result', 0],
    ]
    let i = SEQUENCE.findIndex(([s]) => s === step)
    if (i === -1 || i === SEQUENCE.length - 1) return
    const timer = setTimeout(() => {
      setStep(SEQUENCE[i + 1][0])
    }, SEQUENCE[i][1])
    return () => clearTimeout(timer)
  }, [step, auto])

  const scoreBefore = DIMENSIONS.reduce((a, d) => a + d.before, 0)
  const scoreAfter = DIMENSIONS.reduce((a, d) => a + d.after, 0)
  const showScore = step !== 'input'
  const showQuestion = step === 'question' || step === 'answer' || step === 'result'
  const showAnswer = step === 'answer' || step === 'result'
  const showResult = step === 'result'

  return (
    <div className="glass rounded-2xl border border-[#1e2d4a] overflow-hidden">
      {/* Step indicator */}
      <div className="flex items-center gap-0 border-b border-[#1e2d4a] px-5 py-3 overflow-x-auto">
        {DEMO_STEPS.map((s, i) => {
          const idx = DEMO_STEPS.findIndex(x => x.id === step)
          const done = i < idx
          const active = s.id === step
          return (
            <button
              key={s.id}
              onClick={() => { setAuto(false); setStep(s.id) }}
              className="flex items-center gap-2 shrink-0"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                done ? 'bg-emerald-500 text-white' : active ? 'bg-violet-600 text-white' : 'bg-[#1e2d4a] text-[#4a5a80]'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs transition-colors ${active ? 'text-[#f0f4ff]' : 'text-[#4a5a80]'}`}>
                {s.label}
              </span>
              {i < DEMO_STEPS.length - 1 && (
                <div className={`w-6 h-px mx-1 transition-colors ${done ? 'bg-emerald-500/40' : 'bg-[#1e2d4a]'}`} />
              )}
            </button>
          )
        })}
        {step === 'result' && (
          <button
            onClick={() => { setAuto(true); setStep('input') }}
            className="ml-auto text-xs text-violet-400 hover:text-violet-300 transition-colors shrink-0"
          >
            ↺ Replay
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Input prompt */}
        <div>
          <p className="text-[10px] text-[#4a5a80] uppercase tracking-wider font-semibold mb-2">Prompt entered</p>
          <div className="bg-[#080c18] rounded-xl p-4 border border-[#1e2d4a]">
            <p className="text-sm text-[#f0f4ff]">{WEAK_PROMPT}</p>
          </div>
        </div>

        {/* Score */}
        {showScore && (
          <div className="animate-fadeIn">
            <p className="text-[10px] text-[#4a5a80] uppercase tracking-wider font-semibold mb-2">Clarity score</p>
            <div className="bg-[#080c18] rounded-xl p-4 border border-[#1e2d4a] space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#8b9cc8]">Overall score</span>
                <span className={`text-lg font-bold transition-all ${showResult ? 'text-emerald-400' : 'text-red-400'}`}>
                  {showResult ? scoreAfter : scoreBefore}/100
                </span>
              </div>
              {DIMENSIONS.map(d => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-xs text-[#4a5a80] w-28 shrink-0">{d.name}</span>
                  <ScoreBar
                    value={showResult ? d.after : d.before}
                    color={showResult ? 'bg-emerald-500' : 'bg-red-500/60'}
                  />
                  <span className={`text-xs font-mono w-8 text-right ${showResult ? 'text-emerald-400' : 'text-red-400'}`}>
                    {showResult ? d.after : d.before}/20
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clarification */}
        {showQuestion && (
          <div className="animate-fadeIn">
            <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold mb-2">Deepclario asks</p>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-sm text-[#f0f4ff]">{CLARIFICATION}</p>
            </div>
          </div>
        )}

        {/* Answer */}
        {showAnswer && (
          <div className="animate-fadeIn">
            <p className="text-[10px] text-[#4a5a80] uppercase tracking-wider font-semibold mb-2">Your answer</p>
            <div className="bg-[#080c18] border border-[#1e2d4a] rounded-xl p-4">
              <p className="text-sm text-[#8b9cc8]">{ANSWER}</p>
            </div>
          </div>
        )}

        {/* Improved */}
        {showResult && (
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Improved prompt</p>
              <span className="text-xs text-emerald-400 font-bold">+{scoreAfter - scoreBefore} points</span>
            </div>
            <div className="bg-violet-500/5 border border-violet-500/25 rounded-xl p-4">
              <p className="text-sm text-[#f0f4ff] leading-relaxed">{IMPROVED}</p>
            </div>
            <div className="mt-3 text-center">
              <a
                href="/playground"
                className="inline-block px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
              >
                Try it with your own prompt →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
