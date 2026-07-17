'use client'

import { useEffect, useState } from 'react'
import { EXTENSION_IDS } from '@/lib/extension-ids'

/**
 * The approve step.
 *
 * The old page minted a token on load and printed it for the user to copy.
 * Two things were wrong with that. The token was created whether or not the
 * user wanted one - a refresh minted another live credential - and the user
 * had to transcribe a secret to prove they meant it, which proves only that
 * they can copy text.
 *
 * Now the click IS the consent: nothing exists until Approve, and then the
 * token goes straight to the extension. The manual code stays as the
 * fallback for when we cannot reach it, which is a real case (extension not
 * installed yet, a locked-down browser, a stale build with no listener).
 */

type Phase =
  | 'checking' // looking for the extension
  | 'ready' // found it - offer Approve
  | 'working' // minting + handing over
  | 'done' // connected
  | 'manual' // no extension reachable - show the code instead
  | 'error'

interface ChromeLike {
  runtime?: {
    sendMessage: (
      id: string,
      msg: unknown,
      cb: (resp?: { ok?: boolean; version?: string }) => void
    ) => void
    lastError?: { message?: string }
  }
}

/** Ask one extension ID whether it is there. Never rejects: a missing
 *  extension surfaces as chrome.runtime.lastError, which we read and
 *  swallow, because "not installed" is an ordinary answer here. */
function ping(id: string): Promise<boolean> {
  return new Promise(resolve => {
    const chromeApi = (window as unknown as { chrome?: ChromeLike }).chrome
    if (!chromeApi?.runtime?.sendMessage) return resolve(false)
    try {
      chromeApi.runtime.sendMessage(id, { type: 'DEEPCLARIO_PING' }, resp => {
        void chromeApi.runtime?.lastError
        resolve(!!resp?.ok)
      })
    } catch {
      resolve(false)
    }
  })
}

function handoff(id: string, token: string): Promise<boolean> {
  return new Promise(resolve => {
    const chromeApi = (window as unknown as { chrome?: ChromeLike }).chrome
    if (!chromeApi?.runtime?.sendMessage) return resolve(false)
    try {
      chromeApi.runtime.sendMessage(id, { type: 'DEEPCLARIO_CONNECT', token }, resp => {
        void chromeApi.runtime?.lastError
        resolve(!!resp?.ok)
      })
    } catch {
      resolve(false)
    }
  })
}

export function ConnectApproveView({ email }: { email: string }) {
  const [phase, setPhase] = useState<Phase>('checking')
  const [extId, setExtId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Which extension are we talking to, if any? Done once on mount so the
  // button that appears is already the right button - offering "Approve"
  // and then discovering there is nothing to approve to would be worse
  // than showing the code from the start.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      for (const id of EXTENSION_IDS) {
        if (await ping(id)) {
          if (cancelled) return
          setExtId(id)
          setPhase('ready')
          return
        }
      }
      if (!cancelled) setPhase('manual')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function mint(): Promise<string | null> {
    try {
      const res = await fetch('/api/extension/issue-token', { method: 'POST' })
      if (!res.ok) return null
      const data = await res.json()
      return typeof data?.token === 'string' ? data.token : null
    } catch {
      return null
    }
  }

  async function approve() {
    if (!extId) return
    setPhase('working')

    const fresh = await mint()
    if (!fresh) {
      setPhase('error')
      return
    }

    const ok = await handoff(extId, fresh)
    if (ok) {
      setPhase('done')
      return
    }

    // The token exists now but never arrived. Show it rather than waste it -
    // the user can still finish by hand, which is the whole point of keeping
    // the fallback.
    setToken(fresh)
    setPhase('manual')
  }

  async function showCode() {
    setPhase('working')
    const fresh = await mint()
    if (!fresh) {
      setPhase('error')
      return
    }
    setToken(fresh)
    setPhase('manual')
  }

  async function copy() {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Insecure context or an old browser. The code is on screen and
      // selectable, so there is still a way through.
    }
  }

  if (phase === 'done') {
    return (
      <div className="mt-10">
        <div
          className="p-6 rounded-2xl"
          style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}
        >
          <p className="text-lg" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>
            Connected
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
            The extension is signed in as {email}. Go back to ChatGPT, Claude, or Gemini
            and press the Improve key. You can close this tab.
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'manual') {
    return (
      <div className="mt-10">
        {token ? (
          <>
            <p className="eyebrow mb-3">Your connection code</p>
            <div
              className="p-5 rounded-2xl flex items-center gap-3"
              style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}
            >
              <code
                className="flex-1 font-mono text-sm md:text-base break-all"
                style={{ color: 'var(--color-paper)' }}
              >
                {token}
              </code>
              <button
                type="button"
                onClick={copy}
                className="px-4 py-2 rounded-full text-sm transition-all btn-paper shrink-0"
                style={{ background: 'var(--color-paper)', color: 'var(--color-ink)', fontWeight: 500 }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-3 text-sm" style={{ color: 'var(--color-paper-mute)' }}>
              Paste this into the extension panel. Treat it like a password - anyone with
              the code can use your Deepclario allowance.
            </p>
          </>
        ) : (
          <>
            <div
              className="p-6 rounded-2xl"
              style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}
            >
              <p className="text-lg" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>
                We could not find the extension
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
                Install it first, then reload this page and it will connect with one
                click. Already installed? Get a code instead and paste it into the
                extension.
              </p>
            </div>
            <button
              type="button"
              onClick={showCode}
              className="mt-4 px-5 py-2.5 rounded-full text-sm transition-all btn-outline"
              style={{
                border: '1px solid var(--color-rule-strong)',
                color: 'var(--color-paper)',
                fontWeight: 500,
              }}
            >
              Get a connection code
            </button>
          </>
        )}
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="mt-10">
        <p className="text-sm" style={{ color: 'var(--color-paper-mute)' }}>
          Something went wrong issuing your code. Reload the page and try again.
        </p>
      </div>
    )
  }

  // checking | ready | working
  return (
    <div className="mt-10">
      <div
        className="p-6 rounded-2xl"
        style={{ background: 'var(--color-ink-card)', border: '1px solid var(--color-rule)' }}
      >
        <p className="text-lg" style={{ color: 'var(--color-paper)', fontWeight: 500 }}>
          Connect the Deepclario extension?
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-paper-mute)' }}>
          It will use your plan when you improve a prompt, and it will be able to
          see a prompt only when you press the Improve key. You can disconnect any
          time from Settings.
        </p>
        <button
          type="button"
          onClick={approve}
          disabled={phase !== 'ready'}
          className="mt-5 px-5 py-2.5 rounded-full text-sm transition-all btn-paper"
          style={{
            background: 'var(--color-paper)',
            color: 'var(--color-ink)',
            fontWeight: 500,
            opacity: phase === 'ready' ? 1 : 0.6,
            cursor: phase === 'ready' ? 'pointer' : 'default',
          }}
        >
          {phase === 'working' ? 'Connecting…' : phase === 'checking' ? 'Checking…' : 'Approve'}
        </button>
      </div>
    </div>
  )
}
