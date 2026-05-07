'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'

const PaddleCtx = createContext<Paddle | null>(null)

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddle, setPaddle] = useState<Paddle | null>(null)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    if (!token) return
    initializePaddle({ environment: 'production', token }).then(p => {
      if (p) setPaddle(p)
    })
  }, [])

  return <PaddleCtx.Provider value={paddle}>{children}</PaddleCtx.Provider>
}

export function usePaddle() {
  return useContext(PaddleCtx)
}
