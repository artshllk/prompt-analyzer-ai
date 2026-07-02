/**
 * Local, non-authoritative sign-in hints. Real auth lives in httpOnly
 * cookies; these only shape the login experience - welcome-back copy,
 * a prefilled email, and whether Google One Tap may auto-select after
 * an explicit sign-out. All reads/writes tolerate missing storage
 * (SSR, private mode) by degrading to "no hint".
 */

export type SignInMethod = 'google' | 'email'

export interface LastSignIn {
  method: SignInMethod
  email: string | null
}

const LAST_KEY = 'dc:last-signin'
const SIGNED_OUT_KEY = 'dc:signed-out'

/** Record a completed sign-in and clear any explicit sign-out marker. */
export function rememberSignIn(method: SignInMethod, email: string | null) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ method, email }))
    localStorage.removeItem(SIGNED_OUT_KEY)
  } catch {}
}

/** Raw snapshot for useSyncExternalStore (strings are reference-stable). */
export function readLastSignInRaw(): string | null {
  try {
    return localStorage.getItem(LAST_KEY)
  } catch {
    return null
  }
}

export function parseLastSignIn(raw: string | null): LastSignIn | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.method !== 'google' && parsed?.method !== 'email') return null
    return {
      method: parsed.method,
      email: typeof parsed.email === 'string' ? parsed.email : null,
    }
  } catch {
    return null
  }
}

export function subscribeToStorage(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

/** The user chose to sign out; One Tap must not silently sign them back in. */
export function markSignedOut() {
  try {
    localStorage.setItem(SIGNED_OUT_KEY, '1')
  } catch {}
}

export function wasExplicitlySignedOut(): boolean {
  try {
    return localStorage.getItem(SIGNED_OUT_KEY) === '1'
  } catch {
    return false
  }
}
