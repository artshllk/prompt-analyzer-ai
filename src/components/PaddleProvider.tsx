'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'

/**
 * Paddle.js, and whether it is actually here.
 *
 * ===================================================================
 * WHY THIS EXPOSES A STATUS AND NOT JUST A CLIENT
 * ===================================================================
 *
 * It used to hand out `Paddle | null`, and every consumer wrote
 * `if (!paddle) return`. Null means three completely different things:
 *
 *   still loading      wait, it is about to arrive
 *   no token           billing is switched off in this environment
 *   failed             the CDN was blocked, or the token was rejected
 *
 * Collapsing them into one bare `return` is how the upgrade button became a
 * button that does nothing at all when clicked. No spinner, no message, no
 * console error - a real user clicked it and reported that "nothing is
 * shown", which is exactly right.
 *
 * `initializePaddle(...).then(...)` also had no `.catch()`, so a rejected
 * load was an unhandled promise rejection and the status stayed null for the
 * rest of the session with nothing recorded anywhere.
 */
export type PaddleStatus = 'loading' | 'ready' | 'disabled' | 'failed'

interface PaddleState {
  paddle: Paddle | null
  status: PaddleStatus
}

const PaddleCtx = createContext<PaddleState>({ paddle: null, status: 'loading' })

/**
 * Inlined at build time, so it is known during the first render and does not
 * need an effect to discover. Setting state synchronously inside an effect
 * would cost a cascading render for a value that never changes.
 */
const TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PaddleState>(() => ({
    paddle: null,
    // No token is not an error. Billing is simply not configured here, and
    // the button should say so rather than sit inert.
    status: TOKEN ? 'loading' : 'disabled',
  }))

  useEffect(() => {
    const token = TOKEN
    if (!token) return

    let cancelled = false
    /**
     * The environment follows the token, not a separate flag.
     *
     * A `test_` token against 'production' fails to initialise, and the old
     * hardcoded 'production' meant a sandbox token silently killed billing
     * with no clue why. Reading it off the token makes the two impossible to
     * disagree.
     */
    const environment = token.startsWith('test_') ? 'sandbox' : 'production'

    initializePaddle({ environment, token })
      .then(p => {
        if (cancelled) return
        if (p) setState({ paddle: p, status: 'ready' })
        else setState({ paddle: null, status: 'failed' })
      })
      .catch(err => {
        // Never an unhandled rejection. A blocked CDN or a rejected token is
        // a thing we can tell the reader about.
        console.error('[paddle] failed to initialise:', err)
        if (!cancelled) setState({ paddle: null, status: 'failed' })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return <PaddleCtx.Provider value={state}>{children}</PaddleCtx.Provider>
}

/** The client, or null. Prefer usePaddleState when null needs explaining. */
export function usePaddle() {
  return useContext(PaddleCtx).paddle
}

/** The client plus why it is missing, for anything a person clicks. */
export function usePaddleState() {
  return useContext(PaddleCtx)
}
