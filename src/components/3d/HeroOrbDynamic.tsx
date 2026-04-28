'use client'

import dynamic from 'next/dynamic'

const HeroOrb = dynamic(
  () => import('./HeroOrb').then(m => ({ default: m.HeroOrb })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-violet-600/30 to-cyan-500/20 blur-2xl animate-pulse" />
      </div>
    ),
  }
)

export function HeroOrbDynamic() {
  return <HeroOrb />
}
